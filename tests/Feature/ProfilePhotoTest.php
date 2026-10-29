<?php

namespace Tests\Feature;

use App\Models\GameList;
use App\Models\LibraryEntry;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\ProfilePhotos;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class ProfilePhotoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::set('local', Storage::fake('profile-photos-'.getmypid()));
    }

    private function player(bool $public = true): User
    {
        $user = User::factory()->create();
        UserProfile::factory()->for($user)->create(['is_public' => $public]);

        return $user;
    }

    private function upload(User $user, string $name = 'portrait.jpg'): string
    {
        $this->actingAs($user)->post(route('players.photo.store'), ['avatar' => UploadedFile::fake()->image($name, 640, 400)])
            ->assertSessionHasNoErrors()->assertRedirect(route('players.edit').'#profile-photo');

        return $user->profile()->firstOrFail()->avatar_path;
    }

    public static function formats(): array
    {
        return [['portrait.jpg'], ['portrait.png'], ['portrait.webp']];
    }

    #[DataProvider('formats')]
    public function test_uploads_are_normalized_to_square_webp_and_expose_only_controlled_urls(string $name): void
    {
        $user = $this->player();
        $path = $this->upload($user, $name);
        $this->assertMatchesRegularExpression('/^avatars\/[a-f0-9]{32}\.webp$/', $path);
        Storage::disk('local')->assertExists($path);
        $bytes = Storage::disk('local')->get($path);
        $size = getimagesizefromstring($bytes);
        $this->assertSame(512, $size[0]);
        $this->assertSame(512, $size[1]);
        $this->assertSame('image/webp', $size['mime']);
        $url = ProfilePhotos::url($user->profile()->firstOrFail());
        $this->get(route('players.edit'))->assertDontSee($path)->assertInertia(fn (Assert $page) => $page
            ->where('profile.avatar_url', $url)->where('auth.user.avatar', $url)->missing('profile.avatar_path')->missing('auth.user.profile'));
        Auth::logout();
        $response = $this->get($url)->assertOk()->assertHeader('Content-Type', 'image/webp')->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('Cache-Control', 'no-store, private');
        $this->assertSame($bytes, $response->streamedContent());
    }

    public function test_private_photos_are_owner_only_and_publishing_or_hiding_updates_access(): void
    {
        $owner = $this->player(false);
        $this->upload($owner);
        $profile = $owner->profile()->firstOrFail();
        $url = ProfilePhotos::url($profile, true);
        $this->assertNull(ProfilePhotos::url($profile));
        $this->get($url)->assertOk();
        Auth::logout();
        $this->get($url)->assertNotFound();
        $this->actingAs(User::factory()->create())->get($url)->assertNotFound();
        $profile->update(['is_public' => true]);
        Auth::logout();
        $this->get($url)->assertOk();
        $profile->update(['is_public' => false]);
        $this->get($url)->assertNotFound();
    }

    public function test_replacing_and_removing_photos_retire_old_urls_and_files(): void
    {
        $owner = $this->player();
        $oldPath = $this->upload($owner);
        $oldUrl = ProfilePhotos::url($owner->profile()->firstOrFail());
        $newPath = $this->upload($owner, 'replacement.png');
        $this->assertNotSame($oldPath, $newPath);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($newPath);
        $this->get($oldUrl)->assertNotFound();
        $newUrl = ProfilePhotos::url($owner->profile()->firstOrFail());
        $this->delete(route('players.photo.destroy'))->assertRedirect(route('players.edit').'#profile-photo');
        Storage::disk('local')->assertMissing($newPath);
        $this->get($newUrl)->assertNotFound();
        $this->assertNull($owner->profile()->firstOrFail()->avatar_path);
        $this->delete(route('players.photo.destroy'))->assertRedirect();
    }

    public function test_photo_changes_cannot_target_another_profile_or_arbitrary_paths(): void
    {
        $owner = $this->player();
        $other = $this->player();
        $otherPath = $this->upload($other);
        Storage::disk('local')->put('private-sentinel.txt', 'Keep this file.');
        $this->actingAs($owner)->post(route('players.photo.store'), ['avatar' => UploadedFile::fake()->image('own.png', 100, 100), 'user_id' => $other->id, 'user_profile_id' => $other->profile->id, 'avatar_path' => $otherPath])->assertRedirect();
        $this->assertSame($otherPath, $other->profile()->firstOrFail()->avatar_path);
        $this->delete(route('players.photo.destroy'), ['user_id' => $other->id, 'avatar_path' => $otherPath])->assertRedirect();
        Storage::disk('local')->assertExists($otherPath);
        $owner->profile()->update(['avatar_path' => '../private-sentinel.txt']);
        $this->delete(route('players.photo.destroy'))->assertRedirect();
        Storage::disk('local')->assertExists('private-sentinel.txt');
        $this->assertNull(ProfilePhotos::url($owner->profile()->firstOrFail()));
    }

    public function test_invalid_formats_sizes_and_dimensions_preserve_the_current_photo(): void
    {
        $owner = $this->player();
        $path = $this->upload($owner);
        $invalid = [
            UploadedFile::fake()->createWithContent('image.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
            UploadedFile::fake()->image('animated.gif', 100, 100),
            UploadedFile::fake()->createWithContent('script.jpg', '<?php echo "bad";'),
            UploadedFile::fake()->image('photo.exe', 100, 100),
            UploadedFile::fake()->create('huge.jpg', 5121, 'image/jpeg'),
            UploadedFile::fake()->image('tiny.jpg', 32, 32),
            UploadedFile::fake()->image('wide.jpg', 4097, 64),
        ];
        foreach ($invalid as $file) {
            $this->post(route('players.photo.store'), ['avatar' => $file])->assertSessionHasErrors('avatar');
            $this->assertSame($path, $owner->profile()->firstOrFail()->avatar_path);
            $this->assertCount(1, Storage::disk('local')->allFiles('avatars'));
        }
    }

    public function test_missing_files_and_invalid_shapes_are_rejected(): void
    {
        $this->actingAs($this->player())->post(route('players.photo.store'), [])->assertSessionHasErrors('avatar');
        $this->post(route('players.photo.store'), ['avatar' => 'avatars/raw-path.webp'])->assertSessionHasErrors('avatar');
        $this->post(route('players.photo.store'), ['avatar' => [UploadedFile::fake()->image('bad-array.png', 80, 80)]])->assertSessionHasErrors('avatar');
        $this->assertCount(0, Storage::disk('local')->allFiles('avatars'));
    }

    public function test_guest_unverified_and_profileless_accounts_cannot_upload_photos(): void
    {
        $this->post(route('players.photo.store'))->assertRedirect(route('login'));
        $this->delete(route('players.photo.destroy'))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->unverified()->create())->post(route('players.photo.store'))->assertRedirect(route('verification.notice'));
        $this->actingAs(User::factory()->create())->post(route('players.photo.store'), ['avatar' => UploadedFile::fake()->image('photo.jpg', 80, 80)])->assertSessionHasErrors('avatar');
        $this->assertDatabaseCount('user_profiles', 0);
        $this->assertCount(0, Storage::disk('local')->allFiles('avatars'));
    }

    public function test_public_surfaces_use_the_photo_url_and_hidden_profiles_never_publish_it(): void
    {
        $owner = $this->player();
        $this->upload($owner);
        $profile = $owner->profile()->firstOrFail();
        $url = ProfilePhotos::url($profile);
        $entry = LibraryEntry::factory()->for($owner)->create();
        Review::factory()->for($entry)->create(['is_public' => true]);
        GameList::factory()->for($owner)->create(['visibility' => 'public']);
        Auth::logout();
        $this->get('/players/'.$profile->username)->assertInertia(fn (Assert $page) => $page->where('player.avatar_url', $url)->where('reviews.data.0.author.avatar_url', $url)->where('lists.data.0.owner.avatar_url', $url));
        $this->get('/players')->assertInertia(fn (Assert $page) => $page->where('players.data.0.avatar_url', $url));
        $this->get('/community')->assertInertia(fn (Assert $page) => $page->where('reviews.data.0.author.avatar_url', $url));
        $this->get(route('games.show', $entry->game->slug))->assertInertia(fn (Assert $page) => $page->where('reviews.data.0.author.avatar_url', $url));
        $profile->update(['is_public' => false]);
        $this->get(route('games.show', $entry->game->slug))->assertInertia(fn (Assert $page) => $page->where('reviews.data.0.author.avatar_url', null));
        $this->get($url)->assertNotFound();
    }

    public function test_account_and_profile_deletion_remove_owned_photo_files(): void
    {
        $owner = $this->player();
        $path = $this->upload($owner);
        $other = $this->player();
        $otherPath = $this->upload($other);
        $owner->delete();
        Storage::disk('local')->assertMissing($path);
        Storage::disk('local')->assertExists($otherPath);
        $other->profile()->firstOrFail()->delete();
        Storage::disk('local')->assertMissing($otherPath);
    }

    public function test_rolled_back_account_deletion_preserves_the_photo(): void
    {
        $owner = $this->player();
        $path = $this->upload($owner);
        try {
            DB::transaction(function () use ($owner): void {
                $owner->delete();
                throw new RuntimeException('Roll back this deletion.');
            });
        } catch (RuntimeException) {
            $this->assertDatabaseHas('users', ['id' => $owner->id]);
            Storage::disk('local')->assertExists($path);
        }
    }

    public function test_reencoded_photos_drop_trailing_source_content_and_center_crop(): void
    {
        $owner = $this->player();
        $image = imagecreatetruecolor(128, 64);
        imagefill($image, 0, 0, imagecolorallocate($image, 255, 0, 0));
        imagefilledrectangle($image, 32, 0, 95, 63, imagecolorallocate($image, 0, 0, 255));
        ob_start();
        imagepng($image);
        $bytes = ob_get_clean();
        $this->actingAs($owner)->post(route('players.photo.store'), ['avatar' => UploadedFile::fake()->createWithContent('crop.png', $bytes.'<?php SOURCE-CONTENT-TO-DROP ?>')])->assertSessionHasNoErrors();
        $encoded = Storage::disk('local')->get($owner->profile()->firstOrFail()->avatar_path);
        $this->assertStringNotContainsString('SOURCE-CONTENT-TO-DROP', $encoded);
        $decoded = imagecreatefromstring($encoded);
        $color = imagecolorsforindex($decoded, imagecolorat($decoded, 256, 256));
        $this->assertGreaterThan(230, $color['blue']);
        $this->assertLessThan(20, $color['red']);
    }

    public function test_missing_or_wrong_photo_identifiers_cannot_read_storage(): void
    {
        $owner = $this->player();
        $path = $this->upload($owner);
        $url = ProfilePhotos::url($owner->profile()->firstOrFail());
        Storage::disk('local')->delete($path);
        $this->get($url)->assertNotFound();
        $this->get('/player-photos/'.$owner->profile->id.'/'.str_repeat('a', 32))->assertNotFound();
        $this->get('/player-photos/'.$owner->profile->id.'/file.php')->assertNotFound();
        $this->get('/player-photos/'.$owner->profile->id.'/../private-sentinel.txt')->assertNotFound();
    }

    public function test_jpeg_camera_orientation_is_applied_before_cropping(): void
    {
        $owner = $this->player();
        $image = imagecreatetruecolor(64, 128);
        imagefill($image, 0, 0, imagecolorallocate($image, 255, 0, 0));
        imagefilledrectangle($image, 32, 0, 63, 127, imagecolorallocate($image, 0, 0, 255));
        ob_start();
        imagejpeg($image, null, 95);
        $jpeg = ob_get_clean();
        $exif = "Exif\0\0II\x2a\0\x08\0\0\0\x01\0\x12\x01\x03\0\x01\0\0\0\x06\0\0\0\0\0\0\0";
        $jpeg = substr($jpeg, 0, 2)."\xff\xe1".pack('n', strlen($exif) + 2).$exif.substr($jpeg, 2);
        $this->actingAs($owner)->post(route('players.photo.store'), ['avatar' => UploadedFile::fake()->createWithContent('camera.jpg', $jpeg)])->assertSessionHasNoErrors();
        $encoded = Storage::disk('local')->get($owner->profile()->firstOrFail()->avatar_path);
        $decoded = imagecreatefromstring($encoded);
        $top = imagecolorsforindex($decoded, imagecolorat($decoded, 256, 128));
        $bottom = imagecolorsforindex($decoded, imagecolorat($decoded, 256, 384));
        $this->assertGreaterThan(230, $top['red']);
        $this->assertGreaterThan(230, $bottom['blue']);
        $this->assertStringNotContainsString('Exif', $encoded);
    }

    public function test_png_transparency_is_preserved(): void
    {
        $owner = $this->player();
        $image = imagecreatetruecolor(64, 64);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        $this->actingAs($owner)->post(route('players.photo.store'), ['avatar' => UploadedFile::fake()->createWithContent('transparent.png', $png)])->assertSessionHasNoErrors();
        $decoded = imagecreatefromstring(Storage::disk('local')->get($owner->profile()->firstOrFail()->avatar_path));
        $color = imagecolorsforindex($decoded, imagecolorat($decoded, 100, 100));
        $this->assertSame(127, $color['alpha']);
    }

    public function test_a_failed_storage_write_preserves_the_previous_photo(): void
    {
        $owner = $this->player();
        $path = $this->upload($owner);
        $disk = Storage::disk('local');
        $unavailable = \Mockery::mock(FilesystemAdapter::class);
        $unavailable->shouldReceive('put')->once()->andReturn(false);
        Storage::shouldReceive('disk')->with('local')->andReturn($unavailable);
        $this->post(route('players.photo.store'), ['avatar' => UploadedFile::fake()->image('new.png', 80, 80)])->assertSessionHasErrors('avatar');
        $this->assertSame($path, $owner->profile()->firstOrFail()->avatar_path);
        $disk->assertExists($path);
    }

    public function test_profile_form_cannot_set_a_storage_path_and_photo_changes_are_throttled(): void
    {
        $owner = $this->player();
        $profile = $owner->profile()->firstOrFail();
        $this->actingAs($owner)->put(route('players.update'), ['username' => $profile->username, 'display_name' => 'Player', 'bio' => '', 'is_public' => true, 'avatar_path' => 'avatars/'.str_repeat('a', 32).'.webp'])->assertSessionHasNoErrors();
        $this->assertNull($profile->fresh()->avatar_path);
        for ($i = 0; $i < 10; $i++) {
            $this->delete(route('players.photo.destroy'))->assertRedirect();
        }
        $this->delete(route('players.photo.destroy'))->assertSessionHasErrors('avatar');
    }
}
