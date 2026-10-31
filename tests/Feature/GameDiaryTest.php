<?php

namespace Tests\Feature;

use App\Models\DiaryEntry;
use App\Models\Game;
use App\Models\GameDiaryLog;
use App\Models\LibraryEntry;
use App\Models\Playthrough;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class GameDiaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(now()->setDate(2026, 11, 1)->startOfDay());
    }

    private function data(array $overrides = []): array
    {
        return array_replace([
            'status' => 'playing', 'logged_on' => '2026-11-01',
            'completed_on' => null, 'review_body' => '',
            'contains_spoilers' => false, 'is_public' => false,
        ], $overrides);
    }

    private function log(LibraryEntry $entry, array $overrides = []): GameDiaryLog
    {
        return $entry->diaryLogs()->create(array_replace([
            'status' => 'playing', 'logged_on' => '2026-10-30',
            'completed_on' => null, 'review_body' => null, 'contains_spoilers' => false,
        ], $overrides));
    }

    public function test_diary_routes_require_authentication(): void
    {
        $game = Game::factory()->create();
        $log = $this->log(LibraryEntry::factory()->create());
        $this->getJson(route('game-diary.options', $game->slug))->assertUnauthorized();
        $this->post(route('game-diary.store', $game->slug), $this->data())->assertRedirect(route('login'));
        $this->get(route('diary.index'))->assertRedirect(route('login'));
        $this->delete(route('game-diary.destroy', $log), ['confirm' => true])->assertRedirect(route('login'));
        $this->assertModelExists($log);
        $this->assertDatabaseCount('library_entries', 1);
    }

    public function test_opening_options_is_read_only_and_returns_only_the_current_players_values(): void
    {
        $game = Game::factory()->create();
        $foreign = LibraryEntry::factory()->for($game)->create(['status' => 'completed']);
        Review::factory()->for($foreign)->create(['body' => 'FOREIGN PRIVATE REVIEW']);
        Rating::factory()->for($foreign)->create(['score' => 2]);
        $user = User::factory()->create();
        $this->actingAs($user)->getJson(route('game-diary.options', $game->slug))->assertOk()
            ->assertExactJson(['today' => '2026-11-01', 'status' => null, 'completed_on' => null, 'review' => null, 'stars' => null]);
        $this->assertDatabaseCount('library_entries', 1);

        $entry = LibraryEntry::factory()->for($game)->for($user)->create(['status' => 'completed']);
        $entry->completed_at = '2026-10-25';
        $entry->save();
        Review::factory()->for($entry)->create(['body' => 'My review', 'is_public' => false, 'contains_spoilers' => true]);
        Rating::factory()->for($entry)->create(['score' => 9]);
        $response = $this->getJson(route('game-diary.options', $game->slug))->assertOk()
            ->assertJsonPath('status', 'completed')->assertJsonPath('completed_on', '2026-10-25')
            ->assertJsonPath('review.body', 'My review')->assertJsonPath('review.is_public', false)
            ->assertJsonPath('stars', 4.5)
            ->assertJsonPath('review.contains_spoilers', true)->assertDontSee('FOREIGN PRIVATE REVIEW');
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertDatabaseCount('game_diary_logs', 0);
        $this->assertDatabaseCount('playthroughs', 0);
    }

    public function test_first_log_updates_library_and_saves_a_private_review_without_inventing_playing_sessions(): void
    {
        $game = Game::factory()->create();
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('game-diary.store', $game->slug), $this->data([
            'status' => 'completed', 'completed_on' => '2026-10-23', 'review_body' => " \u{00a0}A thoughtful ending.\u{00a0} ",
            'user_id' => 999, 'library_entry_id' => 999,
        ]))->assertRedirect(route('games.show', $game->slug));
        $entry = $user->libraryEntries()->sole();
        $this->assertSame($game->id, $entry->game_id);
        $this->assertSame('completed', $entry->status->value);
        $this->assertSame('2026-10-23', $entry->completed_at->format('Y-m-d'));
        $this->assertFalse($entry->is_favorite);
        $this->assertSame('A thoughtful ending.', $entry->review->body);
        $this->assertFalse($entry->review->is_public);
        $this->assertSame('A thoughtful ending.', $entry->diaryLogs()->sole()->review_body);
        $this->assertDatabaseCount('playthroughs', 0);
        $this->assertDatabaseCount('diary_entries', 0);
        $this->assertDatabaseCount('ratings', 0);
    }

    public static function statuses(): array
    {
        return [['playing'], ['completed'], ['paused'], ['dropped']];
    }

    public static function ratings(): array
    {
        return array_map(fn (int $score) => [$score / 2], range(1, 10));
    }

    #[DataProvider('ratings')]
    public function test_diary_rating_is_saved_to_the_same_rating_shown_on_game_details(float $stars): void
    {
        $game = Game::factory()->create();
        $user = User::factory()->create();
        $foreign = LibraryEntry::factory()->for($game)->create();
        $foreignRating = Rating::factory()->for($foreign)->create(['score' => 2]);
        $this->actingAs($user)->post(route('game-diary.store', $game->slug), $this->data([
            'stars' => $stars, 'review_body' => 'My rated diary entry',
        ]))->assertRedirect(route('games.show', $game->slug));
        $entry = $user->libraryEntries()->sole();
        $this->assertSame((int) ($stars * 2), $entry->rating()->sole()->score);
        $this->assertSame(2, $foreignRating->fresh()->score);
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page
            ->where('personalRating', fn (int|float $value) => (float) $value === $stars)->where('personalReview.body', 'My rated diary entry')
            ->where('game.ratings_count', 2));
        $this->get(route('diary.index'))->assertInertia(fn (Assert $page) => $page
            ->where('logs.data.0.rating', fn (int|float $value) => (float) $value === $stars));
    }

    public function test_diary_updates_and_explicitly_clears_the_current_rating_without_duplicate_votes(): void
    {
        $entry = LibraryEntry::factory()->create(['is_favorite' => true]);
        $rating = Rating::factory()->for($entry)->create(['score' => 8]);
        $this->actingAs($entry->user);
        $url = route('game-diary.store', $entry->game->slug);
        $this->post($url, $this->data(['stars' => 3.5, 'return_to_diary' => true]))->assertRedirect(route('diary.index'));
        $this->assertSame(7, $rating->fresh()->score);
        $this->assertDatabaseCount('ratings', 1);
        $this->post($url, $this->data())->assertRedirect();
        $this->assertSame(7, $rating->fresh()->score);
        $this->post($url, $this->data(['stars' => null]))->assertRedirect();
        $this->assertModelMissing($rating);
        $this->assertTrue($entry->fresh()->is_favorite);
        $this->get(route('games.show', $entry->game->slug))->assertInertia(fn (Assert $page) => $page
            ->where('personalRating', null)->where('game.ratings_count', 0));
    }

    public function test_invalid_diary_rating_does_not_partially_change_status_review_or_completion(): void
    {
        $entry = LibraryEntry::factory()->create(['status' => 'playing']);
        $rating = Rating::factory()->for($entry)->create(['score' => 9]);
        $review = Review::factory()->for($entry)->create(['body' => 'Keep original']);
        $this->actingAs($entry->user)->post(route('game-diary.store', $entry->game->slug), $this->data([
            'stars' => 4.2, 'status' => 'completed', 'completed_on' => '2026-10-30', 'review_body' => 'Do not save',
        ]))->assertSessionHasErrors('stars');
        $this->assertSame('playing', $entry->fresh()->status->value);
        $this->assertNull($entry->fresh()->completed_at);
        $this->assertSame(9, $rating->fresh()->score);
        $this->assertSame('Keep original', $review->fresh()->body);
        $this->assertDatabaseCount('game_diary_logs', 0);
    }

    #[DataProvider('statuses')]
    public function test_status_changes_preserve_ratings_favorites_and_existing_playing_history(string $status): void
    {
        $entry = LibraryEntry::factory()->create(['status' => 'completed', 'is_favorite' => true]);
        $run = Playthrough::factory()->for($entry)->create(['status' => 'paused', 'started_on' => '2026-01-01']);
        $session = DiaryEntry::factory()->for($run)->create(['logged_on' => '2026-01-02', 'minutes_played' => 75]);
        $rating = Rating::factory()->for($entry)->create(['score' => 9]);
        $review = Review::factory()->for($entry)->create(['body' => 'Keep this review']);
        $this->actingAs($entry->user)->post(route('game-diary.store', $entry->game->slug), $this->data([
            'status' => $status, 'completed_on' => '2026-10-10',
        ]))->assertRedirect();
        $entry->refresh();
        $this->assertSame($status, $entry->status->value);
        $this->assertTrue($entry->is_favorite);
        $this->assertSame($status === 'completed' ? '2026-10-10' : null, $entry->completed_at?->format('Y-m-d'));
        $this->assertSame($status === 'completed' ? '2026-10-10' : null, $entry->diaryLogs()->sole()->completed_on?->format('Y-m-d'));
        $this->assertSame(9, $rating->fresh()->score);
        $this->assertSame('Keep this review', $review->fresh()->body);
        $this->assertSame('paused', $run->fresh()->status->value);
        $this->assertSame(75, $session->fresh()->minutes_played);
        $this->assertDatabaseCount('playthroughs', 1);
        $this->assertDatabaseCount('diary_entries', 1);
    }

    public function test_later_logs_do_not_rewrite_earlier_snapshots_and_public_visibility_is_explicit(): void
    {
        $entry = LibraryEntry::factory()->create();
        $this->actingAs($entry->user);
        $url = route('game-diary.store', $entry->game->slug);
        $this->post($url, $this->data(['review_body' => 'First impressions', 'is_public' => true]))->assertRedirect();
        $first = $entry->diaryLogs()->sole();
        $this->assertTrue($entry->review()->sole()->is_public);
        $this->post($url, $this->data([
            'status' => 'completed', 'completed_on' => '2026-10-31',
            'review_body' => 'Final verdict', 'is_public' => false, 'contains_spoilers' => true, 'return_to_diary' => true,
        ]))->assertRedirect(route('diary.index'));
        $this->assertSame('First impressions', $first->fresh()->review_body);
        $this->assertSame('playing', $first->fresh()->status->value);
        $this->assertSame('Final verdict', $entry->review()->sole()->body);
        $this->assertFalse($entry->review()->sole()->is_public);
        $this->assertTrue($entry->review()->sole()->contains_spoilers);
        $this->assertDatabaseCount('reviews', 1);
        $this->assertDatabaseCount('game_diary_logs', 2);
        $this->actingAs(User::factory()->create())->get(route('diary.index'))->assertDontSee('First impressions')->assertDontSee('Final verdict');
    }

    public function test_blank_review_preserves_existing_review_and_zero_is_a_valid_review(): void
    {
        $entry = LibraryEntry::factory()->create();
        $review = Review::factory()->for($entry)->create(['body' => 'Existing public review', 'is_public' => true, 'contains_spoilers' => true]);
        $this->actingAs($entry->user);
        $url = route('game-diary.store', $entry->game->slug);
        $this->post($url, $this->data(['review_body' => "\u{2003}\n "]))->assertRedirect();
        $this->assertSame('Existing public review', $review->fresh()->body);
        $this->assertTrue($review->fresh()->is_public);
        $this->assertTrue($review->fresh()->contains_spoilers);
        $this->assertNull($entry->diaryLogs()->sole()->review_body);
        $this->post($url, $this->data(['review_body' => '0']))->assertRedirect();
        $this->assertSame('0', $review->fresh()->body);
        $this->assertSame('0', $entry->diaryLogs()->latest('id')->first()->review_body);
        $this->assertFalse($review->fresh()->is_public);
    }

    public static function invalidLogs(): array
    {
        return [
            'unknown status' => [['status' => 'backlog'], 'status'],
            'missing status' => [['status' => null], 'status'],
            'future log' => [['logged_on' => '2026-11-02'], 'logged_on'],
            'invalid calendar date' => [['logged_on' => '2026-02-30'], 'logged_on'],
            'year zero' => [['logged_on' => '0000-01-01'], 'logged_on'],
            'missing completion' => [['status' => 'completed'], 'completed_on'],
            'completion after log' => [['status' => 'completed', 'logged_on' => '2026-10-30', 'completed_on' => '2026-10-31'], 'completed_on'],
            'future completion' => [['status' => 'completed', 'completed_on' => '2026-11-02'], 'completed_on'],
            'invalid completion' => [['status' => 'completed', 'completed_on' => '2026-02-30'], 'completed_on'],
            'review length' => [['review_body' => str_repeat('x', 10001)], 'review_body'],
            'spoiler type' => [['contains_spoilers' => 'yes'], 'contains_spoilers'],
            'visibility type' => [['is_public' => 'public'], 'is_public'],
            'return type' => [['return_to_diary' => '/players'], 'return_to_diary'],
            'rating zero' => [['stars' => 0], 'stars'],
            'rating over five' => [['stars' => 5.5], 'stars'],
            'rating invalid increment' => [['stars' => 4.2], 'stars'],
            'rating invalid type' => [['stars' => ['bad']], 'stars'],
        ];
    }

    #[DataProvider('invalidLogs')]
    public function test_invalid_logs_do_not_partially_create_or_change_history(array $values, string $field): void
    {
        $user = User::factory()->create();
        $game = Game::factory()->create();
        $this->actingAs($user)->post(route('game-diary.store', $game->slug), $this->data($values))->assertSessionHasErrors($field);
        $this->assertDatabaseCount('library_entries', 0);
        $this->assertDatabaseCount('game_diary_logs', 0);
        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_diary_filters_are_private_literal_and_inclusive_and_sort_by_date_then_id(): void
    {
        $entry = LibraryEntry::factory()->for(Game::factory()->create(['name' => 'World %_! story']))->create();
        $this->log($entry, ['logged_on' => '2026-10-29']);
        $match = $this->log($entry, ['status' => 'completed', 'completed_on' => '2026-10-28', 'review_body' => 'MY SNAPSHOT']);
        $later = $this->log($entry, ['status' => 'completed', 'completed_on' => '2026-10-29']);
        $this->log(LibraryEntry::factory()->create(), ['review_body' => 'FOREIGN SNAPSHOT']);
        $this->log(LibraryEntry::factory()->for($entry->user)->for(Game::factory()->create(['name' => 'World other story']))->create());
        $response = $this->actingAs($entry->user)->get(route('diary.index', [
            'q' => '%_!', 'status' => 'completed', 'from' => '2026-10-30', 'to' => '2026-10-30',
        ]))->assertOk()->assertDontSee('FOREIGN SNAPSHOT')->assertInertia(fn (Assert $page) => $page
            ->component('diary/index')->has('logs.data', 2)->where('logs.meta.total', 2)
            ->where('logs.data.0.id', $later->id)->where('logs.data.1.id', $match->id)
            ->where('logs.data.1.review_body', 'MY SNAPSHOT')->missing('logs.data.0.library_entry_id')
            ->where('filters.q', '%_!')->where('filters.status', 'completed'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertSame('noindex, nofollow', $response->headers->get('X-Robots-Tag'));
    }

    public function test_diary_paginates_twenty_logs_and_keeps_filters(): void
    {
        $entry = LibraryEntry::factory()->create();
        for ($i = 0; $i < 21; $i++) {
            $this->log($entry);
        }
        $this->actingAs($entry->user)->get(route('diary.index', ['status' => 'playing', 'page' => 2]))
            ->assertInertia(fn (Assert $page) => $page->has('logs.data', 1)->where('logs.meta.total', 21)
                ->where('logs.meta.current_page', 2)->where('logs.meta.per_page', 20)
                ->where('logs.links.prev', fn (string $url) => str_contains($url, 'status=playing')));
    }

    public function test_invalid_filters_are_rejected(): void
    {
        $this->actingAs(User::factory()->create())->get(route('diary.index', [
            'status' => 'backlog', 'q' => ['bad'], 'from' => '2026-10-31', 'to' => '2026-10-01', 'page' => 0,
        ]))->assertSessionHasErrors(['status', 'q', 'to', 'page']);
    }

    public function test_deleting_a_log_requires_confirmation_and_ownership_and_preserves_current_game_state(): void
    {
        $entry = LibraryEntry::factory()->create(['status' => 'completed', 'is_favorite' => true]);
        $review = Review::factory()->for($entry)->create();
        $run = Playthrough::factory()->for($entry)->create();
        $session = DiaryEntry::factory()->for($run)->create();
        $log = $this->log($entry);
        $foreign = $this->log(LibraryEntry::factory()->create());
        $this->actingAs($entry->user)->delete(route('game-diary.destroy', $log))->assertSessionHasErrors('confirm');
        $this->delete(route('game-diary.destroy', $foreign), ['confirm' => true])->assertNotFound();
        $this->assertModelExists($foreign);
        $this->delete(route('game-diary.destroy', $log), ['confirm' => true])->assertRedirect(route('diary.index'));
        $this->assertModelMissing($log);
        $this->assertModelExists($review);
        $this->assertModelExists($session);
        $this->assertSame('completed', $entry->fresh()->status->value);
        $this->assertTrue($entry->fresh()->is_favorite);
    }

    public function test_removing_library_entry_cascades_its_diary_logs_only(): void
    {
        $entry = LibraryEntry::factory()->create();
        $own = $this->log($entry);
        $other = $this->log(LibraryEntry::factory()->create());
        $entry->delete();
        $this->assertModelMissing($own);
        $this->assertModelExists($other);
    }
}
