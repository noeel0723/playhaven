<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlayerShowcaseTest extends TestCase
{
    use RefreshDatabase;

    private function player(array $changes = []): User
    {
        $user = User::factory()->create();
        UserProfile::factory()->for($user)->create(['username' => 'shelf_player', 'is_public' => true, ...$changes]);

        return $user;
    }

    public function test_top_four_are_explicit_ordered_picks_and_reordering_does_not_change_player_history(): void
    {
        $user = $this->player();
        $games = Game::factory()->count(4)->create();
        $entry = LibraryEntry::factory()->for($user)->for($games[0])->create(['is_favorite' => false]);
        $before = $entry->fresh()->getRawOriginal();
        $ids = $games->pluck('id')->all();
        $this->actingAs($user)->put(route('players.showcase'), ['top_games' => $ids])->assertRedirect(route('players.edit').'#profile-shelves');
        $this->assertSame($ids, $user->profile->topGames()->pluck('games.id')->all());
        $this->put(route('players.showcase'), ['top_games' => array_reverse($ids)])->assertRedirect();
        $this->assertSame(array_reverse($ids), $user->profile->topGames()->pluck('games.id')->all());
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
        $this->assertDatabaseCount('library_entries', 1);
        $this->get('/players/shelf_player')->assertInertia(fn (Assert $page) => $page->has('topGames', 4)
            ->where('topGames.0.id', $games[3]->id)->where('topGames.3.id', $games[0]->id)->missing('topGames.0.pivot')->missing('topGames.0.library_entries'));
    }

    public function test_shelves_are_scoped_to_the_authenticated_profile_and_can_be_cleared(): void
    {
        $owner = $this->player();
        $other = UserProfile::factory()->create();
        $otherGame = Game::factory()->create();
        $other->topGames()->attach($otherGame, ['position' => 1]);
        $game = Game::factory()->create();
        $this->actingAs($owner)->put(route('players.showcase'), ['top_games' => [$game->id], 'user_id' => $other->user_id, 'user_profile_id' => $other->id])->assertRedirect();
        $this->assertSame([$otherGame->id], $other->topGames()->pluck('games.id')->all());
        $this->assertFalse($other->fresh()->is_public);
        $this->put(route('players.showcase'), ['top_games' => []])->assertRedirect();
        $this->assertSame(0, $owner->profile->topGames()->count());
        $this->assertTrue($owner->profile->fresh()->is_public);
        $this->assertDatabaseCount('profile_game_favorites', 1);
    }

    public function test_invalid_picks_are_rejected_atomically_without_clearing_saved_shelves(): void
    {
        $user = $this->player();
        $games = Game::factory()->count(5)->create();
        $user->profile->topGames()->attach($games[0], ['position' => 1]);
        $this->actingAs($user);
        foreach ([$games->pluck('id')->all(), [$games[1]->id, $games[1]->id], [999999999], ['bad'], ['named' => $games[1]->id]] as $invalid) {
            $this->put(route('players.showcase'), ['top_games' => $invalid])->assertSessionHasErrors();
            $this->assertSame([$games[0]->id], $user->profile->topGames()->pluck('games.id')->all());
            $this->assertTrue($user->profile->fresh()->is_public);
        }
        $this->put(route('players.showcase'), [])->assertSessionHasErrors('top_games');
    }

    public function test_guests_and_unverified_users_cannot_change_shelves_but_verified_new_players_can(): void
    {
        $data = ['top_games' => []];
        $this->put(route('players.showcase'), $data)->assertRedirect(route('login'));
        $this->actingAs(User::factory()->unverified()->create())->put(route('players.showcase'), $data)->assertRedirect(route('verification.notice'));
        $newPlayer = User::factory()->create();
        $this->actingAs($newPlayer)->put(route('players.showcase'), $data)->assertRedirect();
        $this->assertFalse($newPlayer->profile()->firstOrFail()->is_public);
        $this->assertDatabaseCount('profile_game_favorites', 0);
    }

    public function test_public_profiles_share_recent_completions_even_when_the_legacy_flag_is_false(): void
    {
        $user = $this->player();
        DB::table('user_profiles')->where('user_id', $user->id)->update(['share_recent_completed' => false]);
        $game = Game::factory()->create(['name' => 'Public completed title']);
        LibraryEntry::factory()->for($user)->for($game)->create(['status' => 'completed']);
        $this->get('/players/shelf_player')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->missing('recentCompletedShared')->has('recentCompleted', 1)->where('recentCompleted.0.game.id', $game->id));
        $this->assertTrue($user->profile->fresh()->is_public);
    }

    public function test_shared_completions_only_contain_the_latest_four_owned_completed_games_and_allowed_fields(): void
    {
        $user = $this->player();
        $entries = [];
        for ($day = 1; $day <= 5; $day++) {
            $entries[] = LibraryEntry::factory()->for($user)->create(['status' => 'completed', 'completed_at' => now()->subDays($day)]);
        }
        Rating::factory()->for($entries[0])->create(['score' => 9]);
        Review::factory()->for($entries[0])->create(['is_public' => false, 'body' => 'PRIVATE REVIEW BODY']);
        LibraryEntry::factory()->for($user)->create(['status' => 'playing']);
        LibraryEntry::factory()->create(['status' => 'completed']);
        $this->get('/players/shelf_player')->assertOk()->assertDontSee('PRIVATE REVIEW BODY')->assertInertia(fn (Assert $page) => $page
            ->missing('recentCompletedShared')->has('recentCompleted', 4)
            ->where('recentCompleted.0.game.id', $entries[0]->game_id)->where('recentCompleted.3.game.id', $entries[3]->game_id)
            ->where('recentCompleted.0.rating', 4.5)->where('recentCompleted.0.completed_at', $entries[0]->completed_at->toISOString())
            ->where('recentCompleted.1.rating', null)->missing('recentCompleted.0.game.data')
            ->missing('recentCompleted.0.is_favorite')->missing('recentCompleted.0.review')->missing('recentCompleted.0.id')->missing('recentCompleted.0.user_id'));
    }

    public function test_favorite_and_rating_edits_do_not_reorder_recorded_completions(): void
    {
        $user = $this->player();
        $old = LibraryEntry::factory()->for($user)->create(['status' => 'completed', 'completed_at' => now()->subDays(4), 'updated_at' => now()->subDays(4)]);
        $recent = LibraryEntry::factory()->for($user)->create(['status' => 'completed', 'completed_at' => now()->subDay()]);
        $timestamp = $old->completed_at->toISOString();
        $this->actingAs($user)->put(route('ratings.update', $old->game->slug), ['stars' => 4.5])->assertRedirect();
        $this->put(route('library.save', $old->game->slug), ['status' => 'completed', 'is_favorite' => true])->assertRedirect();
        $this->assertSame($timestamp, $old->fresh()->completed_at->toISOString());
        $this->get('/players/shelf_player')->assertInertia(fn (Assert $page) => $page
            ->where('recentCompleted.0.game.id', $recent->game_id)->where('recentCompleted.1.game.id', $old->game_id));
    }

    public function test_completion_timestamp_tracks_status_transitions_and_cannot_be_spoofed_by_request_fields(): void
    {
        $this->travelTo(now()->startOfSecond());
        $entry = LibraryEntry::factory()->create(['status' => 'playing']);
        $this->actingAs($entry->user)->put(route('library.save', $entry->game->slug), ['status' => 'completed', 'is_favorite' => false, 'completed_at' => '2099-01-01'])->assertRedirect();
        $this->assertTrue($entry->fresh()->completed_at->equalTo(now()));
        $this->travel(1)->days();
        $this->put(route('library.save', $entry->game->slug), ['status' => 'playing', 'is_favorite' => false])->assertRedirect();
        $this->assertNull($entry->fresh()->completed_at);
        $this->travel(1)->days();
        $this->put(route('library.save', $entry->game->slug), ['status' => 'completed', 'is_favorite' => false])->assertRedirect();
        $this->assertTrue($entry->fresh()->completed_at->equalTo(now()));
    }

    public function test_legacy_completed_entries_keep_unknown_dates_and_sort_after_dated_completions(): void
    {
        $user = $this->player();
        $dated = LibraryEntry::factory()->for($user)->create(['status' => 'completed', 'completed_at' => now()->subDays(20)]);
        $legacy = LibraryEntry::factory()->for($user)->create(['status' => 'completed']);
        DB::table('library_entries')->where('id', $legacy->id)->update(['completed_at' => null]);
        $this->actingAs($user)->put(route('library.save', $legacy->game->slug), ['status' => 'completed', 'is_favorite' => true])->assertRedirect();
        $this->assertNull($legacy->fresh()->completed_at);
        $this->get('/players/shelf_player')->assertInertia(fn (Assert $page) => $page
            ->where('recentCompleted.0.game.id', $dated->game_id)->where('recentCompleted.1.game.id', $legacy->game_id)->where('recentCompleted.1.completed_at', null));
    }

    public function test_recent_completion_visibility_follows_profile_visibility_and_shelf_saves_cannot_change_it(): void
    {
        $user = $this->player();
        $entry = LibraryEntry::factory()->for($user)->create(['status' => 'completed']);
        $before = $entry->fresh()->getRawOriginal();
        $game = Game::factory()->create();
        $user->profile->topGames()->attach($game, ['position' => 1]);
        $this->actingAs($user)->put(route('players.showcase'), ['top_games' => [$game->id], 'is_public' => false, 'share_recent_completed' => false])->assertRedirect();
        $this->get('/players/shelf_player')->assertInertia(fn (Assert $page) => $page->has('recentCompleted', 1)->has('topGames', 1));
        $details = ['username' => 'shelf_player', 'display_name' => 'Shelf Player', 'bio' => '', 'is_public' => false];
        $this->put(route('players.update'), $details)->assertSessionHasNoErrors();
        $this->get('/players/shelf_player')->assertNotFound();
        $this->get(route('players.edit'))->assertInertia(fn (Assert $page) => $page->has('topGames', 1)->missing('profile.share_recent_completed'));
        $this->put(route('players.update'), [...$details, 'is_public' => true])->assertSessionHasNoErrors();
        $this->get('/players/shelf_player')->assertInertia(fn (Assert $page) => $page->has('recentCompleted', 1));
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
    }

    public function test_editor_searches_bounded_local_catalog_without_api_calls_and_keeps_saved_picks(): void
    {
        Http::preventStrayRequests();
        $user = $this->player();
        $pick = Game::factory()->create(['name' => 'Pinned title']);
        $user->profile->topGames()->attach($pick, ['position' => 1]);
        Game::factory()->count(13)->create(['name' => 'Search adventure']);
        $literal = Game::factory()->create(['name' => '100%_Complete']);
        $this->actingAs($user)->get(route('players.edit', ['q' => 'SEARCH']))->assertInertia(fn (Assert $page) => $page
            ->has('availableGames', 12)->where('query', 'SEARCH')->where('topGames.0.id', $pick->id)->missing('availableGames.0.rawg_id'));
        $this->get(route('players.edit', ['q' => '%_']))->assertInertia(fn (Assert $page) => $page->has('availableGames', 1)->where('availableGames.0.id', $literal->id));
        $this->getJson(route('players.edit', ['q' => ['bad']]))->assertUnprocessable()->assertJsonValidationErrors('q');
        Http::assertNothingSent();
    }

    public function test_regular_profile_edit_preserves_shelves_and_deleting_account_cascades_only_picks(): void
    {
        $user = $this->player();
        $game = Game::factory()->create();
        $user->profile->topGames()->attach($game, ['position' => 1]);
        $this->actingAs($user)->put(route('players.update'), ['username' => 'shelf_player', 'display_name' => 'A new name', 'bio' => '', 'is_public' => true, 'top_games' => []])->assertRedirect();
        $this->assertSame([$game->id], $user->profile->topGames()->pluck('games.id')->all());
        $this->assertTrue($user->profile->fresh()->is_public);
        $user->delete();
        $this->assertDatabaseCount('profile_game_favorites', 0);
        $this->assertModelExists($game);
    }
}
