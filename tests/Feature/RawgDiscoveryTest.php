<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RawgDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.rawg.api_key' => 'test-secret-rawg']);
        Http::preventStrayRequests();
    }

    private function gameData(): array
    {
        return ['id' => 123456, 'name' => 'New World', 'slug' => 'new-world', 'updated' => '2026-01-01T12:00:00', 'released' => '2025-01-01', 'background_image' => 'https://media.rawg.io/media/games/example.jpg', 'description_raw' => 'A new catalog game.', 'genres' => [], 'platforms' => []];
    }

    public function test_rawg_search_requires_login_and_blank_search_does_not_call_api(): void
    {
        $this->get(route('catalog.search'))->assertRedirect(route('login'));
        $this->post(route('catalog.import', 123))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->get(route('catalog.search'))->assertOk()->assertInertia(fn (Assert $page) => $page->has('results', 0));
        Http::assertNothingSent();
    }

    public function test_search_sends_title_to_rawg_and_never_exposes_keys_or_provider_pagination_urls(): void
    {
        $game = Game::factory()->create(['rawg_id' => 123456]);
        Http::fake(['api.rawg.io/api/games?*' => Http::response(['results' => [$this->gameData()], 'next' => 'https://api.rawg.io/api/games?key=test-secret-rawg&page=2'])]);
        $user = User::factory()->create();
        $url = route('catalog.search', ['q' => 'New World']);
        $this->actingAs($user)->get($url)->assertOk()->assertDontSee('test-secret-rawg')->assertInertia(fn (Assert $page) => $page
            ->has('results', 1)->where('results.0.local_slug', $game->slug)->where('hasNext', true)->missing('next'));
        $this->get($url)->assertOk();
        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) => $request['search'] === 'New World' && $request['page_size'] === 12 && $request['key'] === 'test-secret-rawg');
    }

    public function test_unsafe_images_and_upstream_error_bodies_are_not_rendered(): void
    {
        Http::fake(['api.rawg.io/api/games?*' => Http::response(['results' => [array_replace($this->gameData(), ['background_image' => 'https://evil.example/image?key=test-secret-rawg'])], 'next' => null])]);
        $this->actingAs(User::factory()->create())->get(route('catalog.search', ['q' => 'New World']))->assertDontSee('test-secret-rawg')->assertInertia(fn (Assert $page) => $page->where('results.0.cover_url', null));
    }

    public function test_failed_search_uses_a_sanitized_error_and_keeps_the_form_available(): void
    {
        Http::fake(['api.rawg.io/api/*' => Http::response(['error' => 'test-secret-rawg'], 401)]);
        $this->actingAs(User::factory()->create())->get(route('catalog.search', ['q' => 'New World']))->assertOk()->assertDontSee('test-secret-rawg')->assertInertia(fn (Assert $page) => $page
            ->has('results', 0)->where('error', fn ($message) => is_string($message) && str_contains($message, 'unavailable')));
    }

    public function test_import_fetches_full_details_and_is_idempotent(): void
    {
        Http::fake(['api.rawg.io/api/games/123456?*' => Http::response($this->gameData())]);
        $this->actingAs(User::factory()->create())->post(route('catalog.import', 123456))->assertRedirect(route('games.show', 'new-world'));
        $this->post(route('catalog.import', 123456))->assertRedirect(route('games.show', 'new-world'));
        $this->assertDatabaseCount('games', 1);
        $this->assertDatabaseHas('games', ['rawg_id' => 123456, 'summary' => 'A new catalog game.']);
        $this->assertDatabaseCount('library_entries', 0);
        Http::assertSentCount(1);
    }

    public function test_invalid_query_and_import_bounds_do_not_call_api(): void
    {
        $this->actingAs(User::factory()->create())->get(route('catalog.search', ['q' => 'a', 'page' => 1001]))->assertSessionHasErrors(['q', 'page']);
        $this->post(route('catalog.import', 9999999999))->assertSessionHasErrors('rawg_id');
        Http::assertNothingSent();
    }

    public function test_api_failure_during_import_does_not_save_partial_catalog_data(): void
    {
        Http::fake(['api.rawg.io/api/*' => Http::response(['error' => 'test-secret-rawg'], 401)]);
        $this->actingAs(User::factory()->create())->post(route('catalog.import', 123456))->assertSessionHasErrors('import');
        $this->assertDatabaseCount('games', 0);
        $this->assertStringNotContainsString('test-secret-rawg', session('errors')->first('import'));
    }

    public function test_search_is_throttled_even_for_empty_requests(): void
    {
        $this->actingAs(User::factory()->create());
        for ($attempt = 0; $attempt < 12; $attempt++) {
            $this->get(route('catalog.search'))->assertOk();
        }
        $this->get(route('catalog.search'))->assertStatus(429);
        Http::assertNothingSent();
    }

    public function test_provider_cooldown_returns_retry_messages_without_exposing_the_key(): void
    {
        Http::fake(['api.rawg.io/api/*' => Http::response(['error' => 'test-secret-rawg'], 429, ['Retry-After' => '5'])]);
        $this->actingAs(User::factory()->create())->get(route('catalog.search', ['q' => 'New World']))->assertOk()->assertDontSee('test-secret-rawg')->assertInertia(fn (Assert $page) => $page
            ->where('error', fn ($message) => str_contains($message, 'busy')));
        $this->post(route('catalog.import', 123456))->assertSessionHasErrors('import');
        Http::assertSentCount(1);
    }
}
