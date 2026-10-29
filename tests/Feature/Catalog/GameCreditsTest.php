<?php

namespace Tests\Feature\Catalog;

use App\Models\Developer;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Publisher;
use App\Models\Rating;
use App\Services\Rawg\CatalogSynchronizer;
use App\Services\Rawg\OfficialWebsite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class GameCreditsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.rawg.api_key' => 'credits-test-secret']);
        Http::preventStrayRequests();
    }

    private function details(array $changes = []): array
    {
        return array_replace([
            'id' => 101,
            'name' => 'Shared World',
            'slug' => 'shared-world',
            'updated' => '2026-10-01T12:00:00',
            'description_raw' => 'A world built together.',
            'developers' => [
                ['id' => 20, 'name' => 'First Studio', 'slug' => 'first-studio'],
                ['id' => 21, 'name' => 'Second Studio', 'slug' => 'second-studio'],
            ],
            'publishers' => [['id' => 30, 'name' => 'World Publishing', 'slug' => 'world-publishing']],
            'website' => 'https://studio.example.org/world',
        ], $changes);
    }

    public function test_credits_are_shared_idempotent_and_public_only_on_game_details(): void
    {
        $sync = app(CatalogSynchronizer::class);
        $sync->import([$this->details(), $this->details(['id' => 102, 'slug' => 'another-world'])], true);
        $sync->import([$this->details()], true);
        $this->assertDatabaseCount('developers', 2);
        $this->assertDatabaseCount('publishers', 1);
        $this->assertDatabaseCount('developer_game', 4);
        $this->assertDatabaseCount('game_publisher', 2);
        $this->get('/games/shared-world')->assertOk()->assertDontSee('credits-test-secret')
            ->assertInertia(fn (Assert $page) => $page
                ->has('game.developers', 2)->where('game.developers.0.name', 'First Studio')
                ->where('game.publishers.0.name', 'World Publishing')
                ->where('game.official_website', 'https://studio.example.org/world')
                ->missing('game.developers.0.rawg_id')->missing('game.credits_synced_at'));
        $this->get('/games')->assertInertia(fn (Assert $page) => $page
            ->missing('games.data.0.developers')->missing('games.data.0.publishers')->missing('games.data.0.official_website'));
    }

    public function test_enrichment_fetches_missing_credits_despite_recent_details_and_preserves_player_data(): void
    {
        $game = Game::factory()->create(['rawg_id' => 101, 'slug' => 'existing-world', 'rawg_details_synced_at' => now()]);
        $entry = LibraryEntry::factory()->for($game)->create();
        $rating = Rating::factory()->for($entry)->create(['score' => 9]);
        $before = $entry->fresh()->getRawOriginal();
        Http::fake(['api.rawg.io/api/games/101?*' => Http::response($this->details())]);
        $sync = app(CatalogSynchronizer::class);
        $sync->syncGame(101);
        $sync->syncGame(101);
        Http::assertSentCount(1);
        $this->assertDatabaseCount('games', 1);
        $this->assertSame('existing-world', $game->fresh()->slug);
        $this->assertNotNull($game->fresh()->credits_synced_at);
        $this->assertSame(2, $game->fresh()->developers()->count());
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
        $this->assertSame(9, $rating->fresh()->score);
    }

    public function test_search_payloads_and_missing_detail_keys_preserve_saved_credits(): void
    {
        $sync = app(CatalogSynchronizer::class);
        $sync->import([$this->details()], true);
        $payload = $this->details(['developers' => [], 'publishers' => [], 'website' => '']);
        $sync->import([$payload]);
        unset($payload['developers'], $payload['publishers'], $payload['website']);
        $sync->import([$payload], true);
        $game = Game::firstOrFail();
        $this->assertSame(2, $game->developers()->count());
        $this->assertSame(1, $game->publishers()->count());
        $this->assertSame('https://studio.example.org/world', $game->website_url);
        $sync->import([$this->details(['developers' => [], 'publishers' => [], 'website' => null])], true);
        $this->assertSame(0, $game->developers()->count());
        $this->assertSame(0, $game->publishers()->count());
        $this->assertNull($game->fresh()->website_url);
        $this->assertNotNull($game->fresh()->credits_synced_at);
    }

    public function test_company_slug_collisions_preserve_identity_and_existing_urls(): void
    {
        Developer::create(['rawg_id' => 999, 'name' => 'Unrelated', 'slug' => 'first-studio']);
        $sync = app(CatalogSynchronizer::class);
        $sync->import([$this->details()], true);
        $sync->import([$this->details(['developers' => [['id' => 20, 'name' => 'Renamed Studio', 'slug' => 'new-name']]])], true);
        $this->assertDatabaseHas('developers', ['rawg_id' => 999, 'name' => 'Unrelated']);
        $this->assertDatabaseHas('developers', ['rawg_id' => 20, 'name' => 'Renamed Studio', 'slug' => 'first-studio-rawg-20']);
        $this->assertSame(1, Game::firstOrFail()->developers()->count());
    }

    public function test_stale_provider_details_cannot_erase_credits(): void
    {
        $sync = app(CatalogSynchronizer::class);
        $sync->import([$this->details()], true);
        $this->assertSame(0, $sync->import([$this->details(['updated' => '2020-01-01', 'developers' => [], 'publishers' => [], 'website' => null])], true));
        $this->assertSame(2, Game::firstOrFail()->developers()->count());
        $this->assertSame('https://studio.example.org/world', Game::firstOrFail()->website_url);
    }

    public function test_malformed_company_data_rejects_the_entire_batch(): void
    {
        try {
            app(CatalogSynchronizer::class)->import([
                $this->details(),
                $this->details(['id' => 102, 'publishers' => [['id' => -2, 'name' => 'Broken']]]),
            ], true);
            $this->fail('Malformed company metadata must be rejected.');
        } catch (ValidationException) {
            $this->assertDatabaseCount('games', 0);
            $this->assertDatabaseCount('developers', 0);
            $this->assertDatabaseCount('publishers', 0);
        }
    }

    public function test_company_filters_combine_with_search_and_preserve_pagination_without_network_calls(): void
    {
        $developer = Developer::create(['rawg_id' => 20, 'name' => 'First Studio', 'slug' => 'first-studio']);
        $publisher = Publisher::create(['rawg_id' => 30, 'name' => 'World Publishing', 'slug' => 'world-publishing']);
        Developer::create(['rawg_id' => 99, 'name' => 'Unused Studio', 'slug' => 'unused-studio']);
        $games = Game::factory()->count(25)->create(['name' => 'Matching World', 'released_on' => '2025-01-01']);
        foreach ($games as $game) {
            $game->developers()->attach($developer);
            $game->publishers()->attach($publisher);
        }
        Game::factory()->create(['name' => 'Other World'])->developers()->attach($developer);
        Game::factory()->create(['name' => 'Matching World'])->publishers()->attach($publisher);
        $this->get('/games?q=Matching&developer=first-studio&publisher=world-publishing&year=2025')
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('developers', 1)->where('developers.0.name', 'First Studio')->has('publishers', 1)
            ->has('games.data', 24)->where('games.meta.total', 25)
            ->where('filters.developer', 'first-studio')->where('filters.publisher', 'world-publishing')
            ->where('games.links.next', fn ($url) => str_contains($url, 'developer=first-studio') && str_contains($url, 'publisher=world-publishing') && str_contains($url, 'page=2')));
        $this->get('/games?developer=unknown-studio')->assertInertia(fn (Assert $page) => $page->has('games.data', 0));
        Http::assertNothingSent();
    }

    public function test_company_filter_shapes_are_validated(): void
    {
        $this->getJson('/games?developer[]=invalid&publisher[]=invalid')->assertUnprocessable()
            ->assertJsonValidationErrors(['developer', 'publisher']);
        $this->getJson('/games?developer='.str_repeat('x', 256))->assertUnprocessable()->assertJsonValidationErrors('developer');
        Http::assertNothingSent();
    }

    public function test_missing_credits_have_honest_empty_values_and_unsafe_saved_links_are_hidden(): void
    {
        $game = Game::factory()->create(['website_url' => 'javascript:alert(1)']);
        $this->get('/games/'.$game->slug)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('game.developers', 0)->has('game.publishers', 0)->where('game.official_website', null));
    }

    public function test_enrich_command_updates_only_missing_metadata_and_respects_the_limit(): void
    {
        Game::factory()->create(['rawg_id' => 101, 'rawg_details_synced_at' => now()]);
        Game::factory()->create(['rawg_id' => 102]);
        Game::factory()->create(['rawg_id' => 103, 'credits_synced_at' => now()]);
        Game::factory()->create();
        Http::fake(['api.rawg.io/api/games/101?*' => Http::response($this->details())]);
        $this->artisan('catalog:enrich', ['--limit' => 1])->expectsOutput('1 games enriched.')->assertSuccessful();
        $this->assertNotNull(Game::where('rawg_id', 101)->firstOrFail()->credits_synced_at);
        $this->assertNull(Game::where('rawg_id', 102)->firstOrFail()->credits_synced_at);
        Http::assertSentCount(1);
    }

    public function test_enrich_command_rejects_invalid_limits_and_sanitizes_provider_failures(): void
    {
        $this->artisan('catalog:enrich', ['--limit' => 0])->assertFailed();
        $this->artisan('catalog:enrich', ['--limit' => 501])->assertFailed();
        $game = Game::factory()->create(['rawg_id' => 101]);
        Http::fake(['api.rawg.io/api/*' => Http::response(['error' => 'credits-test-secret'], 401)]);
        $this->artisan('catalog:enrich')->expectsOutput('Enrichment stopped. Saved player data is preserved; check RAWG credentials, quota, or connection and retry.')->assertFailed();
        $this->assertNull($game->fresh()->credits_synced_at);
        $this->assertDatabaseCount('games', 1);
    }

    #[DataProvider('websiteCases')]
    public function test_only_safe_public_web_links_are_accepted(mixed $input, ?string $expected): void
    {
        $this->assertSame($expected, OfficialWebsite::url($input));
    }

    public static function websiteCases(): array
    {
        return [
            'https' => ['https://studio.example.org/world', 'https://studio.example.org/world'],
            'http' => ['http://studio.example.org/', 'http://studio.example.org/'],
            'empty' => ['', null],
            'missing' => [null, null],
            'array' => [[], null],
            'script' => ['javascript:alert(1)', null],
            'relative' => ['//studio.example.org', null],
            'credentials' => ['https://user:password@studio.example.org', null],
            'localhost' => ['http://localhost', null],
            'local domain' => ['http://playhaven.test', null],
            'private IPv4' => ['http://192.168.1.1', null],
            'loopback IPv4' => ['http://127.0.0.1', null],
            'loopback IPv6' => ['http://[::1]', null],
            'non web protocol' => ['ftp://studio.example.org', null],
            'non web port' => ['https://studio.example.org:5433', null],
            'too long' => ['https://studio.example.org/'.str_repeat('x', 2048), null],
        ];
    }
}
