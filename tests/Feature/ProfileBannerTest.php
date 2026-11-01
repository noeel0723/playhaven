<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserProfile;
use App\Services\ProfileBanners;
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

class ProfileBannerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::set('local', Storage::fake('profile-banners-'.getmypid()));
    }

    private function player(bool $public = true): User
    {
        $user = User::factory()->create();
        UserProfile::factory()->for($user)->create(['is_public' => $public]);

        return $user;
    }

    private function upload(User $user, string $name = 'landscape.jpg'): string
    {
        $this->actingAs($user)->post(route('players.banner.store'), ['banner' => UploadedFile::fake()->image($name, 1200, 800)])
            ->assertSessionHasNoErrors()->assertRedirect(route('players.edit').'#profile-banner');

        return $user->profile()->firstOrFail()->banner_path;
    }

    public static function formats(): array
    {
        return [['landscape.jpg'], ['landscape.png'], ['landscape.webp']];
    }

    #[DataProvider('formats')]
    public function test_banner_is_normalized_and_profile_pages_expose_only_controlled_urls(string $name): void
    {
        $user = $this->player();
        $path = $this->upload($user, $name);
        $this->assertMatchesRegularExpression('/^profile-banners\/[a-f0-9]{32}\.webp$/', $path);
        $bytes = Storage::disk('local')->get($path);
        $size = getimagesizefromstring($bytes);
        $this->assertSame(1600, $size[0]);
        $this->assertSame(600, $size[1]);
        $this->assertSame('image/webp', $size['mime']);
        $url = ProfileBanners::url($user->profile()->firstOrFail());
        $this->get(route('players.edit'))->assertDontSee($path)->assertInertia(fn (Assert $page) => $page
            ->where('profile.banner_url', $url)->missing('profile.banner_path'));
        $this->get(route('players.me'))->assertDontSee($path)->assertInertia(fn (Assert $page) => $page
            ->where('player.banner_url', $url)->missing('player.banner_path'));
        Auth::logout();
        $this->get(route('players.show', $user->profile->username))->assertInertia(fn (Assert $page) => $page
            ->where('player.banner_url', $url)->missing('player.banner_path'));
        $this->get(route('players.index'))->assertInertia(fn (Assert $page) => $page->missing('players.data.0.banner_url'));
        $response = $this->get($url)->assertOk()->assertHeader('Content-Type', 'image/webp')
            ->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('Cache-Control', 'no-store, private');
        $this->assertSame($bytes, $response->streamedContent());
    }

    public function test_private_banner_is_owner_only_and_visibility_changes_revoke_known_urls(): void
    {
        $owner = $this->player(false);
        $this->upload($owner);
        $profile = $owner->profile()->firstOrFail();
        $url = ProfileBanners::url($profile, true);
        $this->assertNull(ProfileBanners::url($profile));
        $this->get($url)->assertOk();
        Auth::logout();
        $this->get($url)->assertNotFound();
        $this->actingAs(User::factory()->create())->get($url)->assertNotFound();
        $profile->update(['is_public' => true]);
        Auth::logout();
        $this->get($url)->assertOk();
        $profile->update(['is_public' => false]);
        $this->get($url)->assertNotFound();
        $profile->update(['is_public' => true, 'username' => null]);
        $this->get($url)->assertNotFound();
    }

    public function test_banner_can_be_uploaded_before_profile_details_and_does_not_change_other_fields(): void
    {
        $owner = User::factory()->create();
        $this->upload($owner);
        $profile = $owner->profile()->firstOrFail();
        $this->assertFalse($profile->is_public);
        $this->assertNull($profile->username);
        $this->assertNull($profile->avatar_path);
        $profile->forceFill(['bio' => 'Keep my bio', 'avatar_path' => 'avatars/'.str_repeat('b', 32).'.webp'])->save();
        $this->upload($owner);
        $this->assertSame('Keep my bio', $profile->fresh()->bio);
        $this->assertSame('avatars/'.str_repeat('b', 32).'.webp', $profile->fresh()->avatar_path);
    }

    public function test_replacement_and_removal_retire_old_urls_and_files(): void
    {
        $owner = $this->player();
        $old = $this->upload($owner);
        $oldUrl = ProfileBanners::url($owner->profile()->firstOrFail());
        $new = $this->upload($owner, 'replacement.png');
        $newUrl = ProfileBanners::url($owner->profile()->firstOrFail());
        $this->assertNotSame($old, $new);
        Storage::disk('local')->assertMissing($old);
        $this->get($oldUrl)->assertNotFound();
        $this->delete(route('players.banner.destroy'))->assertRedirect(route('players.edit').'#profile-banner');
        Storage::disk('local')->assertMissing($new);
        $this->assertNull($owner->profile()->firstOrFail()->banner_path);
        $this->get($newUrl)->assertNotFound();
        $this->delete(route('players.banner.destroy'))->assertRedirect();
    }

    public function test_upload_and_removal_cannot_target_another_owner_or_arbitrary_paths(): void
    {
        $owner = $this->player();
        $other = $this->player();
        $otherPath = $this->upload($other);
        Storage::disk('local')->put('private-sentinel.txt', 'Keep');
        $this->actingAs($owner)->post(route('players.banner.store'), [
            'banner' => UploadedFile::fake()->image('own.png', 600, 200),
            'user_id' => $other->id, 'user_profile_id' => $other->profile->id, 'banner_path' => $otherPath,
        ])->assertSessionHasNoErrors();
        $this->assertSame($otherPath, $other->profile()->firstOrFail()->banner_path);
        $this->delete(route('players.banner.destroy'), ['user_id' => $other->id, 'banner_path' => $otherPath])->assertRedirect();
        Storage::disk('local')->assertExists($otherPath);
        $owner->profile()->firstOrFail()->forceFill(['banner_path' => '../private-sentinel.txt'])->save();
        $this->delete(route('players.banner.destroy'))->assertRedirect();
        Storage::disk('local')->assertExists('private-sentinel.txt');
        $this->assertNull(ProfileBanners::url($owner->profile()->firstOrFail(), true));
    }

    public function test_invalid_uploads_preserve_current_banner_and_do_not_write_extra_files(): void
    {
        $owner = $this->player();
        $path = $this->upload($owner);
        $invalid = [
            UploadedFile::fake()->createWithContent('bad.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>bad()</script></svg>'),
            UploadedFile::fake()->image('bad.gif', 600, 200),
            UploadedFile::fake()->createWithContent('bad.jpg', '<?php echo "bad";'),
            UploadedFile::fake()->image('bad.exe', 600, 200),
            UploadedFile::fake()->create('huge.jpg', 5121, 'image/jpeg'),
            UploadedFile::fake()->image('tiny.jpg', 599, 200),
            UploadedFile::fake()->image('short.jpg', 600, 199),
            UploadedFile::fake()->image('wide.jpg', 5001, 200),
            UploadedFile::fake()->image('tall.jpg', 600, 3001),
        ];
        foreach ($invalid as $file) {
            $this->post(route('players.banner.store'), ['banner' => $file])->assertSessionHasErrors('banner');
            $this->assertSame($path, $owner->profile()->firstOrFail()->banner_path);
            $this->assertCount(1, Storage::disk('local')->allFiles('profile-banners'));
        }
    }

    public function test_missing_files_bad_shapes_and_unauthenticated_writes_are_rejected(): void
    {
        $this->post(route('players.banner.store'))->assertRedirect(route('login'));
        $this->delete(route('players.banner.destroy'))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->unverified()->create())->post(route('players.banner.store'))->assertRedirect(route('verification.notice'));
        $owner = User::factory()->create();
        $this->actingAs($owner)->post(route('players.banner.store'))->assertSessionHasErrors('banner');
        $this->post(route('players.banner.store'), ['banner' => 'raw-path.webp'])->assertSessionHasErrors('banner');
        $this->post(route('players.banner.store'), ['banner' => [UploadedFile::fake()->image('array.png', 600, 200)]])->assertSessionHasErrors('banner');
        $this->assertDatabaseCount('user_profiles', 0);
        $this->assertCount(0, Storage::disk('local')->allFiles('profile-banners'));
    }

    public function test_deletion_cleans_banner_after_commit_and_rollback_preserves_it(): void
    {
        $owner = $this->player();
        $path = $this->upload($owner);
        try {
            DB::transaction(function () use ($owner): void {
                $owner->delete();
                throw new RuntimeException('Rollback');
            });
        } catch (RuntimeException) {
            $this->assertDatabaseHas('users', ['id' => $owner->id]);
            Storage::disk('local')->assertExists($path);
        }
        User::findOrFail($owner->id)->delete();
        Storage::disk('local')->assertMissing($path);
        $other = $this->player();
        $otherPath = $this->upload($other);
        $other->profile()->firstOrFail()->delete();
        Storage::disk('local')->assertMissing($otherPath);
    }

    public function test_banner_is_center_cropped_and_original_content_is_not_retained(): void
    {
        $owner = $this->player();
        $image = imagecreatetruecolor(800, 800);
        imagefill($image, 0, 0, imagecolorallocate($image, 255, 0, 0));
        imagefilledrectangle($image, 0, 250, 799, 549, imagecolorallocate($image, 0, 0, 255));
        ob_start();
        imagepng($image);
        $bytes = ob_get_clean();
        $this->actingAs($owner)->post(route('players.banner.store'), ['banner' => UploadedFile::fake()->createWithContent('crop.png', $bytes.'SOURCE-CONTENT-TO-DROP')])->assertSessionHasNoErrors();
        $encoded = Storage::disk('local')->get($owner->profile()->firstOrFail()->banner_path);
        $this->assertStringNotContainsString('SOURCE-CONTENT-TO-DROP', $encoded);
        $decoded = imagecreatefromstring($encoded);
        $pixel = imagecolorsforindex($decoded, imagecolorat($decoded, 800, 300));
        $this->assertGreaterThan(230, $pixel['blue']);
        $this->assertLessThan(20, $pixel['red']);
    }

    public function test_storage_failure_preserves_existing_banner(): void
    {
        $owner = $this->player();
        $path = $this->upload($owner);
        $disk = Storage::disk('local');
        $unavailable = \Mockery::mock(FilesystemAdapter::class);
        $unavailable->shouldReceive('put')->once()->andReturn(false);
        Storage::shouldReceive('disk')->with('local')->andReturn($unavailable);
        $this->post(route('players.banner.store'), ['banner' => UploadedFile::fake()->image('new.png', 600, 200)])->assertSessionHasErrors('banner');
        $this->assertSame($path, $owner->profile()->firstOrFail()->banner_path);
        $disk->assertExists($path);
    }

    public function test_missing_or_invalid_identifiers_cannot_serve_another_file(): void
    {
        $owner = $this->player();
        $path = $this->upload($owner);
        $url = ProfileBanners::url($owner->profile()->firstOrFail());
        Storage::disk('local')->delete($path);
        $this->get($url)->assertNotFound();
        $this->get('/player-banners/'.$owner->profile->id.'/'.str_repeat('a', 32))->assertNotFound();
        $this->get('/player-banners/'.$owner->profile->id.'/file.php')->assertNotFound();
    }

    public function test_banner_mutations_are_throttled_without_changing_existing_state(): void
    {
        $owner = $this->player();
        $this->actingAs($owner);
        for ($i = 0; $i < 10; $i++) {
            $this->delete(route('players.banner.destroy'))->assertSessionHasNoErrors();
        }
        $this->delete(route('players.banner.destroy'))->assertSessionHasErrors('banner');
        $this->assertNull($owner->profile()->firstOrFail()->banner_path);
    }
}
