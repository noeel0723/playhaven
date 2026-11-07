<?php

namespace Tests\Feature;

use App\Models\Developer;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-11-01 12:00:00', 'UTC'));
        Http::preventStrayRequests();
    }

    private function publicPlayer(): User
    {
        $user = User::factory()->create();
        UserProfile::factory()->for($user)->create(['is_public' => true]);

        return $user;
    }

    private function entry(Game $game, User $user, CarbonImmutable $when): LibraryEntry
    {
        $entry = LibraryEntry::factory()->for($game)->for($user)->create();
        DB::table('library_entries')->where('id', $entry->id)->update(['created_at' => $when, 'updated_at' => $when, 'status_changed_at' => null]);

        return $entry;
    }

    public function test_home_is_public_with_an_empty_catalog_and_never_calls_a_provider(): void
    {
        config(['services.rawg.api_key' => 'home-secret-never-render']);
        $this->get(route('home'))->assertOk()->assertDontSee('home-secret-never-render')->assertInertia(fn (Assert $page) => $page
            ->component('welcome')->has('featuredGames', 0)->where('featuredWorld', null)->where('catalogCount', 0)
            ->where('popularity.has_weekly_activity', false));
        Http::assertNothingSent();
    }

    public function test_weekly_unique_players_determine_six_games_and_the_same_top_games_banner(): void
    {
        $old = Game::factory()->create(['slug' => 'red-dead-redemption-2']);
        LibraryEntry::factory()->for($old)->count(8)->create();
        $top = Game::factory()->create(['name' => 'Weekly winner', 'rawg_id' => 501, 'banner_url' => 'https://media.rawg.io/media/screenshots/winner.jpg', 'cover_url' => 'https://media.rawg.io/media/games/winner.jpg']);
        $developer = Developer::create(['rawg_id' => 501, 'name' => 'Winner Studio', 'slug' => 'winner-studio']);
        $top->developers()->attach($developer);
        $first = $this->entry($top, $this->publicPlayer(), CarbonImmutable::now());
        Rating::factory()->for($first)->create(['score' => 9]);
        Review::factory()->for($first)->create(['is_public' => true]);
        $this->entry($top, $this->publicPlayer(), CarbonImmutable::now());
        $second = Game::factory()->create();
        $this->entry($second, $this->publicPlayer(), CarbonImmutable::now());
        Game::factory()->count(6)->create();
        $this->get(route('home'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('catalogCount', 9)->has('featuredGames', 6)
            ->where('featuredGames.0.id', $top->id)->where('featuredGames.0.weekly_players_count', 2)
            ->where('featuredGames.1.id', $second->id)->where('featuredGames.1.weekly_players_count', 1)
            ->where('featuredWorld.name', 'Weekly winner')->where('featuredWorld.slug', $top->slug)
            ->where('featuredWorld.banner_url', 'https://media.rawg.io/media/screenshots/winner.jpg')
            ->where('featuredWorld.cover_url', 'https://media.rawg.io/media/games/winner.jpg')
            ->where('featuredWorld.developers', ['Winner Studio'])->where('popularity.has_weekly_activity', true)
            ->where('featuredGames', fn ($games) => collect($games)->pluck('id')->unique()->count() === 6));
        Http::assertNothingSent();
    }

    public function test_card_previews_include_developers_and_community_ratings_but_count_only_public_reviews(): void
    {
        $game = Game::factory()->create();
        $developer = Developer::create(['rawg_id' => 502, 'name' => 'Preview Studio', 'slug' => 'preview-studio']);
        $game->developers()->attach($developer);
        $first = LibraryEntry::factory()->for($game)->create();
        $second = LibraryEntry::factory()->for($game)->create();
        Rating::factory()->for($first)->create(['score' => 8]);
        Rating::factory()->for($second)->create(['score' => 10]);
        Review::factory()->for($first)->create(['is_public' => true, 'body' => 'PUBLIC PREVIEW BODY']);
        Review::factory()->for($second)->create(['is_public' => false, 'body' => 'PRIVATE PREVIEW BODY']);

        foreach (['/' => 'featuredGames', '/games' => 'games.data'] as $url => $key) {
            $this->get($url)->assertOk()->assertDontSee('PRIVATE PREVIEW BODY')->assertDontSee('PUBLIC PREVIEW BODY')
                ->assertInertia(fn (Assert $page) => $page
                    ->where($key.'.0.rating', 4.5)->where($key.'.0.ratings_count', 2)
                    ->where($key.'.0.public_reviews_count', 1)->where($key.'.0.developers.0.name', 'Preview Studio')
                    ->missing($key.'.0.reviews')->missing($key.'.0.library_entries'));
        }
        $unrated = Game::factory()->create();
        $this->get('/games?q='.urlencode($unrated->name))->assertInertia(fn (Assert $page) => $page
            ->where('games.data.0.rating', null)->where('games.data.0.ratings_count', 0)
            ->where('games.data.0.public_reviews_count', 0)->has('games.data.0.developers', 0));
        Http::assertNothingSent();
    }

    public function test_new_additions_status_changes_ratings_and_public_reviews_count_but_private_notes_and_metadata_do_not(): void
    {
        $user = $this->publicPlayer();
        $games = Game::factory()->count(6)->create();
        $past = CarbonImmutable::now()->subDays(30);
        foreach ($games as $position => $game) {
            $entry = $this->entry($game, $user, $past);
            match ($position) {
                0 => DB::table('library_entries')->where('id', $entry->id)->update(['created_at' => now()]),
                1 => DB::table('library_entries')->where('id', $entry->id)->update(['status' => 'playing', 'status_changed_at' => now()]),
                2 => Rating::factory()->for($entry)->create(['updated_at' => now()]),
                3 => Review::factory()->for($entry)->create(['is_public' => true, 'updated_at' => now()]),
                4 => Review::factory()->for($entry)->create(['is_public' => false, 'body' => 'PRIVATE WEEKLY REVIEW', 'updated_at' => now()]),
                5 => DB::table('library_entries')->where('id', $entry->id)->update(['updated_at' => now()]),
            };
        }
        $response = $this->get('/')->assertOk()->assertDontSee('PRIVATE WEEKLY REVIEW');
        $counts = collect($response->viewData('page')['props']['featuredGames'])->pluck('weekly_players_count', 'id');
        foreach ($games as $position => $game) {
            $this->assertSame($position < 4 ? 1 : 0, $counts[$game->id]);
        }
    }

    public function test_private_and_unnamed_profiles_do_not_contribute_to_weekly_activity(): void
    {
        $game = Game::factory()->create();
        $this->entry($game, User::factory()->create(), CarbonImmutable::now());
        $private = User::factory()->create();
        UserProfile::factory()->for($private)->create(['is_public' => false]);
        $entry = $this->entry($game, $private, CarbonImmutable::now());
        Review::factory()->for($entry)->create(['is_public' => true, 'body' => 'PRIVATE PROFILE AUTHOR']);
        $unnamed = User::factory()->create();
        UserProfile::factory()->for($unnamed)->create(['is_public' => true, 'username' => null]);
        $this->entry($game, $unnamed, CarbonImmutable::now());
        $this->get('/')->assertDontSee($private->email)->assertDontSee('PRIVATE PROFILE AUTHOR')->assertInertia(fn (Assert $page) => $page
            ->where('featuredGames.0.weekly_players_count', 0)->where('popularity.has_weekly_activity', false)
            ->missing('featuredGames.0.rawg_id')->missing('featuredGames.0.library_entries')->missing('featuredWorld.user_id'));
    }

    public function test_seven_day_window_is_inclusive_excludes_future_activity_and_automatically_rolls_forward(): void
    {
        $game = Game::factory()->create();
        $now = CarbonImmutable::now();
        foreach ([$now->subDays(7), $now->subDays(7)->subSecond(), $now, $now->addSecond()] as $time) {
            $this->entry($game, $this->publicPlayer(), $time);
        }
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('featuredGames.0.weekly_players_count', 2)
            ->where('popularity.from', $now->subDays(7)->toISOString())->where('popularity.to', $now->toISOString()));
        $this->travelTo($now->addSeconds(2));
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('featuredGames.0.weekly_players_count', 2));
        $this->travelTo($now->addDays(8));
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('featuredGames.0.weekly_players_count', 0)->where('popularity.has_weekly_activity', false));
    }

    public function test_weekly_leader_and_hero_switch_as_older_players_leave_the_window(): void
    {
        $oldLeader = Game::factory()->create(['name' => 'Old leader', 'rawg_id' => 101, 'banner_url' => 'https://media.rawg.io/media/screenshots/old.jpg']);
        $newLeader = Game::factory()->create(['name' => 'New leader', 'rawg_id' => 102, 'banner_url' => 'https://media.rawg.io/media/screenshots/new.jpg']);
        $now = CarbonImmutable::now();
        for ($i = 0; $i < 3; $i++) {
            $this->entry($oldLeader, $this->publicPlayer(), $now->subDays(7)->addMinute());
        }
        for ($i = 0; $i < 2; $i++) {
            $this->entry($newLeader, $this->publicPlayer(), $now);
        }
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('featuredWorld.slug', $oldLeader->slug)->where('featuredGames.0.id', $oldLeader->id));
        $this->travelTo($now->addMinutes(2));
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('featuredWorld.slug', $newLeader->slug)->where('featuredGames.0.id', $newLeader->id)
            ->where('featuredWorld.banner_url', 'https://media.rawg.io/media/screenshots/new.jpg'));
    }

    public function test_zero_activity_uses_overall_popularity_with_explicit_fallback_and_stable_ties(): void
    {
        Game::factory()->create(['slug' => 'red-dead-redemption-2']);
        $popular = Game::factory()->create();
        LibraryEntry::factory()->for($popular)->count(3)->create();
        $tieFirst = Game::factory()->create();
        $tieSecond = Game::factory()->create();
        LibraryEntry::factory()->for($tieFirst)->count(2)->create();
        LibraryEntry::factory()->for($tieSecond)->count(2)->create();
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('featuredGames.0.id', $popular->id)
            ->where('featuredGames.1.id', $tieFirst->id)->where('featuredGames.2.id', $tieSecond->id)
            ->where('featuredWorld.slug', $popular->slug)->where('popularity.has_weekly_activity', false));
    }

    public function test_hero_urls_are_validated_and_missing_artwork_never_uses_an_unrelated_fixed_game(): void
    {
        $game = Game::factory()->create(['rawg_id' => 28, 'banner_url' => 'https://untrusted.example/banner.jpg', 'cover_url' => 'https://untrusted.example/cover.jpg']);
        $entry = LibraryEntry::factory()->for($game)->create();
        Review::factory()->for($entry)->create(['body' => 'PRIVATE HOME REVIEW BODY', 'is_public' => false]);
        $this->get('/')->assertOk()->assertDontSee('untrusted.example')->assertDontSee('PRIVATE HOME REVIEW BODY')->assertInertia(fn (Assert $page) => $page
            ->where('featuredWorld.banner_url', null)->where('featuredWorld.cover_url', null)
            ->where('featuredGames.0.cover_url', null)->missing('featuredWorld.rawg_id')->missing('featuredGames.0.summary'));
    }

    public function test_signed_in_users_get_the_same_chart_without_changing_library_data(): void
    {
        $user = User::factory()->create();
        $entry = $this->entry(Game::factory()->create(), $this->publicPlayer(), CarbonImmutable::now());
        $before = $entry->fresh()->getRawOriginal();
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('featuredWorld.slug', $entry->game->slug)->where('featuredGames.0.weekly_players_count', 1));
        $this->actingAs($user)->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.id', $user->id)->where('featuredGames.0.id', $entry->game_id)->where('featuredGames.0.weekly_players_count', 1));
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
        Http::assertNothingSent();
    }
}
