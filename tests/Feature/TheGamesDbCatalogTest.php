<?php

namespace Tests\Feature;

use App\Jobs\SyncTheGamesDbGame;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Models\User;
use App\Services\TheGamesDb\CatalogImage;
use App\Services\TheGamesDb\CatalogSynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class TheGamesDbCatalogTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = 'test-private-key-never-render';

    private function game(array $overrides = []): array
    {
        return [...['id' => 53, 'game_title' => 'Sonic the Hedgehog', 'release_date' => '1991-06-23', 'platform' => 18,
            'overview' => '<p>Fast &amp; fun.</p>', 'genres' => [1], 'developers' => [1296], 'publishers' => [1], 'last_updated' => '2026-11-01 10:00:00'], ...$overrides];
    }

    private function fake(array $game = [], array $images = [], bool $defaults = true): void
    {
        config(['services.thegamesdb.api_key' => self::KEY]);
        Http::preventStrayRequests();
        $game = $game ?: $this->game();
        $images = $defaults ? [
            ['type' => 'boxart', 'side' => 'back', 'filename' => 'boxart/back/53.jpg'],
            ['type' => 'boxart', 'side' => 'front', 'filename' => 'boxart/front/53.jpg'],
            ['type' => 'fanart', 'filename' => 'fanart/53.jpg'],
        ] : $images;
        Http::fake(function (Request $request) use ($game, $images) {
            $this->assertSame(self::KEY, $request['apikey']);
            $payload = match (parse_url($request->url(), PHP_URL_PATH)) {
                '/v1.1/Games/ByGameName' => ['data' => ['games' => [$game]], 'include' => ['boxart' => ['data' => ['53' => $images]]], 'pages' => ['next' => 'https://api.thegamesdb.net/SECRET?apikey='.self::KEY]],
                '/v1/Games/ByGameID' => ['data' => ['games' => [$game]]],
                '/v1/Games/Images' => ['data' => ['images' => ['53' => $images]]],
                '/v1/Genres' => ['data' => ['genres' => ['1' => ['id' => 1, 'name' => 'Action']]]],
                '/v1/Platforms' => ['data' => ['platforms' => ['18' => ['id' => 18, 'name' => 'Sega Genesis']]]],
                '/v1/Developers' => ['data' => ['developers' => ['1296' => ['id' => 1296, 'name' => 'Sonic Team']]]],
                '/v1/Publishers' => ['data' => ['publishers' => ['1' => ['id' => 1, 'name' => 'Sega']]]],
                '/v1/API/Limit' => ['remaining_monthly_allowance' => 249],
                default => throw new RuntimeException('Unexpected provider path.'),
            };

            return Http::response(['code' => 200, ...$payload]);
        });
    }

    public function test_discovery_is_authenticated_validated_and_does_not_expose_keys_or_provider_pagination_urls(): void
    {
        $this->fake();
        $url = route('catalog.search');
        $this->get($url)->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->get($url)->assertInertia(fn (Assert $page) => $page->has('results', 0));
        Http::assertNothingSent();
        $this->get($url.'?q=Sonic')->assertOk()->assertDontSee(self::KEY)->assertDontSee('/SECRET')->assertInertia(fn (Assert $page) => $page
            ->component('games/find')->has('results', 1)->where('results.0.id', 53)->where('results.0.name', 'Sonic the Hedgehog')
            ->where('results.0.cover_url', 'https://cdn.thegamesdb.net/images/original/boxart/front/53.jpg')->where('hasNext', true)->where('error', null));
        $this->getJson($url.'?q=x')->assertUnprocessable();
        $this->getJson($url.'?q[]=bad')->assertUnprocessable();
        $this->getJson($url.'?q=Sonic&page=-1')->assertUnprocessable();
        $this->get('/discover/rawg')->assertNotFound();
        $this->assertDatabaseCount('games', 0);
    }

    public function test_opening_a_result_imports_metadata_artwork_and_credits_once_and_keeps_player_records_on_refresh(): void
    {
        $this->fake();
        $this->actingAs(User::factory()->create())->post(route('catalog.import', 53))->assertSessionHasNoErrors()->assertRedirect();
        $game = Game::where('thegamesdb_id', 53)->sole();
        $this->assertSame('Fast & fun.', $game->summary);
        $this->assertSame('1991-06-23', $game->released_on->format('Y-m-d'));
        $this->assertSame('Sonic Team', $game->developers->sole()->name);
        $this->assertSame('Sega', $game->publishers->sole()->name);
        $this->assertSame('Action', $game->genres->sole()->name);
        $this->assertSame('Sega Genesis', $game->platforms->sole()->name);
        $this->assertSame('https://cdn.thegamesdb.net/images/original/fanart/53.jpg', $game->banner_url);
        $entry = LibraryEntry::factory()->for($game)->create(['status' => 'completed']);
        $rating = Rating::factory()->for($entry)->create(['score' => 9]);
        Http::assertSentCount(6);
        $this->post(route('catalog.import', 53))->assertRedirect(route('games.show', $game->slug));
        Http::assertSentCount(6);
        Cache::flush();
        $this->fake($this->game(['game_title' => 'Renamed Sonic']), [], false);
        app(CatalogSynchronizer::class)->syncGame(53, true);
        $this->assertSame($game->slug, $game->fresh()->slug);
        $this->assertSame($game->cover_url, $game->fresh()->cover_url);
        $this->assertSame($game->banner_url, $game->fresh()->banner_url);
        $this->assertSame(9, $rating->fresh()->score);
        $this->assertModelExists($entry);
        $this->assertDatabaseCount('games', 1);
        Http::preventStrayRequests();
        $this->get(route('games.show', $game->slug))->assertOk()->assertDontSee(self::KEY)->assertInertia(fn (Assert $page) => $page
            ->where('game.developers.0.name', 'Sonic Team')->where('game.publishers.0.name', 'Sega')->where('connectionState.can_refresh', false));
    }

    public function test_failed_import_is_atomic_and_invalid_metadata_or_images_do_not_become_renderable_urls(): void
    {
        $this->fake($this->game(['genres' => [99999]]));
        $this->actingAs(User::factory()->create())->post(route('catalog.import', 53))->assertSessionHasErrors('import');
        $this->assertDatabaseCount('games', 0);
        $this->assertDatabaseCount('developers', 0);
        Cache::flush();
        $this->fake($this->game(['id' => 54]));
        $this->post(route('catalog.import', 53))->assertSessionHasErrors('import');
        $this->assertDatabaseCount('games', 0);
        foreach (['https://evil.test/image.jpg', 'https://cdn.thegamesdb.net/images/original/a.jpg?apikey=SECRET', 'https://user@cdn.thegamesdb.net/images/original/a.jpg', 'https://cdn.thegamesdb.net/images/original/../a.jpg', 'https://cdn.thegamesdb.net/images/original/%2e%2e/a.jpg', 'javascript:alert(1)'] as $url) {
            $this->assertNull(CatalogImage::url($url));
        }
        $this->assertNull(CatalogImage::filename('../secret.jpg'));
        $this->assertNull(CatalogImage::filename('https://evil.test/a.jpg'));
    }

    public function test_credentials_failures_are_sanitized_and_queued_jobs_do_not_serialize_api_keys(): void
    {
        config(['services.thegamesdb.api_key' => null]);
        Http::preventStrayRequests();
        $this->artisan('thegamesdb:check')->assertFailed();
        Http::assertNothingSent();
        config(['services.thegamesdb.api_key' => self::KEY]);
        Http::fake(['api.thegamesdb.net/*' => Http::response(['secret' => self::KEY, 'code' => 403], 403)]);
        $this->actingAs(User::factory()->create())->get(route('catalog.search', ['q' => 'Sonic']))->assertDontSee(self::KEY)
            ->assertInertia(fn (Assert $page) => $page->has('results', 0)->where('error', fn ($value) => str_contains($value, 'temporarily unavailable')));
        Queue::fake();
        $this->artisan('catalog:sync', ['--ids' => '53,53'])->assertSuccessful();
        Queue::assertPushed(SyncTheGamesDbGame::class, 1);
        $this->assertStringNotContainsString(self::KEY, serialize(new SyncTheGamesDbGame(53)));
        $this->artisan('catalog:sync')->assertFailed();
        $this->artisan('catalog:reset', ['--confirm' => 'playhaven'])->assertFailed();
    }

    public function test_curated_game_relationships_still_work_bidirectionally_without_provider_calls(): void
    {
        Http::preventStrayRequests();
        $first = Game::factory()->create(['thegamesdb_id' => 53]);
        $second = Game::factory()->create(['thegamesdb_id' => 54]);
        $this->artisan('catalog:relate', ['game' => $first->slug, 'related' => $second->slug, 'type' => 'sequel'])->assertSuccessful();
        $this->get(route('games.show', $first->slug))->assertInertia(fn (Assert $page) => $page->has('connections', 1)->where('connections.0.type', 'sequel')->where('connections.0.local_slug', $second->slug));
        $this->get(route('games.show', $second->slug))->assertInertia(fn (Assert $page) => $page->where('connections.0.type', 'prequel'));
        $this->artisan('catalog:relate', ['game' => $first->slug, 'related' => $second->slug, '--remove' => true])->assertSuccessful();
        $this->assertDatabaseCount('game_connections', 0);
        Http::assertNothingSent();
    }
}
