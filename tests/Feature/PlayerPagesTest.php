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
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlayerPagesTest extends TestCase
{
    use RefreshDatabase;

    private function player(string $username, bool $public = true): User
    {
        $user = User::factory()->create();
        UserProfile::factory()->for($user)->create(['username' => $username, 'display_name' => 'Player '.$username, 'is_public' => $public]);

        return $user;
    }

    public function test_public_diary_shows_owned_status_dates_and_rating_without_snapshot_review_text_or_edit_data(): void
    {
        Http::preventStrayRequests();
        $owner = $this->player('diary_owner');
        $entry = LibraryEntry::factory()->for($owner)->create();
        Rating::factory()->for($entry)->create(['score' => 9]);
        Review::factory()->for($entry)->create(['is_public' => false, 'body' => 'PRIVATE CANONICAL REVIEW']);
        $log = GameDiaryLog::create(['library_entry_id' => $entry->id, 'status' => 'completed', 'logged_on' => '2026-10-30', 'completed_on' => '2026-10-29', 'review_body' => 'PRIVATE DIARY SNAPSHOT', 'contains_spoilers' => true]);
        GameDiaryLog::create(['library_entry_id' => LibraryEntry::factory()->create()->id, 'status' => 'playing', 'logged_on' => '2026-10-31', 'review_body' => 'OTHER DIARY TEXT']);
        $this->get('/players/DIARY_OWNER/diary')->assertOk()->assertHeader('Cache-Control', 'no-store, private')
            ->assertDontSee('PRIVATE DIARY SNAPSHOT')->assertDontSee('PRIVATE CANONICAL REVIEW')->assertDontSee('OTHER DIARY TEXT')->assertDontSee($owner->email)
            ->assertInertia(fn (Assert $page) => $page->component('players/diary')->has('logs.data', 1)->where('logs.data.0.id', $log->id)
                ->where('logs.data.0.completed_on', '2026-10-29')->where('logs.data.0.rating', 4.5)->where('logs.data.0.status', 'completed')
                ->where('logs.data.0.has_public_review', false)->missing('logs.data.0.review_body')->missing('logs.data.0.library_entry_id')->missing('logs.data.0.contains_spoilers'));
        $entry->review->update(['is_public' => true]);
        $this->get('/players/diary_owner/diary')->assertDontSee('PRIVATE DIARY SNAPSHOT')->assertInertia(fn (Assert $page) => $page->where('logs.data.0.has_public_review', true));
        Http::assertNothingSent();
    }

    public function test_diary_filtering_and_pagination_stay_scoped_to_the_profile(): void
    {
        $owner = $this->player('diary_owner');
        $entry = LibraryEntry::factory()->for($owner)->for(Game::factory()->create(['name' => '100% Game']))->create();
        for ($i = 0; $i < 21; $i++) {
            GameDiaryLog::create(['library_entry_id' => $entry->id, 'status' => 'completed', 'logged_on' => '2026-10-30', 'completed_on' => '2026-10-29']);
        }
        GameDiaryLog::create(['library_entry_id' => $entry->id, 'status' => 'playing', 'logged_on' => '2025-01-01']);
        $this->get('/players/diary_owner/diary?q=100%25&status=completed&from=2026-10-01&to=2026-10-31')->assertInertia(fn (Assert $page) => $page
            ->has('logs.data', 20)->where('logs.meta.total', 21)->where('logs.links.next', fn ($url) => str_contains($url, 'status=completed') && str_contains($url, 'page=2')));
        $this->get('/players/diary_owner/diary?q=100%25&status=completed&page=2')->assertInertia(fn (Assert $page) => $page->has('logs.data', 1));
        $this->getJson('/players/diary_owner/diary?status=unknown&from=bad')->assertUnprocessable()->assertJsonValidationErrors(['status', 'from']);
    }

    public function test_public_statistics_belong_to_the_profile_not_the_viewer_and_never_include_notes(): void
    {
        $owner = $this->player('stats_owner');
        $entry = LibraryEntry::factory()->for($owner)->create(['status' => 'completed']);
        Rating::factory()->for($entry)->create(['score' => 8]);
        DiaryEntry::factory()->for(Playthrough::factory()->for($entry)->create(['label' => 'PRIVATE PLAYTHROUGH LABEL']))->create(['minutes_played' => 90, 'notes' => 'PRIVATE SESSION NOTES']);
        $viewer = User::factory()->create();
        LibraryEntry::factory()->for($viewer)->count(3)->create();
        foreach ([false, true] as $signedIn) {
            if ($signedIn) {
                $this->actingAs($viewer);
            }
            $this->get('/players/stats_owner/stats?user_id='.$viewer->id)->assertOk()->assertHeader('Cache-Control', 'no-store, private')
                ->assertDontSee('PRIVATE SESSION NOTES')->assertDontSee('PRIVATE PLAYTHROUGH LABEL')->assertDontSee($owner->email)
                ->assertInertia(fn (Assert $page) => $page->component('stats/index')->where('playerPage.owner.username', 'stats_owner')
                    ->where('stats.library.total', 1)->where('stats.diary.minutes', 90)->where('stats.ratings.average', 4)->where('playerPage.isOwnPage', false));
        }
        $this->getJson('/players/stats_owner/stats?year=bad')->assertUnprocessable()->assertJsonValidationErrors('year');
        $this->get('/stats')->assertInertia(fn (Assert $page) => $page->where('stats.library.total', 3)->where('sharedOnProfile', false)->missing('playerPage'));
        $this->actingAs($owner)->get('/stats')->assertInertia(fn (Assert $page) => $page->where('sharedOnProfile', true));
        $owner->profile->update(['is_public' => false]);
        $this->get('/stats')->assertInertia(fn (Assert $page) => $page->where('sharedOnProfile', false));
    }

    public function test_private_profiles_and_visibility_changes_close_all_public_pages_for_every_viewer(): void
    {
        $owner = $this->player('visibility_owner');
        foreach (['diary', 'stats', 'reviews'] as $page) {
            $this->get('/players/visibility_owner/'.$page)->assertOk();
        }
        $owner->profile->update(['is_public' => false]);
        foreach ([null, User::factory()->create(), $owner] as $viewer) {
            if ($viewer) {
                $this->actingAs($viewer);
            }
            foreach (['diary', 'stats', 'reviews'] as $page) {
                $this->get('/players/visibility_owner/'.$page)->assertNotFound();
                $this->get('/players/missing_owner/'.$page)->assertNotFound();
            }
        }
    }

    public function test_profile_always_shows_four_latest_reviews_and_public_reviews_are_paginated_by_eight(): void
    {
        $owner = $this->player('review_owner');
        $reviews = collect();
        for ($i = 0; $i < 13; $i++) {
            $reviews->push(Review::factory()->for(LibraryEntry::factory()->for($owner)->create())->create(['updated_at' => '2026-10-30 12:00:00', 'is_public' => true]));
        }
        $private = Review::factory()->for(LibraryEntry::factory()->for($owner)->create())->create(['is_public' => false, 'body' => 'PRIVATE OWNER REVIEW', 'updated_at' => '2026-10-31 12:00:00']);
        foreach (['', '?reviews_page=2', '?lists_page=2'] as $query) {
            $this->get('/players/review_owner'.$query)->assertInertia(fn (Assert $page) => $page->has('reviews.data', 4)->where('reviews.meta.total', 13)
                ->where('reviews.data.0.id', $reviews->last()->id)->missing('reviews.links'));
        }
        $this->get('/players/review_owner/reviews')->assertDontSee('PRIVATE OWNER REVIEW')->assertInertia(fn (Assert $page) => $page
            ->component('players/reviews')->has('reviews.data', 8)->where('reviews.meta.total', 13)->where('reviews.meta.per_page', 8)->where('reviews.data.0.id', $reviews->last()->id));
        $this->get('/players/review_owner/reviews?page=2')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 5)->where('reviews.data.0.id', $reviews[4]->id));
        $this->actingAs($owner)->get('/community/profile?reviews_page=2')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 4)->where('reviews.data.0.id', $private->id)->where('reviews.meta.total', 14));
        $this->get('/community/profile/reviews')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 8)->where('reviews.meta.total', 14)->where('reviews.data.0.is_public', false));
        $this->get('/players/review_owner/reviews')->assertDontSee('PRIVATE OWNER REVIEW')->assertInertia(fn (Assert $page) => $page->where('reviews.meta.total', 13));
    }

    public function test_own_reviews_work_without_a_profile_and_search_does_not_match_private_or_unrelated_reviews(): void
    {
        $this->get('/community/profile/reviews')->assertRedirect('/login');
        $owner = $this->player('search_owner');
        $public = Review::factory()->for(LibraryEntry::factory()->for($owner)->for(Game::factory()->create(['name' => '100%_Game']))->create())->create(['is_public' => true]);
        Review::factory()->for(LibraryEntry::factory()->for($owner)->for(Game::factory()->create(['name' => 'Hidden Game']))->create())->create(['is_public' => false]);
        $this->get('/players/search_owner/reviews?q=%25_')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 1)->where('reviews.data.0.id', $public->id));
        $this->get('/players/search_owner/reviews?q=Hidden')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 0));
        $this->actingAs(User::factory()->create())->get('/community/profile/reviews')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('playerPage.owner.username', null)->where('playerPage.isOwnPage', true)->has('reviews.data', 0));
        $this->getJson('/players/search_owner/reviews?q[]=bad&page=0')->assertUnprocessable()->assertJsonValidationErrors(['q', 'page']);
    }
}
