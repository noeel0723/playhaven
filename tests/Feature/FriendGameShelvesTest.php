<?php

namespace Tests\Feature;

use App\Models\Follow;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FriendGameShelvesTest extends TestCase
{
    use RefreshDatabase;

    private function player(string $username, bool $public = true): User
    {
        $user = User::factory()->create(['name' => 'ACCOUNT NAME MUST NOT LEAK '.$username]);
        UserProfile::factory()->for($user)->create(['username' => $username, 'display_name' => 'Alias '.$username, 'is_public' => $public]);

        return $user;
    }

    private function follow(User $viewer, User $friend): void
    {
        Follow::create(['follower_id' => $viewer->id, 'followed_id' => $friend->id]);
    }

    public function test_only_followed_public_players_share_eligible_statuses_and_popularity_counts_distinct_friends(): void
    {
        $viewer = User::factory()->create();
        $first = $this->player('first_friend');
        $second = $this->player('second_friend');
        $hidden = $this->player('hidden_friend', false);
        foreach ([$first, $second, $hidden] as $friend) {
            $this->follow($viewer, $friend);
        }
        $shared = Game::factory()->create(['name' => 'Shared world']);
        $entry = LibraryEntry::factory()->for($first)->for($shared)->create(['status' => 'playing']);
        Review::factory()->for($entry)->create(['is_public' => false, 'body' => 'PRIVATE REVIEW BODY']);
        LibraryEntry::factory()->for($second)->for($shared)->create(['status' => 'completed']);
        LibraryEntry::factory()->for($hidden)->for($shared)->create(['status' => 'playing']);
        LibraryEntry::factory()->for($viewer)->for($shared)->create(['status' => 'playing']);
        LibraryEntry::factory()->for($this->player('not_followed'))->for($shared)->create(['status' => 'playing']);
        $paused = LibraryEntry::factory()->for($first)->create(['status' => 'paused']);
        LibraryEntry::factory()->for($first)->create(['status' => 'dropped']);
        LibraryEntry::factory()->for($first)->create(['status' => null, 'is_favorite' => true]);
        $this->actingAs($viewer)->get('/community')->assertHeader('Cache-Control', 'no-store, private')
            ->assertDontSee('PRIVATE REVIEW BODY')->assertDontSee('ACCOUNT NAME MUST NOT LEAK first_friend')
            ->assertInertia(fn (Assert $page) => $page->has('friendShelves.recent', 3)->has('friendShelves.popular', 2)
                ->where('friendShelves.recent.0.player.username', 'first_friend')->where('friendShelves.recent.0.game.id', $paused->game_id)
                ->where('friendShelves.popular.0.game.id', $shared->id)->where('friendShelves.popular.0.friends_count', 2)
                ->missing('friendShelves.recent.0.user_id')->missing('friendShelves.recent.0.library_entry_id')
                ->missing('friendShelves.recent.0.is_favorite')->missing('friendShelves.recent.0.review')->missing('friendShelves.recent.0.player.email'));
        $otherViewer = User::factory()->create();
        $this->follow($otherViewer, $second);
        $this->actingAs($otherViewer)->get('/community')->assertInertia(fn (Assert $page) => $page
            ->has('friendShelves.recent', 1)->where('friendShelves.recent.0.player.username', 'second_friend')->where('friendShelves.popular.0.friends_count', 1));
    }

    public function test_status_dates_only_change_with_status_and_cannot_be_spoofed_by_requests(): void
    {
        $this->travelTo(now()->startOfSecond());
        $friend = $this->player('status_friend');
        $game = Game::factory()->create();
        $this->actingAs($friend)->put(route('library.save', $game->slug), ['status' => 'playing', 'is_favorite' => false, 'status_changed_at' => '2099-01-01'])->assertSessionHasNoErrors();
        $entry = $friend->libraryEntries()->sole();
        $firstDate = $entry->status_changed_at->toISOString();
        $this->assertTrue($entry->status_changed_at->equalTo(now()));
        $this->travel(1)->hours();
        $this->put(route('library.save', $game->slug), ['status' => 'playing', 'is_favorite' => true])->assertSessionHasNoErrors();
        $this->put(route('ratings.update', $game->slug), ['stars' => 4.5])->assertSessionHasNoErrors();
        $this->put(route('reviews.update', $game->slug), ['body' => 'Private review update', 'is_public' => false, 'contains_spoilers' => false])->assertSessionHasNoErrors();
        $this->assertSame($firstDate, $entry->fresh()->status_changed_at->toISOString());
        $this->put(route('library.save', $game->slug), ['status' => 'paused', 'is_favorite' => true])->assertSessionHasNoErrors();
        $this->assertTrue($entry->fresh()->status_changed_at->equalTo(now()));
        $this->put(route('library.save', $game->slug), ['status' => null, 'is_favorite' => true])->assertSessionHasNoErrors();
        $this->assertNull($entry->fresh()->status_changed_at);
    }

    public function test_known_completion_dates_are_used_but_other_legacy_dates_are_not_invented_or_taken_from_private_edits(): void
    {
        $viewer = User::factory()->create();
        $friend = $this->player('legacy_friend');
        $this->follow($viewer, $friend);
        $unknown = LibraryEntry::factory()->for($friend)->create(['status' => 'playing']);
        $completed = LibraryEntry::factory()->for($friend)->create(['status' => 'completed', 'completed_at' => now()->subDays(2)]);
        DB::table('library_entries')->whereIn('id', [$unknown->id, $completed->id])->update(['status_changed_at' => null]);
        $this->actingAs($viewer)->get('/community')->assertInertia(fn (Assert $page) => $page
            ->where('friendShelves.recent.0.game.id', $completed->game_id)->where('friendShelves.recent.0.changed_at', $completed->completed_at->toISOString())
            ->where('friendShelves.recent.1.game.id', $unknown->game_id)->where('friendShelves.recent.1.changed_at', null));
        $this->assertNull($unknown->fresh()->status_changed_at);
        $friend->profile->update(['is_public' => false]);
        $this->get('/community')->assertInertia(fn (Assert $page) => $page->has('friendShelves.recent', 0)->has('friendShelves.popular', 0));
        $friend->profile->update(['is_public' => true]);
        Follow::query()->where('follower_id', $viewer->id)->delete();
        $this->get('/community')->assertInertia(fn (Assert $page) => $page->has('friendShelves.recent', 0)->has('friendShelves.popular', 0));
    }

    public function test_shelves_are_bounded_guest_safe_and_only_loaded_on_the_first_review_page(): void
    {
        $viewer = User::factory()->create();
        $friend = $this->player('many_games');
        $this->follow($viewer, $friend);
        for ($index = 0; $index < 14; $index++) {
            LibraryEntry::factory()->for($friend)->create(['status' => 'playing']);
        }
        $this->get('/community')->assertInertia(fn (Assert $page) => $page->where('friendShelves', null));
        $this->actingAs($viewer)->get('/community')->assertInertia(fn (Assert $page) => $page->has('friendShelves.recent', 12)->has('friendShelves.popular', 12));
        $this->get('/community?page=2')->assertInertia(fn (Assert $page) => $page->where('friendShelves', null));
        $this->get('/community?feed=following')->assertInertia(fn (Assert $page) => $page->has('friendShelves.recent', 12));
    }
}
