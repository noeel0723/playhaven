<?php

namespace Tests\Feature\Catalog;

use App\Jobs\SyncRawgGameDetails;
use App\Jobs\SyncRawgGames;
use App\Models\Game;
use App\Models\Genre;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Services\Rawg\CatalogSynchronizer;
use App\Services\Rawg\RawgRateLimited;
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
            'description_raw' => 'A catalog test fixture.',
            'updated' => '2023-11-14T22:13:20',
            'released' => '2021-01-01',
            'background_image' => 'https://media.rawg.io/media/games/test.jpg',
            'genres' => [['id' => 1, 'name' => 'Adventure', 'slug' => 'adventure']],
            'platforms' => [['platform' => ['id' => 6, 'name' => 'PC', 'slug' => 'pc']]],
        ], $changes);
    }

    public function test_import_is_idempotent_and_preserves_player_history_and_urls(): void
    {
        $sync = app(CatalogSynchronizer::class);
        $sync->import([$this->gameData()]);
        $game = Game::firstOrFail();
        $entry = LibraryEntry::factory()->for($game)->create();
        Rating::factory()->for($entry)->create(['score' => 9]);

        $sync->import([$this->gameData(['name' => 'Renamed Adventure', 'slug' => 'renamed', 'updated' => '2023-11-14T22:13:21', 'genres' => []])]);

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
        $this->assertSame(0, $sync->import([$this->gameData(['name' => 'Stale title', 'updated' => '2020-09-13T12:26:40'])]));
        $this->assertDatabaseHas('games', ['name' => 'Test Adventure']);
    }

    public function test_slug_collisions_do_not_overwrite_unrelated_catalog_records(): void
    {
        Game::factory()->create(['slug' => 'test-adventure']);
        Genre::factory()->create(['slug' => 'adventure']);
        app(CatalogSynchronizer::class)->import([$this->gameData()]);

        $this->assertDatabaseHas('games', ['rawg_id' => 100, 'slug' => 'test-adventure-rawg-100']);
        $this->assertDatabaseHas('genres', ['rawg_id' => 1, 'slug' => 'adventure-rawg-1']);
    }

    public function test_invalid_batches_are_rejected_before_any_game_is_written(): void
    {
        try {
            app(CatalogSynchronizer::class)->import([$this->gameData(), $this->gameData(['id' => 200, 'updated' => 'invalid-date'])]);
            $this->fail('Expected invalid upstream data to be rejected.');
        } catch (ValidationException) {
            $this->assertDatabaseCount('games', 0);
            $this->assertDatabaseCount('genres', 0);
        }
    }

    public function test_inline_command_imports_a_simulated_api_response(): void
    {
        config(['services.rawg.api_key' => 'test-key']);
        Http::preventStrayRequests();
        Http::fake([
            'api.rawg.io/api/games?*' => Http::response(['results' => [$this->gameData()]]),
            'api.rawg.io/api/games/100?*' => Http::response($this->gameData()),
        ]);
        $this->artisan('catalog:sync', ['--inline' => true])->assertSuccessful();
        $this->assertDatabaseHas('games', ['rawg_id' => 100, 'name' => 'Test Adventure']);
    }

    public function test_queued_command_dispatches_bounded_pages_without_network_calls(): void
    {
        config(['services.rawg.api_key' => 'test-key']);
        Queue::fake();
        Http::preventStrayRequests();
        $this->artisan('catalog:sync', ['--pages' => 2, '--per-page' => 20, '--page' => 3])->assertSuccessful();
        Queue::assertPushed(SyncRawgGames::class, 2);
        Queue::assertPushed(SyncRawgGames::class, fn (SyncRawgGames $job) => $job->page === 4 && $job->pageSize === 20);
    }

    public function test_command_requires_credentials_and_valid_page_bounds(): void
    {
        config(['services.rawg.api_key' => null]);
        $this->artisan('catalog:sync')->assertFailed();
        $this->artisan('catalog:sync', ['--pages' => '1;invalid'])->assertFailed();
        $this->artisan('catalog:sync', ['--per-page' => 500])->assertFailed();
        $this->artisan('catalog:sync', ['--page' => -1])->assertFailed();
    }

    public function test_rate_limited_background_job_is_released_for_later(): void
    {
        $synchronizer = Mockery::mock(CatalogSynchronizer::class);
        $synchronizer->shouldReceive('syncPage')->once()->with(1, 20)->andThrow(new RawgRateLimited(5));
        $queueJob = Mockery::mock(Job::class);
        $queueJob->shouldReceive('release')->once()->with(5);
        $job = new SyncRawgGames(1, 20);
        $job->setJob($queueJob);
        $job->handle($synchronizer);
    }

    public function test_rawg_ids_do_not_overwrite_igdb_ids_or_unrelated_history(): void
    {
        $legacy = Game::factory()->create(['igdb_id' => 100, 'slug' => 'legacy-title']);
        $entry = LibraryEntry::factory()->for($legacy)->create();
        Rating::factory()->for($entry)->create(['score' => 10]);
        app(CatalogSynchronizer::class)->import([$this->gameData()]);
        $this->assertDatabaseCount('games', 2);
        $this->assertDatabaseHas('games', ['id' => $legacy->id, 'igdb_id' => 100, 'rawg_id' => null]);
        $this->assertDatabaseHas('ratings', ['library_entry_id' => $entry->id, 'score' => 10]);
    }

    public function test_plain_text_descriptions_are_preserved_by_list_refreshes(): void
    {
        $sync = app(CatalogSynchronizer::class);
        $sync->import([$this->gameData(['description_raw' => null, 'description' => '<p>Test &amp; safe</p>'])], true);
        $game = Game::firstOrFail();
        $this->assertSame('Test & safe', $game->summary);
        $this->assertNotNull($game->rawg_details_synced_at);
        $sync->import([$this->gameData()]);
        $this->assertSame('Test & safe', $game->fresh()->summary);
    }

    public function test_page_jobs_dispatch_details_as_separate_jobs(): void
    {
        Queue::fake();
        $sync = Mockery::mock(CatalogSynchronizer::class);
        $sync->shouldReceive('syncPage')->once()->with(1, 20)->andReturn(['imported' => 2, 'ids' => [100, 200]]);
        (new SyncRawgGames(1, 20))->handle($sync);
        Queue::assertPushed(SyncRawgGameDetails::class, 2);
    }

    public function test_recent_details_are_not_fetched_again(): void
    {
        Http::preventStrayRequests();
        app(CatalogSynchronizer::class)->import([$this->gameData()], true);
        app(CatalogSynchronizer::class)->syncGame(100);
        Http::assertNothingSent();
    }
}
