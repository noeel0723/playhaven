<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameConnection;
use App\Models\User;
use App\Services\GameConnections;
use App\Services\Rawg\ConnectionSynchronizer;
use App\Services\Rawg\RawgClient;
use App\Services\Rawg\RawgRateLimited;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use Tests\TestCase;

class GameConnectionsTest extends TestCase
{
    use RefreshDatabase;

    private function related(int $id, string $name = 'Another story', string $date = '2024-01-01'): array
    {
        return ['id' => $id, 'name' => $name, 'released' => $date, 'background_image' => 'https://media.rawg.io/media/games/example.jpg'];
    }

    private function fakeRelated(array $series = [], array $additions = [], array $parents = [], bool $more = false): void
    {
        $client = Mockery::mock(RawgClient::class);
        foreach (['game-series' => $series, 'additions' => $additions, 'parent-games' => $parents] as $kind => $rows) {
            $client->shouldReceive('related')->with(100, $kind)->once()->andReturn(['results' => $rows, 'has_next' => $more]);
        }
        $this->app->instance(RawgClient::class, $client);
    }

    public function test_rawg_snapshots_do_not_guess_story_order_or_import_every_related_game(): void
    {
        $game = Game::factory()->create(['rawg_id' => 100]);
        $this->fakeRelated([$this->related(200, 'Older installment', '2000-01-01'), $this->related(300), $this->related(100)], [$this->related(400)], [$this->related(500)], true);
        app(ConnectionSynchronizer::class)->sync($game);
        $this->assertDatabaseCount('games', 1);
        $this->assertDatabaseCount('game_connections', 4);
        $this->assertSame(2, $game->connections()->where('type', 'series')->count());
        $this->assertSame(0, $game->connections()->whereIn('type', ['prequel', 'sequel'])->count());
        $this->assertTrue($game->fresh()->connections_truncated);
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page
            ->has('connections', 4)->where('connectionState.can_refresh', false)->where('connectionState.truncated', true));
    }

    public function test_fresh_sync_is_reused_and_unsafe_images_are_removed(): void
    {
        $game = Game::factory()->create(['rawg_id' => 100]);
        $this->fakeRelated([array_replace($this->related(200), ['background_image' => 'https://evil.example/key?secret=1'])]);
        $service = app(ConnectionSynchronizer::class);
        $service->sync($game);
        $service->sync($game);
        $this->assertNull($game->connections()->sole()->cover_url);
        $this->assertFalse($service->canRefresh($game->fresh()));
        $this->travel(2)->days();
        $this->assertTrue($service->canRefresh($game->fresh()));
    }

    public function test_invalid_final_payload_leaves_old_connections_intact(): void
    {
        $game = Game::factory()->create(['rawg_id' => 100]);
        $old = $game->connections()->create(['related_rawg_id' => 999, 'type' => 'series', 'source' => 'rawg', 'name' => 'Keep existing snapshot']);
        $this->fakeRelated([$this->related(200)], [], [array_replace($this->related(300), ['released' => 'invalid-date'])]);
        try {
            app(ConnectionSynchronizer::class)->sync($game);
            $this->fail('Expected validation failure.');
        } catch (ValidationException) {
            $this->assertModelExists($old);
            $this->assertDatabaseCount('game_connections', 1);
            $this->assertNull($game->fresh()->connections_synced_at);
        }
    }

    public function test_failed_refresh_uses_cooldown_without_losing_saved_game(): void
    {
        $game = Game::factory()->create(['rawg_id' => 100]);
        $client = Mockery::mock(RawgClient::class);
        $client->shouldReceive('related')->once()->andThrow(new RawgRateLimited(60));
        $this->app->instance(RawgClient::class, $client);
        $this->actingAs(User::factory()->create())->post(route('games.connections.refresh', $game->slug))->assertSessionHasErrors('connections');
        $this->assertModelExists($game);
        $this->assertFalse(app(ConnectionSynchronizer::class)->canRefresh($game->fresh()));
        $this->travel(6)->minutes();
        $this->assertTrue(app(ConnectionSynchronizer::class)->canRefresh($game->fresh()));
    }

    public function test_curated_sequel_is_bidirectional_and_overrides_the_series_label(): void
    {
        $first = Game::factory()->create(['rawg_id' => 100]);
        $second = Game::factory()->create(['rawg_id' => 200]);
        $first->connections()->create(['related_rawg_id' => 200, 'type' => 'series', 'source' => 'rawg', 'name' => 'Older snapshot']);
        $this->artisan('catalog:relate', ['game' => $first->slug, 'related' => $second->slug, 'type' => 'sequel', '--source-url' => 'https://example.org/story'])->assertSuccessful();
        $this->assertDatabaseHas('game_connections', ['game_id' => $first->id, 'related_rawg_id' => 200, 'type' => 'sequel', 'source' => 'curated']);
        $this->assertDatabaseHas('game_connections', ['game_id' => $second->id, 'related_rawg_id' => 100, 'type' => 'prequel', 'source' => 'curated']);
        $data = app(GameConnections::class)->forGame($first);
        $this->assertCount(1, $data);
        $this->assertSame('sequel', $data[0]['type']);
        $this->assertSame($second->slug, $data[0]['local_slug']);
        $this->artisan('catalog:relate', ['game' => $first->slug, 'related' => $second->slug, 'type' => 'universe'])->assertSuccessful();
        $this->assertSame(2, GameConnection::where('source', 'curated')->count());
        $this->assertSame('universe', app(GameConnections::class)->forGame($second)[0]['type']);
    }

    public function test_curated_links_survive_rawg_sync_and_can_be_removed_independently(): void
    {
        $first = Game::factory()->create(['rawg_id' => 100]);
        $second = Game::factory()->create(['rawg_id' => 200]);
        $this->artisan('catalog:relate', ['game' => $first->slug, 'related' => $second->slug, 'type' => 'prequel'])->assertSuccessful();
        $this->fakeRelated([$this->related(200)]);
        app(ConnectionSynchronizer::class)->sync($first);
        $this->assertSame('prequel', app(GameConnections::class)->forGame($first)[0]['type']);
        $this->artisan('catalog:relate', ['game' => $first->slug, 'related' => $second->slug, '--remove' => true])->assertSuccessful();
        $this->assertSame('series', app(GameConnections::class)->forGame($first)[0]['type']);
        $this->assertSame(0, $second->connections()->count());
    }

    public function test_unsafe_curation_and_self_links_are_rejected(): void
    {
        $first = Game::factory()->create(['rawg_id' => 100]);
        $second = Game::factory()->create(['rawg_id' => 200]);
        $this->artisan('catalog:relate', ['game' => $first->slug, 'related' => $first->slug, 'type' => 'sequel'])->assertFailed();
        $this->artisan('catalog:relate', ['game' => $first->slug, 'related' => $second->slug, 'type' => 'sequel', '--source-url' => 'javascript:alert(1)'])->assertFailed();
        $this->assertDatabaseCount('game_connections', 0);
    }

    public function test_public_gets_do_not_contact_rawg_and_refresh_requires_authentication(): void
    {
        Http::preventStrayRequests();
        $game = Game::factory()->create(['rawg_id' => 100]);
        $this->get(route('games.show', $game->slug))->assertOk()->assertInertia(fn (Assert $page) => $page->where('connectionState.can_refresh', false));
        $this->post(route('games.connections.refresh', $game->slug))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->unverified()->create())->post(route('games.connections.refresh', $game->slug))->assertRedirect(route('verification.notice'));
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page->where('connectionState.can_refresh', false));
        Http::assertNothingSent();
    }

    public function test_authenticated_detail_requests_expose_a_refresh_signal_and_post_saves_connections(): void
    {
        $game = Game::factory()->create(['rawg_id' => 100]);
        $this->fakeRelated([$this->related(200)]);
        $this->actingAs(User::factory()->create())->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page->where('connectionState.can_refresh', true));
        $this->post(route('games.connections.refresh', $game->slug))->assertRedirect(route('games.show', $game->slug));
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page->has('connections', 1)->where('connectionState.can_refresh', false));
    }

    public function test_client_related_endpoint_is_whitelisted_cached_and_hides_provider_next_urls(): void
    {
        config(['services.rawg.api_key' => 'test-private-key']);
        Http::fake(['api.rawg.io/api/games/100/game-series?*' => Http::response(['results' => [$this->related(200)], 'next' => 'https://api.rawg.io?key=test-private-key'])]);
        $client = app(RawgClient::class);
        $data = $client->related(100, 'game-series');
        $this->assertTrue($data['has_next']);
        $this->assertArrayNotHasKey('next', $data);
        $client->related(100, 'game-series');
        Http::assertSentCount(1);
        $this->expectException(\InvalidArgumentException::class);
        $client->related(100, '../unsafe');
    }

    public function test_background_refresh_preserves_review_pagination_and_throttling_is_a_validation_error(): void
    {
        $game = Game::factory()->create(['rawg_id' => 100, 'connections_synced_at' => now()]);
        Http::preventStrayRequests();
        $this->actingAs(User::factory()->create());
        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->post(route('games.connections.refresh', $game->slug), ['reviews_page' => 2])->assertRedirect(route('games.show', ['game' => $game->slug, 'reviews_page' => 2]));
        }
        $this->post(route('games.connections.refresh', $game->slug))->assertSessionHasErrors('connections');
        Http::assertNothingSent();
    }

    public function test_attempt_timestamps_round_trip_without_changing_the_instant(): void
    {
        $instant = now()->startOfSecond();
        $game = Game::factory()->create(['rawg_id' => 100, 'connections_checked_at' => $instant]);
        $this->assertSame($instant->getTimestamp(), $game->fresh()->connections_checked_at->getTimestamp());
    }
}
