<?php

namespace Tests\Feature;

use App\Models\Developer;
use App\Models\Game;
use App\Models\Genre;
use App\Models\Platform;
use App\Models\User;
use App\Services\Rawg\DeveloperSynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DeveloperDetailsTest extends TestCase
{
    use RefreshDatabase;

    private function studio(array $attributes = []): Developer
    {
        return Developer::create([...['rawg_id' => 10, 'name' => 'Test Studio', 'slug' => 'test-studio'], ...$attributes]);
    }

    public function test_public_developer_page_uses_local_data_and_associated_games_only(): void
    {
        Http::preventStrayRequests();
        $studio = $this->studio(['description' => '<p>A game studio.</p>', 'image_url' => 'https://media.rawg.io/media/developers/studio.jpg']);
        $game = Game::factory()->create(['name' => 'Studio Game', 'released_on' => '2019-01-01']);
        $game->developers()->attach($studio);
        $genre = Genre::factory()->create(['name' => 'Adventure']);
        $platform = Platform::factory()->create(['name' => 'PC']);
        $game->genres()->attach($genre);
        $game->platforms()->attach($platform);
        Game::factory()->create(['name' => 'Other Studio Game']);
        $this->get(route('developers.show', $studio->slug))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('developers/show')->where('developer.name', 'Test Studio')->where('developer.description', 'A game studio.')
            ->where('developer.image_source', 'developer')->where('developer.games_count', 1)->where('developer.first_release', '2019-01-01')
            ->has('games.data', 1)->where('games.data.0.name', 'Studio Game')->where('games.data.0.developers.0.slug', 'test-studio')
            ->has('genres', 1)->has('platforms', 1)->where('canRefresh', false)->missing('developer.rawg_id'));
        Http::assertNothingSent();
        $this->get('/developers/unknown-studio')->assertNotFound();
    }

    public function test_search_sort_validation_pagination_and_empty_states(): void
    {
        Http::preventStrayRequests();
        $studio = $this->studio();
        foreach (range(1, 25) as $number) {
            Game::factory()->create(['name' => sprintf('Matching %02d', $number), 'released_on' => '2020-01-01'])->developers()->attach($studio);
        }
        Game::factory()->create(['name' => 'Excluded'])->developers()->attach($studio);
        $url = route('developers.show', $studio->slug);
        $this->get($url.'?q=Matching&sort=name')->assertInertia(fn (Assert $page) => $page->has('games.data', 24)
            ->where('games.data.0.name', 'Matching 01')->where('games.meta.total', 25)->where('developer.games_count', 26)
            ->where('games.links.next', fn ($link) => str_contains($link, 'q=Matching') && str_contains($link, 'sort=name') && str_contains($link, 'page=2')));
        $this->get($url.'?q=Matching&sort=name&page=2')->assertInertia(fn (Assert $page) => $page->has('games.data', 1)->where('games.data.0.name', 'Matching 25'));
        $this->get($url.'?q=missing')->assertInertia(fn (Assert $page) => $page->has('games.data', 0));
        $this->getJson($url.'?q[]=bad&sort=wrong&page=-1')->assertUnprocessable()->assertJsonValidationErrors(['q', 'sort', 'page']);
        $empty = $this->studio(['slug' => 'empty', 'rawg_id' => 20]);
        $this->get(route('developers.show', $empty->slug))->assertInertia(fn (Assert $page) => $page->has('games.data', 0)->where('developer.image_url', null)->where('developer.description', null));
        Http::assertNothingSent();
    }

    public function test_invalid_studio_image_falls_back_to_related_game_artwork(): void
    {
        $studio = $this->studio(['image_url' => 'https://evil.test/photo.jpg?key=secret']);
        $game = Game::factory()->create(['banner_url' => 'https://media.rawg.io/media/games/banner.jpg']);
        $game->developers()->attach($studio);
        $this->get(route('developers.show', $studio->slug))->assertDontSee('evil.test')->assertInertia(fn (Assert $page) => $page
            ->where('developer.image_url', 'https://media.rawg.io/media/games/banner.jpg')->where('developer.image_source', 'game'));
    }

    public function test_authenticated_refresh_saves_safe_metadata_once_and_preserves_identity_and_games(): void
    {
        config(['services.rawg.api_key' => 'secret-test-key']);
        Http::preventStrayRequests();
        Http::fake(['api.rawg.io/api/developers/10*' => Http::response(['id' => 10, 'name' => 'Renamed Upstream', 'description' => '<p>A studio &amp; its games.</p>', 'image_background' => 'https://media.rawg.io/media/developers/studio.jpg'])]);
        $studio = $this->studio();
        $game = Game::factory()->create();
        $game->developers()->attach($studio);
        $url = route('developers.refresh', $studio->slug);
        $this->post($url)->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->post($url)->assertRedirect(route('developers.show', $studio->slug))->assertSessionHasNoErrors();
        $this->assertSame('A studio & its games.', $studio->fresh()->description);
        $this->assertSame('Test Studio', $studio->fresh()->name);
        $this->assertSame(1, $studio->games()->count());
        app(DeveloperSynchronizer::class)->sync($studio);
        Http::assertSentCount(1);
        $this->get(route('developers.show', $studio->slug))->assertDontSee('secret-test-key')->assertInertia(fn (Assert $page) => $page->where('canRefresh', true));
    }

    public function test_provider_failures_leave_saved_information_intact_and_do_not_expose_credentials(): void
    {
        config(['services.rawg.api_key' => 'secret-test-key']);
        $studio = $this->studio(['description' => 'Saved biography', 'image_url' => 'https://media.rawg.io/media/developers/old.jpg']);
        Http::fake(['api.rawg.io/*' => Http::response(['error' => 'secret-test-key'], 503)]);
        $this->actingAs(User::factory()->create())->post(route('developers.refresh', $studio->slug))->assertSessionHasErrors('developer');
        $this->assertSame('Saved biography', $studio->fresh()->description);
        $this->assertNull($studio->fresh()->details_synced_at);
        Cache::flush();
        Http::fake(['api.rawg.io/*' => Http::response(['id' => 999, 'description' => 'Wrong studio'])]);
        $this->post(route('developers.refresh', $studio->slug))->assertSessionHasErrors('developer');
        $this->assertSame('Saved biography', $studio->fresh()->description);
    }
}
