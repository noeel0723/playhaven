<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlayerDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    private function player(string $username, bool $public = true): User
    {
        $user = User::factory()->create();
        UserProfile::factory()->for($user)->create(['username' => $username, 'is_public' => $public]);

        return $user;
    }

    public function test_a_single_signed_in_player_sees_an_empty_directory_and_can_still_open_their_profile(): void
    {
        $owner = $this->player('first_player');
        $this->actingAs($owner)->get('/players')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('players/index')->has('players.data', 0)->where('players.meta.total', 0)->where('hasDiscoverablePlayers', false));
        $this->get('/players/first_player')->assertOk()->assertInertia(fn (Assert $page) => $page->where('player.is_self', true));
        $this->assertDatabaseCount('users', 1);
    }

    public function test_private_and_unconfigured_accounts_do_not_make_the_empty_directory_look_populated(): void
    {
        $owner = $this->player('first_player');
        $hidden = $this->player('hidden_player', false);
        User::factory()->create();
        $this->actingAs($owner)->get('/players')->assertOk()->assertDontSee($hidden->email)
            ->assertInertia(fn (Assert $page) => $page->has('players.data', 0)->where('hasDiscoverablePlayers', false));
    }

    public function test_discovery_cards_only_show_public_reviews_and_explicit_top_four_without_private_history(): void
    {
        Http::preventStrayRequests();
        $viewer = $this->player('viewer_player');
        $target = $this->player('target_player');
        $games = Game::factory()->count(4)->create();
        $games[3]->update(['rawg_id' => 42, 'cover_url' => 'https://untrusted.example/secret.jpg']);
        foreach ($games->reverse()->values() as $position => $game) {
            $target->profile->topGames()->attach($game, ['position' => $position + 1]);
        }
        $entry = LibraryEntry::factory()->for($target)->create(['is_favorite' => true]);
        Review::factory()->for($entry)->create(['is_public' => true, 'body' => 'PUBLIC REVIEW BODY NOT NEEDED IN DIRECTORY']);
        Review::factory()->for(LibraryEntry::factory()->for($target)->create())->create(['is_public' => false, 'body' => 'PRIVATE DISCOVERY SECRET']);
        $before = $entry->fresh()->getRawOriginal();
        $this->actingAs($viewer)->get('/players')->assertOk()->assertDontSee($target->email)->assertDontSee('PRIVATE DISCOVERY SECRET')
            ->assertDontSee('PUBLIC REVIEW BODY NOT NEEDED IN DIRECTORY')->assertInertia(fn (Assert $page) => $page
            ->has('players.data', 1)->where('hasDiscoverablePlayers', true)->where('players.data.0.username', 'target_player')
            ->where('players.data.0.public_reviews_count', 1)->where('players.data.0.is_self', false)
            ->has('players.data.0.top_games', 4)->where('players.data.0.top_games.0.id', $games[3]->id)
            ->where('players.data.0.top_games.3.id', $games[0]->id)->where('players.data.0.top_games.0.cover_url', null)
            ->missing('players.data.0.email')->missing('players.data.0.library_entries')->missing('players.data.0.top_games.0.rawg_id')
            ->missing('players.data.0.top_games.0.pivot')->missing('players.data.0.top_games.0.summary'));
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
        Http::assertNothingSent();
    }

    public function test_search_misses_are_distinguished_from_a_directory_without_any_other_public_players(): void
    {
        $viewer = $this->player('viewer_player');
        $target = $this->player('target_player');
        $this->actingAs($viewer)->get('/players?q=missing_name')->assertInertia(fn (Assert $page) => $page
            ->has('players.data', 0)->where('hasDiscoverablePlayers', true)->where('query', 'missing_name'));
        $target->profile->update(['is_public' => false]);
        $this->get('/players?q=missing_name')->assertInertia(fn (Assert $page) => $page
            ->has('players.data', 0)->where('hasDiscoverablePlayers', false));
    }

    public function test_guests_can_discover_the_first_public_player_and_pagination_preserves_search_without_self_entries(): void
    {
        $owner = $this->player('first_player');
        $this->get('/players')->assertInertia(fn (Assert $page) => $page->has('players.data', 1)->where('hasDiscoverablePlayers', true));
        for ($index = 0; $index < 19; $index++) {
            $this->player('other_player_'.$index);
        }
        $this->actingAs($owner)->get('/players?q=player')->assertInertia(fn (Assert $page) => $page
            ->has('players.data', 18)->where('players.meta.total', 19)
            ->where('players.links.next', fn ($url) => str_contains($url, 'q=player') && str_contains($url, 'page=2'))
            ->where('players.data', fn ($players) => collect($players)->every(fn ($player) => ! $player['is_self'])));
        $this->get('/players?q=player&page=2')->assertInertia(fn (Assert $page) => $page->has('players.data', 1)->where('players.meta.total', 19));
    }
}
