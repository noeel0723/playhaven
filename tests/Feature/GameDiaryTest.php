<?php

namespace Tests\Feature;

use App\Models\DiaryEntry;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Platform;
use App\Models\Playthrough;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameDiaryTest extends TestCase
{
    use RefreshDatabase;

    private function data(array $overrides = []): array
    {
        return array_replace(['playthrough_id' => null, 'logged_on' => now()->toDateString(), 'minutes_played' => null, 'notes' => null, 'status' => 'playing', 'label' => null, 'platform_id' => null], $overrides);
    }

    public function test_diary_popup_routes_require_authentication(): void
    {
        $game = Game::factory()->create();
        $this->getJson(route('game-diary.options', $game->slug))->assertUnauthorized();
        $this->post(route('game-diary.store', $game->slug), $this->data())->assertRedirect(route('login'));
        $this->assertDatabaseCount('library_entries', 0);
    }

    public function test_opening_options_does_not_add_a_game_and_only_returns_current_players_runs(): void
    {
        $game = Game::factory()->create();
        $user = User::factory()->create();
        $foreignEntry = LibraryEntry::factory()->for($game)->create();
        $foreignRun = Playthrough::factory()->for($foreignEntry)->create(['label' => 'Private foreign run']);
        DiaryEntry::factory()->for($foreignRun)->create(['notes' => 'Private foreign notes']);
        $this->actingAs($user)->getJson(route('game-diary.options', $game->slug))->assertOk()
            ->assertJsonPath('playthroughs', [])->assertJsonPath('today', now()->toDateString());
        $this->assertDatabaseCount('library_entries', 1);

        $entry = LibraryEntry::factory()->for($user)->for($game)->create();
        $run = Playthrough::factory()->for($entry)->create(['label' => 'My run']);
        DiaryEntry::factory()->for($run)->create(['notes' => 'Private own notes']);
        $response = $this->getJson(route('game-diary.options', $game->slug))->assertOk()
            ->assertJsonCount(1, 'playthroughs')->assertJsonPath('playthroughs.0.id', $run->id)
            ->assertDontSee('Private foreign')->assertDontSee('Private own notes');
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_first_log_atomically_adds_a_library_entry_run_and_private_session_and_returns_to_game(): void
    {
        $game = Game::factory()->create();
        $platform = Platform::factory()->create();
        $game->platforms()->attach($platform);
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('game-diary.store', $game->slug), $this->data([
            'platform_id' => $platform->id, 'label' => 'First run', 'minutes_played' => 0, 'notes' => '<b>My note</b>', 'status' => 'completed',
            'user_id' => 99999, 'library_entry_id' => 99999, 'is_public' => true,
        ]))->assertRedirect(route('games.show', $game->slug));
        $entry = $user->libraryEntries()->sole();
        $this->assertSame($game->id, $entry->game_id);
        $this->assertNull($entry->status);
        $this->assertFalse($entry->is_favorite);
        $run = $entry->playthroughs()->sole();
        $this->assertSame('completed', $run->status->value);
        $this->assertNull($run->started_on);
        $this->assertNull($run->finished_on);
        $this->assertSame($platform->id, $run->platform_id);
        $this->assertSame(0, $run->diaryEntries()->sole()->minutes_played);
        $this->assertSame('<b>My note</b>', $run->diaryEntries()->sole()->notes);
        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_existing_run_logging_preserves_metadata_rating_review_and_library_status(): void
    {
        $entry = LibraryEntry::factory()->create(['status' => 'completed', 'is_favorite' => true]);
        $rating = Rating::factory()->for($entry)->create(['score' => 9]);
        $review = Review::factory()->for($entry)->create();
        $run = Playthrough::factory()->for($entry)->create(['label' => 'Original', 'status' => 'paused', 'started_on' => '2026-01-01', 'finished_on' => '2026-01-05']);
        $this->actingAs($entry->user);
        foreach ([null, 0, 90] as $minutes) {
            $this->post(route('game-diary.store', $entry->game->slug), $this->data(['playthrough_id' => $run->id, 'logged_on' => '2026-01-03', 'minutes_played' => $minutes, 'label' => 'Overwrite', 'status' => 'dropped', 'platform_id' => 99999]))->assertRedirect(route('games.show', $entry->game->slug));
        }
        $this->assertDatabaseCount('playthroughs', 1);
        $this->assertSame(3, $run->diaryEntries()->count());
        $this->assertSame('Original', $run->fresh()->label);
        $this->assertSame('paused', $run->fresh()->status->value);
        $this->assertSame('completed', $entry->fresh()->status->value);
        $this->assertTrue($entry->fresh()->is_favorite);
        $this->assertSame(9, $rating->fresh()->score);
        $this->assertModelExists($review);
    }

    public function test_foreign_wrong_game_and_missing_runs_cannot_receive_sessions_or_create_orphan_entries(): void
    {
        $user = User::factory()->create();
        $game = Game::factory()->create();
        $foreign = Playthrough::factory()->create();
        $ownOtherGame = Playthrough::factory()->for(LibraryEntry::factory()->for($user))->create();
        $this->actingAs($user);
        foreach ([$foreign->id, $ownOtherGame->id, 999999] as $id) {
            $this->post(route('game-diary.store', $game->slug), $this->data(['playthrough_id' => $id]))->assertNotFound();
        }
        $this->assertDatabaseCount('library_entries', 2);
        $this->assertDatabaseCount('playthroughs', 2);
        $this->assertDatabaseCount('diary_entries', 0);
    }

    public function test_invalid_fields_and_run_date_bounds_leave_no_partial_writes(): void
    {
        $game = Game::factory()->create();
        $otherPlatform = Platform::factory()->create();
        $user = User::factory()->create();
        $this->actingAs($user);
        foreach ([
            ['status' => 'backlog'], ['platform_id' => $otherPlatform->id], ['label' => str_repeat('x', 101)],
            ['logged_on' => now()->addDay()->toDateString()], ['logged_on' => '2026-02-30'],
            ['minutes_played' => -1], ['minutes_played' => 1441], ['minutes_played' => 0.5],
            ['notes' => str_repeat('x', 5001)], ['playthrough_id' => 'bad'],
        ] as $invalid) {
            $this->post(route('game-diary.store', $game->slug), $this->data($invalid))->assertSessionHasErrors(array_key_first($invalid));
        }
        $this->assertDatabaseCount('library_entries', 0);
        $this->assertDatabaseCount('playthroughs', 0);
        $this->assertDatabaseCount('diary_entries', 0);
        $entry = LibraryEntry::factory()->for($user)->for($game)->create();
        $run = Playthrough::factory()->for($entry)->create(['started_on' => '2026-01-02', 'finished_on' => '2026-01-05']);
        foreach (['2026-01-01', '2026-01-06'] as $date) {
            $this->post(route('game-diary.store', $game->slug), $this->data(['playthrough_id' => $run->id, 'logged_on' => $date]))->assertSessionHasErrors('logged_on');
        }
        $this->assertDatabaseCount('diary_entries', 0);
    }
}
