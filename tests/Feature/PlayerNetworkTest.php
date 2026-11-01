<?php

namespace Tests\Feature;

use App\Enums\ListVisibility;
use App\Models\Follow;
use App\Models\GameList;
use App\Models\LibraryEntry;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlayerNetworkTest extends TestCase
{
    use RefreshDatabase;

    private function player(string $username, bool $public = true): User
    {
        $user = User::factory()->create();
        UserProfile::factory()->for($user)->create(['username' => $username, 'display_name' => $username, 'is_public' => $public]);

        return $user;
    }

    private function follow(User $from, User $to, string $when = '2026-10-31 12:00:00'): void
    {
        Follow::factory()->create(['follower_id' => $from->id, 'followed_id' => $to->id, 'created_at' => $when]);
    }

    public function test_direction_and_viewer_follow_state_are_correct_and_self_is_identified(): void
    {
        $owner = $this->player('network_owner');
        $follower = $this->player('follower_player');
        $following = $this->player('following_player');
        $this->follow($follower, $owner);
        $this->follow($owner, $following);
        $this->follow($following, $follower);
        $this->actingAs($following)->get('/players/NETWORK_OWNER/followers')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('players/network')->where('direction', 'followers')->where('owner.username', 'network_owner')
            ->has('players.data', 1)->where('players.data.0.username', 'follower_player')
            ->where('players.data.0.is_following', true)->where('players.data.0.following_count', 1)->where('players.data.0.followers_count', 1));
        $this->get('/players/network_owner/following')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('direction', 'following')->has('players.data', 1)->where('players.data.0.username', 'following_player')->where('players.data.0.is_self', true));
    }

    public function test_private_and_unconfigured_members_are_not_exposed_in_either_direction(): void
    {
        $owner = $this->player('public_owner');
        $visible = $this->player('visible_player');
        $private = $this->player('private_player', false);
        $unnamed = User::factory()->create();
        UserProfile::factory()->for($unnamed)->create(['username' => null, 'is_public' => true]);
        foreach ([$visible, $private, $unnamed, User::factory()->create()] as $member) {
            $this->follow($member, $owner);
            $this->follow($owner, $member);
        }
        foreach (['followers', 'following'] as $direction) {
            $this->get('/players/public_owner/'.$direction)->assertOk()->assertDontSee('private_player')->assertDontSee($private->email)
                ->assertInertia(fn (Assert $page) => $page->has('players.data', 1)->where('players.data.0.username', 'visible_player'));
        }
    }

    public function test_private_network_requires_ownership_and_works_without_a_username(): void
    {
        $private = $this->player('hidden_owner', false);
        $member = $this->player('public_member');
        $this->follow($private, $member);
        $this->get('/players/hidden_owner/following')->assertNotFound();
        $this->get('/community/profile/following')->assertRedirect('/login');
        $this->actingAs($member)->get('/players/hidden_owner/followers')->assertNotFound();
        $private->profile->update(['username' => null]);
        $this->actingAs($private)->get('/community/profile/following')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('isOwnNetwork', true)->where('owner.username', null)->has('players.data', 1));
        $this->get('/community/profile/followers')->assertOk()->assertInertia(fn (Assert $page) => $page->has('players.data', 0));
        $this->actingAs(User::factory()->create())->get('/community/profile/followers')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('owner.username', null)->has('players.data', 0));
    }

    public function test_only_public_review_and_list_counts_are_included_without_private_content_or_library_statistics(): void
    {
        Http::preventStrayRequests();
        $owner = $this->player('owner_player');
        $member = $this->player('member_player');
        $this->follow($member, $owner);
        Review::factory()->for(LibraryEntry::factory()->for($member)->create())->create(['is_public' => true]);
        Review::factory()->for(LibraryEntry::factory()->for($member)->create())->create(['is_public' => false, 'body' => 'PRIVATE NETWORK REVIEW']);
        foreach ([ListVisibility::Public, ListVisibility::Private, ListVisibility::Unlisted] as $visibility) {
            GameList::factory()->for($member)->create(['visibility' => $visibility, 'name' => 'NETWORK LIST BODY']);
        }
        $this->get('/players/owner_player/followers')->assertOk()->assertDontSee($member->email)->assertDontSee('PRIVATE NETWORK REVIEW')->assertDontSee('NETWORK LIST BODY')
            ->assertInertia(fn (Assert $page) => $page->where('players.data.0.public_reviews_count', 1)->where('players.data.0.public_lists_count', 1)
                ->missing('players.data.0.email')->missing('players.data.0.library_entries_count')->missing('players.data.0.reviews')->missing('players.data.0.password'));
        Http::assertNothingSent();
    }

    public function test_recent_and_name_sorting_are_stable_and_pagination_preserves_sort(): void
    {
        $owner = $this->player('owner_player');
        $alpha = $this->player('zulu_username');
        $alpha->profile->update(['display_name' => 'Alpha']);
        $beta = $this->player('alpha_username');
        $beta->profile->update(['display_name' => 'beta']);
        $this->follow($alpha, $owner, '2026-10-01 12:00:00');
        $this->follow($beta, $owner, '2026-10-02 12:00:00');
        $this->get('/players/owner_player/followers')->assertInertia(fn (Assert $page) => $page->where('sort', 'recent')->where('players.data.0.username', 'alpha_username'));
        $this->get('/players/owner_player/followers?sort=name')->assertInertia(fn (Assert $page) => $page->where('players.data.0.username', 'zulu_username'));
        for ($i = 0; $i < 19; $i++) {
            $this->follow($this->player('extra_player_'.$i), $owner);
        }
        $this->get('/players/owner_player/followers?sort=name')->assertInertia(fn (Assert $page) => $page
            ->has('players.data', 20)->where('players.meta.total', 21)->where('players.links.next', fn ($url) => str_contains($url, 'sort=name') && str_contains($url, 'page=2')));
        $this->get('/players/owner_player/followers?sort=name&page=2')->assertInertia(fn (Assert $page) => $page->has('players.data', 1)->where('players.meta.current_page', 2));
    }

    public function test_follow_and_unfollow_return_to_the_same_network_filters_without_redirecting_to_the_member(): void
    {
        $viewer = $this->player('viewer_player');
        $owner = $this->player('owner_player');
        $target = $this->player('target_player');
        $this->follow($target, $owner);
        $this->actingAs($viewer);
        foreach (['followers', 'following'] as $direction) {
            foreach ([false, true] as $mine) {
                $data = ['return_to_network' => $direction, 'network_owner' => $mine, 'network_username' => $owner->profile->username, 'sort' => 'name', 'page' => 2];
                $destination = $mine ? '/community/profile/'.$direction : '/players/owner_player/'.$direction;
                $this->post('/players/target_player/follow', $data)->assertRedirect($destination.'?sort=name&page=2');
                $this->assertDatabaseHas('follows', ['follower_id' => $viewer->id, 'followed_id' => $target->id]);
                $this->delete('/players/target_player/follow', $data)->assertRedirect($destination.'?sort=name&page=2');
                $this->assertDatabaseMissing('follows', ['follower_id' => $viewer->id, 'followed_id' => $target->id]);
            }
        }
    }

    public function test_invalid_sort_page_and_redirect_inputs_are_rejected_before_mutation(): void
    {
        $owner = $this->player('owner_player');
        $this->getJson('/players/owner_player/followers?sort=sql&page=-1')->assertUnprocessable()->assertJsonValidationErrors(['sort', 'page']);
        $this->getJson('/players/owner_player/followers?sort[]=name')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $viewer = $this->player('viewer_player');
        $this->actingAs($viewer)->postJson('/players/owner_player/follow', ['return_to_network' => 'followers', 'network_username' => 'https://elsewhere.example'])
            ->assertUnprocessable()->assertJsonValidationErrors('network_username');
        $this->postJson('/players/owner_player/follow', ['return_to_network' => 'unsafe'])->assertUnprocessable()->assertJsonValidationErrors('return_to_network');
        $this->assertDatabaseCount('follows', 0);
    }
}
