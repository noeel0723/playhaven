<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameList;
use App\Models\User;
use App\Services\ProfilePhotos;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameActionCardTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_photo_creates_only_a_private_profile_without_requiring_information(): void
    {
        Storage::set('local', Storage::fake('game-action-photos-'.getmypid()));
        $owner = User::factory()->create();
        $this->actingAs($owner)->get(route('players.edit'))->assertInertia(fn (Assert $page) => $page->where('profile', null));
        $this->assertDatabaseCount('user_profiles', 0);
        $this->post(route('players.photo.store'), ['avatar' => UploadedFile::fake()->image('me.png', 128, 128)])
            ->assertSessionHasNoErrors()->assertRedirect(route('players.edit').'#profile-photo');
        $profile = $owner->profile()->sole();
        $this->assertFalse($profile->is_public);
        $this->assertNull($profile->username);
        $this->assertNull($profile->display_name);
        $this->assertTrue(Storage::disk('local')->exists($profile->avatar_path));
        $url = ProfilePhotos::url($profile, true);
        $this->get($url)->assertOk();
        $this->actingAs(User::factory()->create())->get($url)->assertNotFound();
    }

    public function test_first_top_four_save_creates_a_private_profile_without_saving_information(): void
    {
        $owner = User::factory()->create();
        $games = Game::factory()->count(4)->create();
        $this->actingAs($owner)->put(route('players.showcase'), ['top_games' => $games->pluck('id')->all(), 'share_recent_completed' => false])->assertSessionHasNoErrors();
        $profile = $owner->profile()->sole();
        $this->assertFalse($profile->is_public);
        $this->assertNull($profile->username);
        $this->assertSame($games->pluck('id')->all(), $profile->topGames()->pluck('games.id')->all());
        $this->assertDatabaseCount('library_entries', 0);
        $this->get('/players')->assertInertia(fn (Assert $page) => $page->has('players.data', 0));
    }

    public function test_invalid_first_shelf_save_does_not_create_a_profile(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner)->put(route('players.showcase'), ['top_games' => [99999], 'share_recent_completed' => false])->assertSessionHasErrors('top_games.0');
        $this->assertDatabaseCount('user_profiles', 0);
    }

    public function test_library_membership_can_be_saved_without_a_status_and_removed_status_is_rejected(): void
    {
        $owner = User::factory()->create();
        $game = Game::factory()->create();
        $this->actingAs($owner)->put(route('library.save', $game->slug), ['status' => null, 'is_favorite' => true])->assertSessionHasNoErrors();
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page->where('libraryEntry.status', null)->where('libraryEntry.is_favorite', true));
        $this->get(route('library.index'))->assertInertia(fn (Assert $page) => $page->where('counts.total', 1)->where('counts.favorites', 1)->missing('counts.backlog'));
        $this->put(route('library.save', $game->slug), ['status' => 'backlog', 'is_favorite' => false])->assertSessionHasErrors('status');
        $this->assertDatabaseHas('library_entries', ['user_id' => $owner->id, 'game_id' => $game->id, 'status' => null, 'is_favorite' => true]);
    }

    public function test_action_card_only_receives_the_viewers_lists_and_can_add_without_leaving_game(): void
    {
        $owner = User::factory()->create();
        $game = Game::factory()->create();
        $list = GameList::factory()->for($owner)->create(['visibility' => 'private']);
        $other = GameList::factory()->create(['name' => 'OTHER USER PRIVATE LIST']);
        $this->actingAs($owner)->get(route('games.show', $game->slug))->assertDontSee('OTHER USER PRIVATE LIST')->assertInertia(fn (Assert $page) => $page
            ->has('availableLists', 1)->where('availableLists.0.id', $list->id)->where('availableLists.0.contains_game', false));
        $this->post(route('list-items.store', $list), ['game_id' => $game->id, 'return_to_game' => true])->assertRedirect(route('games.show', $game->slug));
        $this->post(route('list-items.store', $list), ['game_id' => $game->id, 'return_to_game' => true])->assertRedirect(route('games.show', $game->slug));
        $this->assertDatabaseCount('game_list_items', 1);
        $this->post(route('list-items.store', $other), ['game_id' => $game->id, 'return_to_game' => true])->assertNotFound();
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page->where('availableLists.0.contains_game', true));
        $this->assertDatabaseCount('library_entries', 0);
    }
}
