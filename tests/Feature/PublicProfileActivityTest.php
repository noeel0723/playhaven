<?php

namespace Tests\Feature;

use App\Models\GameDiaryLog;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicProfileActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_activity_contains_four_distinct_owned_games_with_current_status_and_safe_fields(): void
    {
        $owner = User::factory()->create();
        UserProfile::factory()->for($owner)->create(['username' => 'active_player', 'is_public' => true]);
        $base = now()->startOfSecond()->subDays(10);
        $entries = collect(['playing', 'paused', 'completed', 'dropped', null])->map(fn ($status, $index) => LibraryEntry::factory()->for($owner)->create([
            'status' => $status, 'created_at' => $base, 'updated_at' => $base->copy()->addDays(5 - $index),
        ]));
        Rating::factory()->for($entries[0])->create(['score' => 9, 'updated_at' => $base->copy()->addDays(5)]);
        Review::factory()->for($entries[1])->create(['is_public' => false, 'body' => 'SECRET PRIVATE REVIEW', 'updated_at' => now()]);
        LibraryEntry::factory()->create(['updated_at' => now()]);
        $url = route('players.show', 'active_player');
        $this->get($url)->assertOk()->assertDontSee('SECRET PRIVATE REVIEW')->assertInertia(fn (Assert $page) => $page
            ->missing('recentCompleted')->has('activities', 4)
            ->where('activities.0.game.id', $entries[0]->game_id)->where('activities.0.status', 'playing')->where('activities.0.rating', 4.5)
            ->where('activities.1.status', 'paused')->where('activities.1.has_review', false)
            ->where('activities.1.occurred_at', $base->copy()->addDays(4)->toISOString())
            ->where('activities.2.status', 'completed')->where('activities.3.status', 'dropped')
            ->missing('activities.0.user_id')->missing('activities.0.library_entry_id')->missing('activities.0.review_body')->missing('activities.0.notes')
            ->where('activities', fn ($activities) => collect($activities)->pluck('game.id')->unique()->count() === 4));
        $owner->profile()->update(['is_public' => false]);
        $this->get($url)->assertNotFound();
    }

    public function test_diary_and_public_review_updates_reorder_activity_without_exposing_snapshot_text(): void
    {
        $owner = User::factory()->create();
        UserProfile::factory()->for($owner)->create(['username' => 'diary_player', 'is_public' => true]);
        $old = now()->subDays(7)->startOfSecond();
        $entry = LibraryEntry::factory()->for($owner)->create(['status' => 'paused', 'updated_at' => $old]);
        $other = LibraryEntry::factory()->for($owner)->create(['status' => 'playing', 'updated_at' => $old->copy()->addDay()]);
        $log = GameDiaryLog::create(['library_entry_id' => $entry->id, 'status' => 'paused', 'logged_on' => today(), 'review_body' => 'PRIVATE DIARY SNAPSHOT', 'contains_spoilers' => true]);
        $url = route('players.show', 'diary_player');
        $this->get($url)->assertDontSee('PRIVATE DIARY SNAPSHOT')->assertInertia(fn (Assert $page) => $page
            ->where('activities.0.game.id', $entry->game_id)->where('activities.0.occurred_at', $log->updated_at->toISOString()));
        $this->travel(1)->minutes();
        Review::factory()->for($other)->create(['is_public' => true]);
        $this->get($url)->assertInertia(fn (Assert $page) => $page
            ->where('activities.0.game.id', $other->game_id)->where('activities.0.has_review', true));
        $this->actingAs($owner)->get(route('players.me'))->assertInertia(fn (Assert $page) => $page->has('activities', 2));
    }
}
