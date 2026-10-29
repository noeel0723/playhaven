<?php

namespace Tests\Feature;

use App\Enums\PlaythroughStatus;
use App\Models\DiaryEntry;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Platform;
use App\Models\Playthrough;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PlayerHistoryTest extends TestCase
{
    use RefreshDatabase;

    private function runData(array $overrides = []): array
    {
        return array_replace(['label' => 'First journey', 'platform_id' => null, 'status' => 'playing', 'started_on' => '2026-01-01', 'finished_on' => null], $overrides);
    }

    private function sessionData(array $overrides = []): array
    {
        return array_replace(['logged_on' => '2026-01-02', 'minutes_played' => 60, 'notes' => 'A chapter to remember.'], $overrides);
    }

    public function test_guests_cannot_read_or_write_playing_history(): void
    {
        $run = Playthrough::factory()->create();
        $session = DiaryEntry::factory()->for($run)->create();
        foreach ([route('playthroughs.index', $run->libraryEntry->game->slug), route('playthroughs.show', $run->id), route('diary.index')] as $url) {
            $this->get($url)->assertRedirect(route('login'));
        }
        $this->post(route('playthroughs.store', $run->libraryEntry->game->slug), $this->runData())->assertRedirect(route('login'));
        $this->put(route('playthroughs.update', $run->id), $this->runData())->assertRedirect(route('login'));
        $this->delete(route('playthroughs.destroy', $run->id), ['confirm' => true])->assertRedirect(route('login'));
        $this->post(route('sessions.store', $run->id), $this->sessionData())->assertRedirect(route('login'));
        $this->put(route('sessions.update', [$run->id, $session->id]), $this->sessionData())->assertRedirect(route('login'));
        $this->delete(route('sessions.destroy', [$run->id, $session->id]), ['confirm' => true])->assertRedirect(route('login'));
        $this->assertModelExists($session);
    }

    public static function statuses(): array
    {
        return array_map(fn (PlaythroughStatus $status) => [$status->value], PlaythroughStatus::cases());
    }

    #[DataProvider('statuses')]
    public function test_repeated_playthroughs_preserve_library_rating_and_review(string $status): void
    {
        $entry = LibraryEntry::factory()->create(['status' => 'completed', 'is_favorite' => true]);
        $rating = Rating::factory()->for($entry)->create(['score' => 9]);
        $review = Review::factory()->for($entry)->create();
        $first = Playthrough::factory()->for($entry)->create(['status' => 'completed']);
        $this->actingAs($entry->user)->post(route('playthroughs.store', $entry->game->slug), $this->runData(['label' => 'New Game+', 'status' => $status]))->assertRedirect();
        $this->assertDatabaseCount('playthroughs', 2);
        $this->assertDatabaseHas('playthroughs', ['library_entry_id' => $entry->id, 'label' => 'New Game+', 'status' => $status]);
        $this->assertSame('completed', $entry->fresh()->status->value);
        $this->assertSame('completed', $first->fresh()->status->value);
        $this->assertSame(9, $rating->fresh()->score);
        $this->assertModelExists($review);
    }

    public function test_playthrough_platform_must_belong_to_the_game_and_nullable_dates_are_supported(): void
    {
        $entry = LibraryEntry::factory()->create();
        $platform = Platform::factory()->create();
        $other = Platform::factory()->create();
        $entry->game->platforms()->attach($platform);
        $url = route('playthroughs.store', $entry->game->slug);
        $this->actingAs($entry->user)->post($url, $this->runData(['platform_id' => $other->id]))->assertSessionHasErrors('platform_id');
        $this->post($url, $this->runData(['platform_id' => $platform->id, 'started_on' => null, 'finished_on' => '2026-01-05']))->assertRedirect();
        $run = $entry->playthroughs()->sole();
        $this->assertSame($platform->id, $run->platform_id);
        $this->assertNull($run->started_on);
    }

    public function test_dates_status_and_required_fields_are_validated_before_writes(): void
    {
        $entry = LibraryEntry::factory()->create();
        $url = route('playthroughs.store', $entry->game->slug);
        $this->actingAs($entry->user)->post($url, $this->runData(['started_on' => '2026-01-10', 'finished_on' => '2026-01-01', 'status' => 'backlog']))->assertSessionHasErrors(['finished_on', 'status']);
        $this->post($url, $this->runData(['started_on' => now()->addDay()->toDateString()]))->assertSessionHasErrors('started_on');
        $this->post($url, $this->runData(['started_on' => '0000-01-01', 'label' => str_repeat('x', 101)]))->assertSessionHasErrors(['started_on', 'label']);
        $this->post($url, ['status' => 'playing'])->assertSessionHasErrors(['label', 'platform_id', 'started_on', 'finished_on']);
        $this->assertDatabaseCount('playthroughs', 0);
    }

    public function test_missing_owned_library_entry_and_foreign_runs_are_inaccessible(): void
    {
        $run = Playthrough::factory()->create();
        $game = $run->libraryEntry->game;
        $this->actingAs(User::factory()->create())->get(route('playthroughs.index', $game->slug))->assertNotFound();
        $this->post(route('playthroughs.store', $game->slug), $this->runData())->assertNotFound();
        $this->get(route('playthroughs.show', $run->id))->assertNotFound();
        $this->put(route('playthroughs.update', $run->id), $this->runData())->assertNotFound();
        $this->delete(route('playthroughs.destroy', $run->id), ['confirm' => true])->assertNotFound();
        $this->post(route('sessions.store', $run->id), $this->sessionData())->assertNotFound();
        $this->assertModelExists($run);
    }

    public function test_client_ownership_fields_cannot_move_runs_or_sessions(): void
    {
        $owner = LibraryEntry::factory()->create();
        $other = Playthrough::factory()->create();
        $this->actingAs($owner->user)->post(route('playthroughs.store', $owner->game->slug), $this->runData(['library_entry_id' => $other->library_entry_id, 'id' => $other->id]))->assertRedirect();
        $run = $owner->playthroughs()->sole();
        $this->post(route('sessions.store', $run->id), $this->sessionData(['playthrough_id' => $other->id, 'user_id' => $other->libraryEntry->user_id]))->assertRedirect();
        $this->assertSame(1, $run->diaryEntries()->count());
        $this->assertSame(0, $other->diaryEntries()->count());
    }

    public function test_multiple_sessions_on_a_day_allow_unknown_and_zero_durations_and_update_totals(): void
    {
        $run = Playthrough::factory()->create();
        $this->actingAs($run->libraryEntry->user);
        foreach ([null, 0, 90] as $minutes) {
            $this->post(route('sessions.store', $run->id), $this->sessionData(['minutes_played' => $minutes]))->assertRedirect(route('playthroughs.show', $run->id));
        }
        $this->get(route('playthroughs.show', $run->id))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('playthrough.sessions_count', 3)->where('playthrough.minutes_played', 90)->has('sessions.data', 3));
        $session = $run->diaryEntries()->where('minutes_played', 90)->sole();
        $this->put(route('sessions.update', [$run->id, $session->id]), $this->sessionData(['minutes_played' => 30, 'notes' => 'Updated notes.']))->assertRedirect();
        $this->assertSame(30, $session->fresh()->minutes_played);
        $this->get(route('diary.index'))->assertInertia(fn (Assert $page) => $page->where('totals.sessions', 3)->where('totals.minutes', 30));
    }

    public function test_session_values_and_playthrough_boundaries_are_validated(): void
    {
        $run = Playthrough::factory()->create(['started_on' => '2026-01-02', 'finished_on' => '2026-01-05']);
        $url = route('sessions.store', $run->id);
        $this->actingAs($run->libraryEntry->user);
        foreach ([-1, 0.5, 1441, 5000000000, ['bad']] as $minutes) {
            $this->post($url, $this->sessionData(['minutes_played' => $minutes]))->assertSessionHasErrors('minutes_played');
        }
        foreach (['2026-01-01', '2026-01-06', now()->addDay()->toDateString(), '2026-02-30'] as $date) {
            $this->post($url, $this->sessionData(['logged_on' => $date]))->assertSessionHasErrors('logged_on');
        }
        $this->post($url, $this->sessionData(['notes' => str_repeat('x', 5001)]))->assertSessionHasErrors('notes');
        $this->assertDatabaseCount('diary_entries', 0);
    }

    public function test_changing_run_dates_cannot_exclude_existing_sessions(): void
    {
        $run = Playthrough::factory()->create();
        $session = DiaryEntry::factory()->for($run)->create(['logged_on' => '2026-01-05']);
        $url = route('playthroughs.update', $run->id);
        $this->actingAs($run->libraryEntry->user)->put($url, $this->runData(['started_on' => '2026-01-06']))->assertSessionHasErrors('started_on');
        $this->put($url, $this->runData(['finished_on' => '2026-01-04']))->assertSessionHasErrors('finished_on');
        $this->put($url, ['status' => 'completed'])->assertSessionHasErrors(['started_on', 'finished_on']);
        $this->put($url, $this->runData(['started_on' => null, 'finished_on' => null, 'status' => 'paused']))->assertRedirect();
        $this->assertModelExists($session);
        $this->assertNull($run->fresh()->started_on);
    }

    public function test_historical_platform_can_be_kept_after_catalog_associations_change(): void
    {
        $platform = Platform::factory()->create();
        $run = Playthrough::factory()->create(['platform_id' => $platform->id]);
        $this->actingAs($run->libraryEntry->user)->get(route('playthroughs.show', $run->id))->assertInertia(fn (Assert $page) => $page
            ->where('platforms.0.id', $platform->id));
        $this->put(route('playthroughs.update', $run->id), $this->runData(['platform_id' => $platform->id]))->assertRedirect();
        $this->assertSame($platform->id, $run->fresh()->platform_id);
    }

    public function test_sessions_cannot_be_edited_or_deleted_through_another_run(): void
    {
        $run = Playthrough::factory()->create();
        $otherOwnedRun = Playthrough::factory()->for($run->libraryEntry)->create();
        $ownSession = DiaryEntry::factory()->for($run)->create();
        $foreignSession = DiaryEntry::factory()->create();
        $this->actingAs($run->libraryEntry->user)->put(route('sessions.update', [$otherOwnedRun->id, $ownSession->id]), $this->sessionData())->assertNotFound();
        $this->put(route('sessions.update', [$run->id, $foreignSession->id]), $this->sessionData())->assertNotFound();
        $this->delete(route('sessions.destroy', [$run->id, $foreignSession->id]), ['confirm' => true])->assertNotFound();
        $this->assertModelExists($ownSession);
        $this->assertModelExists($foreignSession);
    }

    public function test_diary_filtering_and_totals_are_private_and_title_wildcards_are_literal(): void
    {
        $entry = LibraryEntry::factory()->for(Game::factory()->state(['name' => '100%_Adventure']))->create();
        $run = Playthrough::factory()->for($entry)->create();
        $match = DiaryEntry::factory()->for($run)->create(['logged_on' => '2026-01-05', 'minutes_played' => 75, 'notes' => 'My private memory.']);
        DiaryEntry::factory()->for($run)->create(['logged_on' => '2026-01-01', 'minutes_played' => 20]);
        DiaryEntry::factory()->create(['logged_on' => '2026-01-05', 'minutes_played' => 100, 'notes' => 'OTHER_PRIVATE_MEMORY']);
        $this->actingAs($entry->user)->get(route('diary.index', ['q' => '%_', 'from' => '2026-01-04', 'to' => '2026-01-06']))->assertDontSee('OTHER_PRIVATE_MEMORY')->assertInertia(fn (Assert $page) => $page
            ->component('diary/index')->where('totals.sessions', 1)->where('totals.minutes', 75)->has('sessions.data', 1)->where('sessions.data.0.id', $match->id)
            ->where('sessions.data.0.playthrough.game.name', '100%_Adventure')->missing('sessions.data.0.user_id'));
        $this->get(route('games.show', $entry->game->slug))->assertDontSee('My private memory.')->assertInertia(fn (Assert $page) => $page->missing('playthroughs')->missing('sessions'));
    }

    public function test_history_pagination_and_date_sorting_are_stable(): void
    {
        $run = Playthrough::factory()->create();
        DiaryEntry::factory()->for($run)->count(21)->create(['logged_on' => '2026-01-05']);
        $latest = DiaryEntry::factory()->for($run)->create(['logged_on' => '2026-01-06']);
        Playthrough::factory()->for($run->libraryEntry)->count(11)->create();
        $this->actingAs($run->libraryEntry->user)->get(route('diary.index', ['q' => $run->libraryEntry->game->name, 'from' => '2026-01-01']))->assertInertia(fn (Assert $page) => $page
            ->has('sessions.data', 20)->where('sessions.meta.total', 22)->where('sessions.data.0.id', $latest->id)
            ->where('sessions.links.next', fn ($url) => str_contains($url, 'from=2026-01-01') && str_contains($url, 'page=2')));
        $this->get(route('playthroughs.show', $run->id))->assertInertia(fn (Assert $page) => $page->has('sessions.data', 20)->where('sessions.meta.total', 22));
        $this->get(route('playthroughs.index', $run->libraryEntry->game->slug))->assertInertia(fn (Assert $page) => $page->has('playthroughs.data', 10)->where('playthroughs.meta.total', 12));
    }

    public function test_filter_shapes_and_invalid_route_ids_are_rejected(): void
    {
        $this->actingAs(User::factory()->create())->get(route('diary.index', ['from' => '2026-01-10', 'to' => '2026-01-01', 'q' => ['bad'], 'page' => 0]))->assertSessionHasErrors(['to', 'q', 'page']);
        $this->get('/playthroughs/not-a-number')->assertNotFound();
        $this->get('/playthroughs/999999999999999999999999')->assertNotFound();
    }

    public function test_confirmed_session_removal_preserves_its_playthrough_and_other_sessions(): void
    {
        $run = Playthrough::factory()->create();
        $session = DiaryEntry::factory()->for($run)->create();
        $other = DiaryEntry::factory()->for($run)->create();
        $url = route('sessions.destroy', [$run->id, $session->id]);
        $this->actingAs($run->libraryEntry->user)->delete($url)->assertSessionHasErrors('confirm');
        $this->assertModelExists($session);
        $this->delete($url, ['confirm' => true])->assertRedirect(route('playthroughs.show', $run->id));
        $this->assertModelMissing($session);
        $this->assertModelExists($other);
        $this->assertModelExists($run);
    }

    public function test_confirmed_run_removal_only_cascades_its_own_diary(): void
    {
        $run = Playthrough::factory()->create();
        $entry = $run->libraryEntry;
        $session = DiaryEntry::factory()->for($run)->create();
        $otherRun = Playthrough::factory()->for($entry)->create();
        $otherSession = DiaryEntry::factory()->for($otherRun)->create();
        $rating = Rating::factory()->for($entry)->create();
        $review = Review::factory()->for($entry)->create();
        $url = route('playthroughs.destroy', $run->id);
        $this->actingAs($entry->user)->delete($url, ['confirm' => false])->assertSessionHasErrors('confirm');
        $this->assertModelExists($session);
        $this->delete($url, ['confirm' => true])->assertRedirect(route('playthroughs.index', $entry->game->slug));
        $this->assertModelMissing($session);
        $this->assertModelMissing($run);
        foreach ([$entry, $otherRun, $otherSession, $rating, $review] as $record) {
            $this->assertModelExists($record);
        }
    }

    public function test_verification_is_required_outside_local_but_the_local_bypass_still_applies(): void
    {
        $entry = LibraryEntry::factory()->for(User::factory()->unverified())->create();
        $this->actingAs($entry->user)->get(route('diary.index'))->assertRedirect(route('verification.notice'));
        $this->post(route('playthroughs.store', $entry->game->slug), $this->runData())->assertRedirect(route('verification.notice'));
        $this->app->instance('env', 'local');
        config(['auth.require_email_verification' => false]);
        $this->withSession(['_token' => 'history-test-token'])->withHeader('X-CSRF-TOKEN', 'history-test-token');
        $this->get(route('diary.index'))->assertOk();
        $this->post(route('playthroughs.store', $entry->game->slug), $this->runData())->assertRedirect();
        $this->assertDatabaseCount('playthroughs', 1);
        $this->assertNull($entry->user->fresh()->email_verified_at);
    }
}
