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

class PlayerDirectoryTest extends TestCase
{
    use RefreshDatabase;

    private function player(string $username, bool $public = true): User
    {
        $user = User::factory()->create();
        UserProfile::factory()->for($user)->create(['username' => $username, 'display_name' => $username, 'is_public' => $public]);

        return $user;
    }

    private function follow(User $from, User $to): void
    {
        Follow::factory()->create(['follower_id' => $from->id, 'followed_id' => $to->id]);
    }

    public function test_overview_shows_eight_public_players_ranked_by_followers_with_stable_ties(): void
    {
        Http::preventStrayRequests();
        $viewer = $this->player('viewer_player');
        $first = $this->player('first_player');
        $second = $this->player('second_player');
        $hidden = $this->player('hidden_player', false);
        $unconfigured = User::factory()->create();
        for ($i = 0; $i < 7; $i++) {
            $this->player('extra_player_'.$i);
        }
        $this->follow($viewer, $first);
        $this->follow($second, $first);
        $this->follow($first, $second);
        $this->follow($viewer, $hidden);
        $this->actingAs($viewer)->get('/players')->assertOk()->assertDontSee($hidden->email)->assertDontSee($unconfigured->email)
            ->assertInertia(fn (Assert $page) => $page->has('popularPlayers', 8)->where('publicPlayerCount', 10)
                ->where('popularPlayers.0.username', 'first_player')->where('popularPlayers.0.followers_count', 2)
                ->where('popularPlayers.1.username', 'second_player')->where('popularPlayers.2.username', 'viewer_player')
                ->where('popularPlayers.0.is_following', true)->where('popularPlayers.0.is_friend', false)->where('popularPlayers.2.is_self', true)
                ->missing('popularPlayers.0.email')->missing('popularPlayers.0.library_entries_count'));
        Http::assertNothingSent();
    }

    public function test_all_players_paginate_twenty_and_keep_search_order_and_self(): void
    {
        $viewer = $this->player('member_viewer');
        $leader = $this->player('member_leader');
        for ($i = 0; $i < 20; $i++) {
            $this->player('member_extra_'.$i);
        }
        $this->player('unrelated_player');
        $this->follow($viewer, $leader);
        $this->actingAs($viewer)->get('/players/browse/all?q=member')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('players/popular')->has('players.data', 20)->where('players.meta.total', 22)
            ->where('players.data.0.username', 'member_leader')->where('players.data.1.is_self', true)
            ->where('players.links.next', fn ($url) => str_contains($url, 'q=member') && str_contains($url, 'page=2')));
        $this->get('/players/browse/all?q=member&page=2')->assertInertia(fn (Assert $page) => $page
            ->has('players.data', 2)->where('players.meta.current_page', 2));
    }

    public function test_counts_and_reviewer_sidebar_never_include_private_reviews_or_lists(): void
    {
        $target = $this->player('target_player');
        $hidden = $this->player('hidden_player', false);
        foreach ([$target, $hidden] as $user) {
            Review::factory()->for(LibraryEntry::factory()->for($user)->create())->create(['is_public' => true]);
            Review::factory()->for(LibraryEntry::factory()->for($user)->create())->create(['is_public' => false, 'body' => 'PRIVATE DIRECTORY REVIEW']);
            foreach ([ListVisibility::Public, ListVisibility::Private, ListVisibility::Unlisted] as $visibility) {
                GameList::factory()->for($user)->create(['visibility' => $visibility, 'name' => 'PRIVATE DIRECTORY LIST NAME']);
            }
        }
        $this->get('/players/browse/all')->assertOk()->assertDontSee($target->email)->assertDontSee('PRIVATE DIRECTORY REVIEW')->assertDontSee('PRIVATE DIRECTORY LIST NAME')
            ->assertInertia(fn (Assert $page) => $page->has('players.data', 1)->where('players.data.0.public_reviews_count', 1)
                ->where('players.data.0.public_lists_count', 1)->has('reviewers', 1)->where('reviewers.0.username', 'target_player')
                ->missing('players.data.0.library_entries')->missing('players.data.0.password')->missing('reviewers.0.email'));
    }

    public function test_network_previews_have_correct_directions_and_only_public_profiles(): void
    {
        $viewer = $this->player('viewer_player');
        $following = $this->player('following_player');
        $follower = $this->player('follower_player');
        $hidden = $this->player('hidden_player', false);
        $this->follow($viewer, $following);
        $this->follow($follower, $viewer);
        $this->follow($viewer, $hidden);
        $this->follow($hidden, $viewer);
        $this->get('/players')->assertInertia(fn (Assert $page) => $page->where('network', []));
        $this->actingAs($viewer)->get('/players')->assertInertia(fn (Assert $page) => $page
            ->where('network.following.total', 1)->where('network.following.data.0.username', 'following_player')
            ->where('network.followers.total', 1)->where('network.followers.data.0.username', 'follower_player'));
    }

    public function test_follow_and_unfollow_return_to_the_directory_and_preserve_filters(): void
    {
        $viewer = $this->player('viewer_player');
        $target = $this->player('target_player');
        $this->actingAs($viewer);
        $data = ['return_to_popular' => true, 'q' => 'target', 'page' => 2];
        $this->post('/players/target_player/follow', $data)->assertRedirect('/players/browse/all?q=target&page=2');
        $this->assertDatabaseHas('follows', ['follower_id' => $viewer->id, 'followed_id' => $target->id]);
        $this->delete('/players/target_player/follow', $data)->assertRedirect('/players/browse/all?q=target&page=2');
        $this->assertDatabaseMissing('follows', ['follower_id' => $viewer->id, 'followed_id' => $target->id]);
        $this->post('/players/target_player/follow', [...$data, 'page' => -1])->assertSessionHasErrors('page');
        $this->assertDatabaseMissing('follows', ['follower_id' => $viewer->id, 'followed_id' => $target->id]);
    }

    public function test_empty_search_validation_and_literal_wildcards(): void
    {
        $this->get('/players/browse/all')->assertInertia(fn (Assert $page) => $page->has('players.data', 0)->has('reviewers', 0));
        $this->player('alpha_player');
        $this->get('/players/browse/all?q=%25')->assertInertia(fn (Assert $page) => $page->has('players.data', 0));
        $this->get('/players/browse/all?q=ALPHA')->assertInertia(fn (Assert $page) => $page->has('players.data', 1));
        $this->get('/players/browse/all?page=0')->assertSessionHasErrors('page');
        $this->get('/players/browse/all?q[]=bad')->assertSessionHasErrors('q');
    }
}
