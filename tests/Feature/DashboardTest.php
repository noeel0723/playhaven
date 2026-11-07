<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_recent_game_cards_receive_flat_catalog_data_for_rated_and_unrated_games(): void
    {
        $user = User::factory()->create();
        $game = Game::factory()->create(['slug' => 'dashboard-adventure']);
        $rated = LibraryEntry::factory()->for($user)->for($game)->create(['updated_at' => now(), 'status' => 'playing']);
        Rating::factory()->for($rated)->create(['score' => 9]);
        $unrated = LibraryEntry::factory()->for($user)->create(['updated_at' => now()->subDay()]);
        LibraryEntry::factory()->create();

        $response = $this->actingAs($user)->get(route('dashboard'))->assertOk();
        $assertCards = fn (Assert $page) => $page->component('dashboard')
            ->has('recentEntries', 2)
            ->where('recentEntries.0.id', $rated->id)
            ->where('recentEntries.0.game.id', $game->id)
            ->where('recentEntries.0.game.slug', 'dashboard-adventure')
            ->where('recentEntries.0.game.rating', 4.5)
            ->where('recentEntries.0.your_rating', 4.5)
            ->where('recentEntries.1.game.slug', $unrated->game->slug)
            ->where('recentEntries.1.game.rating', null)
            ->where('recentEntries.1.your_rating', null)
            ->missing('recentEntries.0.game.data')
            ->missing('recentEntries.0.game.rawg_id')
            ->missing('recentEntries.0.game.library_entries');
        $response->assertInertia($assertCards);

        $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => $response->viewData('page')['version']])
            ->get(route('dashboard'))->assertOk()
            ->assertJsonPath('component', 'dashboard')
            ->assertJsonPath('props.recentEntries.0.game.slug', 'dashboard-adventure')
            ->assertJsonPath('props.recentEntries.0.your_rating', 4.5)
            ->assertJsonPath('props.recentEntries.1.your_rating', null)
            ->assertJsonMissingPath('props.recentEntries.0.game.data');

        $this->flushHeaders();
        $this->get(route('library.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('entries.data.0.game.slug', 'dashboard-adventure')
            ->where('entries.data.0.game.rating', 4.5)
            ->missing('entries.data.0.game.data'));
    }
}
