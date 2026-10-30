<?php

namespace Tests\Feature;

use App\Models\DiaryEntry;
use App\Models\Game;
use App\Models\Genre;
use App\Models\LibraryEntry;
use App\Models\Platform;
use App\Models\Playthrough;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StatisticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-10-29T12:00:00Z'));
        Http::preventStrayRequests();
    }

    public function test_statistics_are_authenticated_private_and_empty_without_fabricated_values(): void
    {
        $this->get('/stats')->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->get('/stats')->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow')->assertHeader('Cache-Control', 'no-store, private')
            ->assertInertia(fn (Assert $page) => $page->component('stats/index')
                ->where('stats.library.total', 0)->where('stats.library.completed_percent', 0)
                ->where('stats.ratings.average', null)->where('stats.ratings.total', 0)
                ->has('stats.ratings.distribution', 10)->where('stats.ratings.distribution.0.stars', 0.5)->where('stats.ratings.distribution.9.stars', 5)
                ->where('stats.diary.sessions', 0)->where('stats.diary.minutes', 0)->where('stats.diary.active_days', 0)
                ->has('stats.activity.months', 12)->where('stats.activity.year', now()->year)->where('stats.activity.months.0.minutes', 0)
                ->has('stats.most_played', 0)->has('stats.genres', 0)->has('stats.platforms', 0)->where('stats.playthroughs', 0));
        Http::assertNothingSent();
    }

    public function test_library_and_rating_aggregates_are_current_owned_and_not_multiplied_by_replays(): void
    {
        $owner = User::factory()->create();
        foreach (['playing', 'completed', 'paused', 'dropped', null] as $status) {
            LibraryEntry::factory()->for($owner)->create(['status' => $status, 'is_favorite' => $status === 'completed']);
        }
        $entries = $owner->libraryEntries()->orderBy('id')->get();
        Rating::factory()->for($entries[0])->create(['score' => 1]);
        Rating::factory()->for($entries[1])->create(['score' => 8]);
        Rating::factory()->for($entries[2])->create(['score' => 10]);
        Playthrough::factory()->for($entries[1])->count(3)->create();
        $other = LibraryEntry::factory()->create(['status' => 'completed']);
        Rating::factory()->for($other)->create(['score' => 10]);

        $this->actingAs($owner)->get('/stats?user_id='.$other->user_id)->assertInertia(fn (Assert $page) => $page
            ->where('stats.library.total', 5)->where('stats.library.statuses.completed', 1)->missing('stats.library.statuses.backlog')
            ->where('stats.library.favorites', 1)->where('stats.library.completed_percent', 20)
            ->where('stats.ratings.total', 3)->where('stats.ratings.average', 3.2)
            ->where('stats.ratings.distribution.0.count', 1)->where('stats.ratings.distribution.7.count', 1)->where('stats.ratings.distribution.9.count', 1)
            ->where('stats.playthroughs', 3));
    }

    public function test_diary_aggregates_distinguish_unknown_and_zero_durations_and_distinct_days(): void
    {
        $owner = User::factory()->create();
        $entry = LibraryEntry::factory()->for($owner)->create();
        $first = Playthrough::factory()->for($entry)->create();
        $replay = Playthrough::factory()->for($entry)->create();
        $firstSession = DiaryEntry::factory()->for($first)->create(['logged_on' => '2025-03-01', 'minutes_played' => 90]);
        DB::table('diary_entries')->where('id', $firstSession->id)->update(['logged_on' => '2025-03-01']);
        DiaryEntry::factory()->for($replay)->create(['logged_on' => '2025-03-01', 'minutes_played' => 30]);
        DiaryEntry::factory()->for($replay)->create(['logged_on' => '2025-03-02', 'minutes_played' => null]);
        DiaryEntry::factory()->for($replay)->create(['logged_on' => '2025-03-02', 'minutes_played' => 0]);
        DiaryEntry::factory()->create(['logged_on' => '2025-03-01', 'minutes_played' => 9999]);
        $this->actingAs($owner)->get('/stats?year=2025')->assertInertia(fn (Assert $page) => $page
            ->where('stats.diary.sessions', 4)->where('stats.diary.timed_sessions', 3)->where('stats.diary.minutes', 120)->where('stats.diary.active_days', 2)
            ->where('stats.activity.sessions', 4)->where('stats.activity.timed_sessions', 3)->where('stats.activity.active_days', 2)
            ->where('stats.activity.months.2.sessions', 4)->where('stats.activity.months.2.minutes', 120)->where('stats.activity.months.2.active_days', 2)
            ->has('stats.most_played', 1)->where('stats.most_played.0.id', $entry->game_id)->where('stats.most_played.0.minutes', 120)->where('stats.most_played.0.sessions', 4));
    }

    public function test_annual_filter_changes_only_diary_activity_and_uses_calendar_date_boundaries(): void
    {
        $owner = User::factory()->create();
        $entry = LibraryEntry::factory()->for($owner)->create(['status' => 'completed']);
        Rating::factory()->for($entry)->create(['score' => 9]);
        $run = Playthrough::factory()->for($entry)->create();
        foreach ([['2024-12-31', 10], ['2025-01-01', 20], ['2025-12-31', 40], ['2026-01-01', 80]] as [$date, $minutes]) {
            DiaryEntry::factory()->for($run)->create(['logged_on' => $date, 'minutes_played' => $minutes]);
        }
        $this->actingAs($owner)->get('/stats?year=2025')->assertInertia(fn (Assert $page) => $page
            ->where('stats.activity.year', 2025)->where('stats.activity.sessions', 2)->where('stats.activity.minutes', 60)
            ->where('stats.activity.months.0.minutes', 20)->where('stats.activity.months.11.minutes', 40)
            ->where('stats.diary.minutes', 150)->where('stats.library.total', 1)->where('stats.ratings.average', 4.5)
            ->where('stats.activity.available_years', [2026, 2025, 2024]));
        $this->get('/stats?year=2024')->assertInertia(fn (Assert $page) => $page
            ->where('stats.activity.minutes', 10)->where('stats.diary.minutes', 150)->where('stats.ratings.average', 4.5));
    }

    public function test_every_month_and_half_star_bucket_remains_present_when_empty(): void
    {
        $owner = User::factory()->create();
        $entry = LibraryEntry::factory()->for($owner)->create();
        Rating::factory()->for($entry)->create(['score' => 3]);
        DiaryEntry::factory()->for(Playthrough::factory()->for($entry)->create())->create(['logged_on' => '2024-02-29', 'minutes_played' => 45]);
        $this->actingAs($owner)->get('/stats?year=2024')->assertInertia(fn (Assert $page) => $page
            ->has('stats.activity.months', 12)->where('stats.activity.months.1.minutes', 45)->where('stats.activity.months.0.minutes', 0)
            ->has('stats.ratings.distribution', 10)->where('stats.ratings.distribution.2.count', 1)->where('stats.ratings.distribution.1.count', 0));
        $this->get('/stats?year=2023')->assertInertia(fn (Assert $page) => $page
            ->where('stats.activity.minutes', 0)->where('stats.activity.sessions', 0)->where('stats.activity.available_years', [now()->year, 2024, 2023]));
    }

    public function test_genres_count_each_played_game_once_excluding_backlog_and_other_players(): void
    {
        $owner = User::factory()->create();
        $adventure = Genre::factory()->create(['name' => 'Adventure']);
        $rpg = Genre::factory()->create(['name' => 'Role-playing']);
        $played = Game::factory()->create();
        $played->genres()->attach([$adventure->id, $rpg->id]);
        $entry = LibraryEntry::factory()->for($owner)->for($played)->create(['status' => 'completed']);
        Playthrough::factory()->for($entry)->count(3)->create();
        $second = LibraryEntry::factory()->for($owner)->create(['status' => 'paused']);
        $second->game->genres()->attach($adventure);
        $backlog = LibraryEntry::factory()->for($owner)->create(['status' => null]);
        $backlog->game->genres()->attach($rpg);
        $other = LibraryEntry::factory()->create(['status' => 'completed']);
        $other->game->genres()->attach($rpg);
        $this->actingAs($owner)->get('/stats')->assertInertia(fn (Assert $page) => $page->has('stats.genres', 2)
            ->where('stats.genres.0.name', 'Adventure')->where('stats.genres.0.games', 2)
            ->where('stats.genres.1.name', 'Role-playing')->where('stats.genres.1.games', 1));
    }

    public function test_platforms_use_actual_playthrough_choices_rather_than_supported_game_platforms(): void
    {
        $owner = User::factory()->create();
        $pc = Platform::factory()->create(['name' => 'PC']);
        $console = Platform::factory()->create(['name' => 'Console']);
        $entry = LibraryEntry::factory()->for($owner)->create();
        $entry->game->platforms()->attach([$pc->id, $console->id]);
        Playthrough::factory()->for($entry)->count(2)->create(['platform_id' => $pc->id]);
        Playthrough::factory()->for($entry)->create(['platform_id' => null]);
        $other = LibraryEntry::factory()->create();
        Playthrough::factory()->for($other)->create(['platform_id' => $console->id]);
        $this->actingAs($owner)->get('/stats')->assertInertia(fn (Assert $page) => $page
            ->has('stats.platforms', 1)->where('stats.platforms.0.name', 'PC')->where('stats.platforms.0.playthroughs', 2)->where('stats.platforms.0.games', 1)
            ->where('stats.unspecified_platform_runs', 1)->where('stats.playthroughs', 3));
    }

    public function test_zero_and_unknown_duration_games_are_not_invented_in_most_played_rankings(): void
    {
        $owner = User::factory()->create();
        foreach ([null, 0] as $duration) {
            $run = Playthrough::factory()->for(LibraryEntry::factory()->for($owner)->create())->create();
            DiaryEntry::factory()->for($run)->create(['minutes_played' => $duration]);
        }
        $this->actingAs($owner)->get('/stats')->assertInertia(fn (Assert $page) => $page
            ->where('stats.diary.sessions', 2)->where('stats.diary.timed_sessions', 1)->where('stats.diary.minutes', 0)->has('stats.most_played', 0));
    }

    public function test_stats_do_not_expose_notes_review_texts_or_other_players_records(): void
    {
        $owner = User::factory()->create();
        $entry = LibraryEntry::factory()->for($owner)->create();
        Review::factory()->for($entry)->create(['body' => 'PRIVATE REVIEW TEXT', 'is_public' => false]);
        $run = Playthrough::factory()->for($entry)->create(['label' => 'PRIVATE RUN LABEL']);
        DiaryEntry::factory()->for($run)->create(['minutes_played' => 50, 'notes' => 'PRIVATE DIARY TEXT']);
        $otherEntry = LibraryEntry::factory()->create();
        $otherEntry->game->update(['name' => 'OTHER PRIVATE GAME']);
        DiaryEntry::factory()->for(Playthrough::factory()->for($otherEntry)->create())->create(['minutes_played' => 9000]);
        $this->actingAs($owner)->get('/stats')->assertOk()->assertDontSee('PRIVATE REVIEW TEXT')->assertDontSee('PRIVATE DIARY TEXT')->assertDontSee('PRIVATE RUN LABEL')->assertDontSee('OTHER PRIVATE GAME')
            ->assertInertia(fn (Assert $page) => $page->where('stats.diary.minutes', 50)->missing('stats.user_id')->missing('stats.diary.notes'));
        Http::assertNothingSent();
    }

    public function test_query_shapes_and_future_years_are_rejected_without_accepting_another_users_id(): void
    {
        $this->actingAs(User::factory()->create());
        foreach (['year[]=2025', 'year=0', 'year=bad', 'year=1.5', 'year='.(now()->year + 1)] as $query) {
            $this->getJson('/stats?'.$query)->assertUnprocessable()->assertJsonValidationErrors('year');
        }
        $this->get('/stats?year=1')->assertOk()->assertInertia(fn (Assert $page) => $page->where('stats.activity.year', 1)->has('stats.activity.months', 12));
    }

    public function test_unverified_accounts_cannot_read_statistics_outside_local_bypass(): void
    {
        config(['auth.require_email_verification' => false]);
        $this->actingAs(User::factory()->unverified()->create())->get('/stats')->assertRedirect(route('verification.notice'));
    }

    public function test_ranking_is_bounded_and_changes_reflect_current_record_edits_without_stale_cache(): void
    {
        $owner = User::factory()->create();
        $sessions = [];
        foreach (range(1, 6) as $minutes) {
            $entry = LibraryEntry::factory()->for($owner)->create();
            $sessions[] = DiaryEntry::factory()->for(Playthrough::factory()->for($entry)->create())->create(['minutes_played' => $minutes]);
        }
        $this->actingAs($owner)->get('/stats')->assertInertia(fn (Assert $page) => $page->has('stats.most_played', 5)->where('stats.diary.minutes', 21));
        $sessions[5]->delete();
        $this->get('/stats')->assertInertia(fn (Assert $page) => $page->where('stats.diary.minutes', 15)->where('stats.diary.sessions', 5));
    }
}
