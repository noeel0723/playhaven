<?php

namespace Tests\Feature;

use App\Models\Follow;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlayerRelationshipTest extends TestCase
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
        Follow::create(['follower_id' => $from->id, 'followed_id' => $to->id]);
    }

    public function test_mutual_friends_and_each_one_way_relationship_are_scoped_to_the_current_viewer(): void
    {
        $viewer = $this->player('viewer_player');
        $friend = $this->player('friend_player');
        $following = $this->player('following_player');
        $follower = $this->player('follower_player');
        $other = $this->player('other_player');
        $this->follow($viewer, $friend);
        $this->follow($friend, $viewer);
        $this->follow($viewer, $following);
        $this->follow($follower, $viewer);
        $this->follow($following, $other);
        $this->follow($other, $following);
        $expected = ['friend_player' => [true, true, true], 'following_player' => [true, false, false], 'follower_player' => [false, true, false], 'other_player' => [false, false, false]];

        $directory = $this->actingAs($viewer)->get('/players')->assertOk()->viewData('page')['props']['players']['data'];
        $byUsername = collect($directory)->keyBy('username');
        foreach ($expected as $username => [$outgoing, $incoming, $mutual]) {
            $this->assertSame($outgoing, $byUsername[$username]['is_following']);
            $this->assertSame($incoming, $byUsername[$username]['follows_you']);
            $this->assertSame($mutual, $byUsername[$username]['is_friend']);
            $this->get('/players/'.$username)->assertInertia(fn (Assert $page) => $page
                ->where('player.is_following', $outgoing)->where('player.follows_you', $incoming)->where('player.is_friend', $mutual));
        }
        $this->get('/players/viewer_player')->assertInertia(fn (Assert $page) => $page->where('player.is_self', true)->where('player.is_friend', false));
        $this->get('/players/viewer_player/followers')->assertInertia(fn (Assert $page) => $page
            ->where('players.data', fn ($players) => collect($players)->firstWhere('username', 'friend_player')['is_friend'] === true));
    }

    public function test_guests_do_not_receive_another_players_friendship_state_and_private_profiles_stay_hidden(): void
    {
        $first = $this->player('first_player');
        $second = $this->player('second_player');
        $hidden = $this->player('hidden_player', false);
        $this->follow($first, $second);
        $this->follow($second, $first);
        $this->follow($hidden, $first);
        $this->follow($first, $hidden);
        $this->get('/players')->assertInertia(fn (Assert $page) => $page->has('players.data', 2)
            ->where('players.data', fn ($players) => collect($players)->every(fn ($player) => ! $player['is_friend'] && ! $player['follows_you'] && ! $player['is_following'])));
        $this->get('/players/second_player')->assertInertia(fn (Assert $page) => $page->where('player.is_friend', false)->where('player.follows_you', false));
        $this->actingAs($first)->get('/players')->assertInertia(fn (Assert $page) => $page->has('players.data', 1)->where('players.data.0.username', 'second_player')->where('players.data.0.is_friend', true));
        $this->get('/players/hidden_player')->assertNotFound();
    }

    public function test_following_back_and_unfollowing_refresh_friendship_without_leaving_the_directory(): void
    {
        $viewer = $this->player('viewer_player');
        $target = $this->player('target_player');
        $this->follow($target, $viewer);
        $this->actingAs($viewer)->get('/players?q=target')->assertInertia(fn (Assert $page) => $page
            ->where('players.data.0.is_friend', false)->where('players.data.0.follows_you', true)->where('players.data.0.is_following', false));
        $context = ['return_to_players' => true, 'q' => 'target', 'page' => 1];
        $this->post('/players/target_player/follow', $context)->assertRedirect('/players?q=target&page=1');
        $this->get('/players?q=target&page=1')->assertInertia(fn (Assert $page) => $page->where('players.data.0.is_friend', true));
        $this->post('/players/target_player/follow', $context)->assertRedirect();
        $this->assertDatabaseCount('follows', 2);
        $this->delete('/players/target_player/follow', $context)->assertRedirect('/players?q=target&page=1');
        $this->get('/players?q=target&page=1')->assertInertia(fn (Assert $page) => $page
            ->where('players.data.0.is_friend', false)->where('players.data.0.follows_you', true)->where('players.data.0.is_following', false));
        $this->get('/players/target_player')->assertInertia(fn (Assert $page) => $page->where('player.is_friend', false)->where('player.follows_you', true));
    }
}
