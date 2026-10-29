<?php

namespace Tests\Feature;

use App\Models\DiaryEntry;
use App\Models\Game;
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

class OwnProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_and_editor_are_separate_authenticated_pages_and_empty_views_do_not_create_a_profile(): void
    {
        $this->get(route('players.me'))->assertRedirect(route('login'));
        $this->get(route('players.edit'))->assertRedirect(route('login'));
        $user = User::factory()->create();
        $this->actingAs($user)->get(route('players.me'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('players/me')->has('topGames', 0)->has('activities', 0)->has('reviews.data', 0)
            ->where('player.games_count', 0)->where('player.is_public', false)->missing('player.email')->missing('player.id'));
        $this->get(route('players.edit'))->assertInertia(fn (Assert $page) => $page->component('players/edit')->where('profile', null));
        $this->assertDatabaseCount('user_profiles', 0);
        $this->assertSame('/community/profile', route('players.me', absolute: false));
        $this->assertSame('/community/profile/edit', route('players.edit', absolute: false));
    }

    public function test_private_profile_owners_see_only_their_own_history_and_private_reviews_without_publishing_them(): void
    {
        Http::preventStrayRequests();
        $owner = User::factory()->create();
        $profile = UserProfile::factory()->for($owner)->create(['is_public' => false, 'username' => 'private_owner']);
        $game = Game::factory()->create();
        $profile->topGames()->attach($game, ['position' => 1]);
        $entry = LibraryEntry::factory()->for($owner)->for($game)->create();
        $review = Review::factory()->for($entry)->create(['is_public' => false, 'body' => 'MY PRIVATE THOUGHTS']);
        $otherReview = Review::factory()->create(['body' => 'ANOTHER ACCOUNT SECRET', 'is_public' => false]);
        $before = $entry->fresh()->getRawOriginal();
        $this->actingAs($owner)->get(route('players.me', ['user_id' => $otherReview->libraryEntry->user_id]))->assertOk()
            ->assertDontSee('ANOTHER ACCOUNT SECRET')->assertInertia(fn (Assert $page) => $page
            ->has('activities', 1)->where('activities.0.game.id', $game->id)->has('topGames', 1)
            ->where('reviews.data.0.id', $review->id)->where('reviews.data.0.is_public', false)
            ->where('player.is_public', false)->missing('activities.0.notes')->missing('activities.0.library_entry_id'));
        $this->get('/players/private_owner')->assertNotFound();
        $this->assertFalse($profile->fresh()->is_public);
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
        Http::assertNothingSent();
    }

    public function test_four_distinct_games_are_ordered_by_latest_diary_rating_review_playthrough_or_library_change(): void
    {
        $owner = User::factory()->create();
        $base = now()->startOfDay()->subDays(10);
        $entries = collect(range(0, 5))->map(fn ($index) => LibraryEntry::factory()->for($owner)->create(['created_at' => $base, 'updated_at' => $base]));
        $playthrough = Playthrough::factory()->for($entries[0])->create(['created_at' => $base, 'updated_at' => $base]);
        DiaryEntry::factory()->for($playthrough)->create(['created_at' => $base->copy()->addDays(6), 'updated_at' => $base->copy()->addDays(6), 'notes' => 'DIARY NOTES MUST NOT BE INCLUDED']);
        Rating::factory()->for($entries[0])->create(['created_at' => $base, 'updated_at' => $base->copy()->addDays(7)]);
        Rating::factory()->for($entries[1])->create(['created_at' => $base, 'updated_at' => $base->copy()->addDays(5), 'score' => 9]);
        Review::factory()->for($entries[2])->create(['created_at' => $base, 'updated_at' => $base->copy()->addDays(4)]);
        Playthrough::factory()->for($entries[3])->create(['created_at' => $base, 'updated_at' => $base->copy()->addDays(3)]);
        $entries[4]->forceFill(['updated_at' => $base->copy()->addDays(2)])->save();
        $this->actingAs($owner)->get(route('players.me'))->assertOk()->assertDontSee('DIARY NOTES MUST NOT BE INCLUDED')
            ->assertInertia(fn (Assert $page) => $page->has('activities', 4)
                ->where('activities.0.game.id', $entries[0]->game_id)->where('activities.1.game.id', $entries[1]->game_id)
                ->where('activities.2.game.id', $entries[2]->game_id)->where('activities.3.game.id', $entries[3]->game_id)
                ->where('activities.1.rating', 4.5)->where('activities.2.has_review', true)
                ->where('activities', fn ($activities) => collect($activities)->pluck('game.id')->unique()->count() === 4));
        Rating::where('library_entry_id', $entries[0]->id)->delete();
        $this->get(route('players.me'))->assertInertia(fn (Assert $page) => $page->where('activities.0.game.id', $entries[0]->game_id)
            ->where('activities.0.occurred_at', $base->copy()->addDays(6)->toISOString()));
        $entries[4]->forceFill(['updated_at' => $base->copy()->addDays(8)])->save();
        $this->get(route('players.me'))->assertInertia(fn (Assert $page) => $page
            ->where('activities.0.game.id', $entries[4]->game_id)->where('activities.1.game.id', $entries[0]->game_id));
    }

    public function test_owner_activity_and_private_reviews_do_not_appear_on_the_public_profile(): void
    {
        $owner = User::factory()->create();
        UserProfile::factory()->for($owner)->create(['is_public' => true, 'username' => 'public_owner', 'share_recent_completed' => false]);
        $review = Review::factory()->for(LibraryEntry::factory()->for($owner)->create())->create(['is_public' => false, 'body' => 'OWNER ONLY REVIEW']);
        $this->actingAs($owner)->get(route('players.me'))->assertInertia(fn (Assert $page) => $page->has('activities', 1)->where('reviews.data.0.id', $review->id));
        $this->get('/players/public_owner')->assertDontSee('OWNER ONLY REVIEW')->assertInertia(fn (Assert $page) => $page
            ->has('reviews.data', 0)->has('recentCompleted', 0)->missing('activities'));
    }

    public function test_recent_reviews_have_stable_pagination_and_include_public_and_private_owner_reviews(): void
    {
        $owner = User::factory()->create();
        for ($index = 0; $index < 6; $index++) {
            Review::factory()->for(LibraryEntry::factory()->for($owner)->create())->create(['is_public' => $index % 2 === 0]);
        }
        $this->actingAs($owner)->get(route('players.me'))->assertInertia(fn (Assert $page) => $page->has('reviews.data', 4)
            ->where('reviews.meta.total', 6)->where('reviews.links.next', fn ($url) => str_contains($url, 'reviews_page=2')));
        $this->get(route('players.me', ['reviews_page' => 2]))->assertInertia(fn (Assert $page) => $page->has('reviews.data', 2));
    }
}
