<?php

namespace Tests\Feature\Catalog;

use App\Jobs\SyncIgdbGames;
use App\Models\Game;
use App\Models\Genre;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Services\Igdb\CatalogSynchronizer;
use App\Services\Igdb\IgdbRateLimited;
use Illuminate\Contracts\Queue\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;
use Mockery;
use Tests\TestCase;

class CatalogSyncTest extends TestCase
{
    use RefreshDatabase;

    private function gameData(array $changes = []): array
    {
        return array_replace([
            'id' => 100,
            'name' => 'Test Adventure',
            'slug' => 'test-adventure',
            'summary' => 'A catalog test fixture.',
            'updated_at' => 1700000000,
            'first_release_date' => 1609459200,
            'cover' => ['image_id' => 'test_cover'],
            'genres' => [['id' => 1, 'name' => 'Adventure', 'slug' => 'adventure']],
            'platforms' => [['id' => 6, 'name' => 'PC', 'slug' => 'pc']],
        ], $changes);
    }

    public function test_import_is_idempotent_and_preserves_player_history_and_urls(): void
    {
        $sync = app(CatalogSynchronizer::class);
        $sync->import([$this->gameData()]);
        $game = Game::firstOrFail();
        $entry = LibraryEntry::factory()->for($game)->create();
        Rating::factory()->for($entry)->create(['score' => 9]);

        $sync->import([$this->gameData(['name' => 'Renamed Adventure', 'slug' => 'renamed', 'updated_at' => 1700000001, 'genres' => []])]);

        $this->assertDatabaseCount('games', 1);
        $this->assertDatabaseCount('platforms', 1);
        $this->assertSame($game->id, $entry->fresh()->game_id);
        $this->assertSame('test-adventure', $game->fresh()->slug);
        $this->assertSame('Renamed Adventure', $game->fresh()->name);
        $this->assertSame('2021-01-01', $game->fresh()->released_on->format('Y-m-d'));
        $this->assertSame(0, $game->fresh()->genres()->count());
        $this->assertDatabaseHas('ratings', ['library_entry_id' => $entry->id, 'score' => 9]);
    }

    public function test_import_does_not_overwrite_newer_metadata_with_a_stale_response(): void
    {
        $sync = app(CatalogSynchronizer::class);
        $sync->import([$this->gameData()]);
        $this->assertSame(0, $sync->import([$this->gameData(['name' => 'Stale title', 'updated_at' => 1600000000])]));
        $this->assertDatabaseHas('games', ['name' => 'Test Adventure']);
    }

    public function test_slug_collisions_do_not_overwrite_unrelated_catalog_records(): void
    {
        Game::factory()->create(['slug' => 'test-adventure']);
        Genre::factory()->create(['slug' => 'adventure']);
        app(CatalogSynchronizer::class)->import([$this->gameData()]);

        $this->assertDatabaseHas('games', ['igdb_id' => 100, 'slug' => 'test-adventure-100']);
        $this->assertDatabaseHas('genres', ['igdb_id' => 1, 'slug' => 'adventure-1']);
    }

    public function test_invalid_batches_are_rejected_before_any_game_is_written(): void
    {
        try {
            app(CatalogSynchronizer::class)->import([$this->gameData(), $this->gameData(['id' => 200, 'cover' => ['image_id' => '../../invalid']])]);
            $this->fail('Expected invalid upstream data to be rejected.');
        } catch (ValidationException) {
            $this->assertDatabaseCount('games', 0);
            $this->assertDatabaseCount('genres', 0);
        }
    }

    public function test_inline_command_imports_a_simulated_api_response(): void
    {
        config(['services.igdb.client_id' => 'test-client', 'services.igdb.client_secret' => 'test-secret']);
        Http::preventStrayRequests();
        Http::fake([
            'id.twitch.tv/oauth2/token' => Http::response(['access_token' => 'test-token', 'expires_in' => 3600]),
            'api.igdb.com/v4/games' => Http::response([$this->gameData()]),
        ]);
        $this->artisan('catalog:sync', ['--inline' => true])->assertSuccessful();
        $this->assertDatabaseHas('games', ['igdb_id' => 100, 'name' => 'Test Adventure']);
    }

    public function test_queued_command_dispatches_bounded_pages_without_network_calls(): void
    {
        config(['services.igdb.client_id' => 'test-client', 'services.igdb.client_secret' => 'test-secret']);
        Queue::fake();
        Http::preventStrayRequests();
        $this->artisan('catalog:sync', ['--pages' => 2, '--per-page' => 20, '--offset' => 40])->assertSuccessful();
        Queue::assertPushed(SyncIgdbGames::class, 2);
        Queue::assertPushed(SyncIgdbGames::class, fn (SyncIgdbGames $job) => $job->offset === 60 && $job->limit === 20);
    }

    public function test_command_requires_credentials_and_valid_page_bounds(): void
    {
        config(['services.igdb.client_id' => null, 'services.igdb.client_secret' => null]);
        $this->artisan('catalog:sync')->assertFailed();
        $this->artisan('catalog:sync', ['--pages' => '1;invalid'])->assertFailed();
        $this->artisan('catalog:sync', ['--per-page' => 500])->assertFailed();
        $this->artisan('catalog:sync', ['--offset' => -1])->assertFailed();
    }

    public function test_rate_limited_background_job_is_released_for_later(): void
    {
        $synchronizer = Mockery::mock(CatalogSynchronizer::class);
        $synchronizer->shouldReceive('syncPage')->once()->with(0, 50)->andThrow(new IgdbRateLimited);
        $queueJob = Mockery::mock(Job::class);
        $queueJob->shouldReceive('release')->once()->with(5);
        $job = new SyncIgdbGames(0, 50);
        $job->setJob($queueJob);
        $job->handle($synchronizer);
    }
}
