<?php

namespace Tests\Feature\Catalog;

use App\Models\Game;
use App\Models\Genre;
use App\Models\LibraryEntry;
use App\Models\Platform;
use App\Models\Rating;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_empty_catalog_is_public_and_does_not_call_igdb(): void
    {
        Http::preventStrayRequests();
        $this->get('/games')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('games/index')->has('games.data', 0)->where('catalogCount', 0));
    }

    public function test_search_combines_genre_platform_and_year_filters(): void
    {
        $game = Game::factory()->create(['name' => 'Space Adventure', 'released_on' => '2023-04-01']);
        $genre = Genre::factory()->create(['slug' => 'adventure']);
        $platform = Platform::factory()->create(['slug' => 'pc']);
        $game->genres()->attach($genre);
        $game->platforms()->attach($platform);
        Game::factory()->create(['name' => 'Space Other', 'released_on' => '2023-04-01']);

        $this->get('/games?q=SPACE&genre=adventure&platform=pc&year=2023')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('games.data', 1)->where('games.data.0.id', $game->id)->where('filters.q', 'SPACE'));
    }

    public function test_search_treats_sql_wildcards_as_literal_characters(): void
    {
        $literal = Game::factory()->create(['name' => '100%_Complete!']);
        Game::factory()->create(['name' => '100 Days']);
        $this->get('/games?q='.urlencode('%_'))->assertInertia(fn (Assert $page) => $page->has('games.data', 1)->where('games.data.0.id', $literal->id));
    }

    public function test_unrated_games_sort_after_rated_games_on_both_databases(): void
    {
        Game::factory()->create(['name' => 'Unrated']);
        $low = Game::factory()->create(['name' => 'Low']);
        $high = Game::factory()->create(['name' => 'High']);
        Rating::factory()->create(['library_entry_id' => LibraryEntry::factory()->for($low)->create()->id, 'score' => 5]);
        Rating::factory()->create(['library_entry_id' => LibraryEntry::factory()->for($high)->create()->id, 'score' => 9]);

        $this->get('/games?sort=rating')->assertInertia(fn (Assert $page) => $page
            ->where('games.data.0.id', $high->id)->where('games.data.0.rating', 4.5)
            ->where('games.data.1.id', $low->id)->where('games.data.2.rating', null));
    }

    public function test_catalog_pagination_preserves_filters(): void
    {
        Game::factory()->count(25)->create(['released_on' => '2020-01-01']);
        $this->get('/games?year=2020&sort=name')->assertInertia(fn (Assert $page) => $page
            ->has('games.data', 24)->where('games.meta.total', 25)
            ->where('games.links.next', fn ($url) => str_contains($url, 'year=2020') && str_contains($url, 'page=2')));
    }

    public function test_detail_uses_local_slug_and_exposes_only_catalog_fields(): void
    {
        $game = Game::factory()->create(['slug' => 'safe-game', 'summary' => '<script>not executable</script>', 'cover_image_id' => '../../bad']);
        config(['services.igdb.client_secret' => 'never-render-this-secret']);
        $this->get('/games/safe-game')->assertOk()->assertDontSee('never-render-this-secret')
            ->assertInertia(fn (Assert $page) => $page->component('games/show')->where('game.id', $game->id)
                ->where('game.cover_url', null)->where('game.summary', '<script>not executable</script>')
                ->missing('game.igdb_updated_at')->missing('game.library_entries'));
        $this->get('/games/missing-game')->assertNotFound();
    }

    public function test_invalid_filter_shapes_are_rejected(): void
    {
        $this->getJson('/games?q[]=invalid')->assertUnprocessable()->assertJsonValidationErrors('q');
        $this->getJson('/games?sort=sql&year=bad&page=-1')->assertUnprocessable()->assertJsonValidationErrors(['sort', 'year', 'page']);
    }

    public function test_rawg_images_are_rendered_without_exposing_the_api_key(): void
    {
        $game = Game::factory()->create(['rawg_id' => 100, 'cover_url' => 'https://media.rawg.io/media/games/test.jpg']);
        config(['services.rawg.api_key' => 'rawg-test-secret-never-render']);
        $this->get('/games/'.$game->slug)->assertOk()->assertDontSee('rawg-test-secret-never-render')
            ->assertInertia(fn (Assert $page) => $page->where('game.cover_url', 'https://media.rawg.io/media/games/test.jpg')->where('game.rating', null));
    }

    public function test_rawg_image_urls_cannot_point_to_untrusted_hosts_or_include_keys(): void
    {
        $game = Game::factory()->create(['rawg_id' => 100, 'cover_url' => 'https://media.rawg.io/media/games/test.jpg?key=not-allowed']);
        $this->get('/games/'.$game->slug)->assertInertia(fn (Assert $page) => $page->where('game.cover_url', null));
        $game->update(['cover_url' => 'https://untrusted.example/cover.jpg']);
        $this->get('/games/'.$game->slug)->assertInertia(fn (Assert $page) => $page->where('game.cover_url', null));
    }
}
