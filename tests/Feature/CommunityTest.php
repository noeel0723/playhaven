<?php

namespace Tests\Feature;

use App\Models\DiaryEntry;
use App\Models\Follow;
use App\Models\GameList;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CommunityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    private function player(string $username, bool $public = true): User
    {
        $user = User::factory()->create(['name' => 'Private account name '.$username]);
        UserProfile::factory()->for($user)->create(['username' => $username, 'display_name' => 'Player '.$username, 'is_public' => $public]);

        return $user;
    }

    private function review(User $user, bool $public = true, array $changes = []): Review
    {
        return Review::factory()->for(LibraryEntry::factory()->for($user)->create())->create(['is_public' => $public, ...$changes]);
    }

    private function profileData(array $changes = []): array
    {
        return ['username' => 'new_player', 'display_name' => 'New Player', 'bio' => 'I love exploring worlds.', 'is_public' => false, ...$changes];
    }

    public function test_discovery_is_public_but_only_lists_opted_in_profiles_and_safe_identity_fields(): void
    {
        $visible = $this->player('visible_player');
        $hidden = $this->player('hidden_player', false);
        $account = User::factory()->create();
        $this->get('/players')->assertOk()->assertDontSee($visible->email)->assertDontSee($visible->name)
            ->assertDontSee($hidden->email)->assertDontSee($account->email)
            ->assertInertia(fn (Assert $page) => $page->component('players/index')->has('players.data', 1)
                ->where('players.data.0.username', 'visible_player')->where('players.data.0.name', 'Player visible_player')
                ->missing('players.data.0.email')->missing('players.data.0.password')->missing('players.data.0.user_id'));
        $this->get('/players/hidden_player')->assertNotFound();
        $this->get('/players/missing_player')->assertNotFound();
        Http::assertNothingSent();
    }

    public function test_profile_setup_is_owned_opt_in_and_does_not_change_login_credentials_or_other_profiles(): void
    {
        $owner = User::factory()->create();
        $other = $this->player('other_player');
        $otherBefore = $other->profile->getRawOriginal();
        $this->actingAs($owner)->get(route('players.edit'))->assertInertia(fn (Assert $page) => $page->where('profile', null));
        $this->put(route('players.update'), $this->profileData(['username' => '  NEW_Player ', 'user_id' => $other->id, 'email' => 'changed@example.org', 'password' => 'changed-password']))
            ->assertRedirect(route('players.edit'));
        $this->assertDatabaseHas('user_profiles', ['user_id' => $owner->id, 'username' => 'new_player', 'is_public' => false]);
        $this->assertSame($owner->email, $owner->fresh()->email);
        $this->assertSame($owner->password, $owner->fresh()->password);
        $this->assertSame($otherBefore, $other->profile->fresh()->getRawOriginal());
        $this->get('/players/new_player')->assertNotFound();
        $this->put(route('players.update'), $this->profileData(['is_public' => true]))->assertRedirect(route('players.edit'));
        $this->get('/players/NEW_PLAYER')->assertOk()->assertInertia(fn (Assert $page) => $page->where('player.is_self', true));
    }

    public function test_profile_validation_handles_case_insensitive_collisions_and_invalid_shapes(): void
    {
        $existing = $this->player('existing_player');
        $viewer = User::factory()->create();
        $this->actingAs($viewer)->put(route('players.update'), $this->profileData(['username' => 'EXISTING_PLAYER']))->assertSessionHasErrors('username');
        $existing->profile->update(['username' => 'Legacy_Player']);
        $this->put(route('players.update'), $this->profileData(['username' => 'legacy_player']))->assertSessionHasErrors('username');
        $this->put(route('players.update'), $this->profileData(['username' => '../bad', 'display_name' => str_repeat('n', 81), 'bio' => str_repeat('b', 1001), 'is_public' => ['bad']]))
            ->assertSessionHasErrors(['username', 'display_name', 'bio', 'is_public']);
        $this->assertDatabaseCount('user_profiles', 1);
    }

    public function test_editing_own_profile_keeps_the_username_and_player_history(): void
    {
        $owner = $this->player('stable_player');
        $entry = LibraryEntry::factory()->for($owner)->create();
        Rating::factory()->for($entry)->create(['score' => 9]);
        $before = $entry->fresh()->getRawOriginal();
        $this->actingAs($owner)->put(route('players.update'), $this->profileData(['username' => 'stable_player', 'display_name' => 'New public alias', 'is_public' => true]))->assertSessionHasNoErrors();
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
        $this->assertDatabaseHas('ratings', ['library_entry_id' => $entry->id, 'score' => 9]);
        $this->assertDatabaseCount('user_profiles', 1);
    }

    public function test_public_profile_only_shows_public_reviews_and_lists_without_private_experience(): void
    {
        $player = $this->player('public_player');
        $public = $this->review($player, true, ['body' => 'A public story.']);
        $this->review($player, false, ['body' => 'Private review secret.']);
        GameList::factory()->for($player)->create(['visibility' => 'public', 'name' => 'Public worlds']);
        GameList::factory()->for($player)->create(['visibility' => 'private', 'name' => 'Private list secret']);
        GameList::factory()->for($player)->create(['visibility' => 'unlisted', 'name' => 'Unlisted list secret']);
        DiaryEntry::factory()->create(['notes' => 'Private diary secret']);

        $this->get('/players/public_player')->assertOk()->assertDontSee($player->email)->assertDontSee($player->name)
            ->assertDontSee('Private review secret.')->assertDontSee('Private list secret')->assertDontSee('Unlisted list secret')->assertDontSee('Private diary secret')
            ->assertInertia(fn (Assert $page) => $page->component('players/show')->has('reviews.data', 1)->where('reviews.data.0.id', $public->id)
                ->where('reviews.data.0.game.slug', $public->libraryEntry->game->slug)->missing('reviews.data.0.game.data')
                ->has('lists.data', 1)->where('lists.data.0.name', 'Public worlds')->where('lists.data.0.owner.name', 'Player public_player')
                ->missing('player.library')->missing('player.email')->missing('player.diary'));
    }

    public function test_everyone_feed_only_shows_public_reviews_from_public_profiles_in_stable_order(): void
    {
        $player = $this->player('public_writer');
        $hidden = $this->player('private_writer', false);
        $old = $this->review($player, true, ['updated_at' => now()->subDay()]);
        $recent = $this->review($player, true, ['contains_spoilers' => true]);
        $this->review($player, false, ['body' => 'Hidden review body']);
        $this->review($hidden, true, ['body' => 'Hidden profile review body']);
        $this->review(User::factory()->create(), true, ['body' => 'No profile review body']);
        Rating::factory()->for($recent->libraryEntry)->create(['score' => 9]);

        $this->get('/community')->assertOk()->assertDontSee($player->email)->assertDontSee('Hidden review body')->assertDontSee('Hidden profile review body')->assertDontSee('No profile review body')
            ->assertInertia(fn (Assert $page) => $page->component('community/index')->where('feed', 'everyone')->has('reviews.data', 2)
                ->where('reviews.data.0.id', $recent->id)->where('reviews.data.1.id', $old->id)
                ->where('reviews.data.0.author.username', 'public_writer')->where('reviews.data.0.rating', 4.5)->where('reviews.data.0.contains_spoilers', true)
                ->where('reviews.data.0.game.slug', $recent->libraryEntry->game->slug)->missing('reviews.data.0.game.data'));
        Http::assertNothingSent();
    }

    public function test_following_feed_is_authenticated_and_only_includes_followed_public_writers(): void
    {
        $viewer = User::factory()->create();
        $followed = $this->player('followed_writer');
        $other = $this->player('other_writer');
        Follow::create(['follower_id' => $viewer->id, 'followed_id' => $followed->id]);
        $review = $this->review($followed);
        $this->review($followed, false);
        $this->review($other);
        $this->get('/community?feed=following')->assertRedirect(route('login'));
        $this->actingAs($viewer)->get('/community?feed=following')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('feed', 'following')->has('reviews.data', 1)->where('reviews.data.0.id', $review->id));
        $this->delete(route('follows.destroy', 'followed_writer'))->assertRedirect(route('players.show', 'followed_writer'));
        $this->get('/community?feed=following')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 0));
    }

    public function test_follow_is_idempotent_updates_counts_and_cannot_follow_self(): void
    {
        $viewer = $this->player('my_player');
        $target = $this->player('target_player');
        $this->actingAs($viewer)->post(route('follows.store', 'target_player'))->assertRedirect(route('players.show', 'target_player'));
        $this->post(route('follows.store', 'target_player'))->assertRedirect();
        $this->assertDatabaseCount('follows', 1);
        $this->get('/players/target_player')->assertInertia(fn (Assert $page) => $page->where('player.is_following', true)->where('player.followers_count', 1));
        $this->get('/players/my_player')->assertInertia(fn (Assert $page) => $page->where('player.is_self', true)->where('player.following_count', 1));
        $this->post(route('follows.store', 'my_player'))->assertSessionHasErrors('follow');
        $this->assertDatabaseCount('follows', 1);
    }

    public function test_unfollow_only_removes_the_authenticated_users_edge(): void
    {
        $viewer = User::factory()->create();
        $other = User::factory()->create();
        $target = $this->player('target_player');
        Follow::create(['follower_id' => $viewer->id, 'followed_id' => $target->id]);
        Follow::create(['follower_id' => $other->id, 'followed_id' => $target->id]);
        $this->actingAs($viewer)->delete(route('follows.destroy', 'target_player'), ['follower_id' => $other->id])->assertRedirect();
        $this->delete(route('follows.destroy', 'target_player'))->assertRedirect();
        $this->assertDatabaseCount('follows', 1);
        $this->assertDatabaseHas('follows', ['follower_id' => $other->id, 'followed_id' => $target->id]);
    }

    public function test_guests_cannot_change_profiles_or_follow_and_private_targets_are_not_followable(): void
    {
        $hidden = $this->player('hidden_target', false);
        $this->get(route('players.edit'))->assertRedirect(route('login'));
        $this->put(route('players.update'), $this->profileData())->assertRedirect(route('login'));
        $this->post(route('follows.store', 'hidden_target'))->assertRedirect(route('login'));
        $this->delete(route('follows.destroy', 'hidden_target'))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->post(route('follows.store', 'hidden_target'))->assertNotFound();
        $this->post(route('follows.store', 'missing_target'))->assertNotFound();
        $this->assertDatabaseCount('follows', 0);
    }

    public function test_hiding_profile_or_unpublishing_review_immediately_removes_it_from_feeds(): void
    {
        $writer = $this->player('visible_writer');
        $review = $this->review($writer);
        $this->get('/community')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 1));
        $review->update(['is_public' => false]);
        $this->get('/community')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 0));
        $review->update(['is_public' => true]);
        $this->actingAs($writer)->put(route('players.update'), $this->profileData(['username' => 'visible_writer', 'is_public' => false]))->assertSessionHasNoErrors();
        $this->get('/community')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 0));
        $this->get('/players')->assertInertia(fn (Assert $page) => $page->has('players.data', 0));
        $this->get('/players/visible_writer')->assertNotFound();
        $this->assertModelExists($review);
    }

    public function test_player_search_is_case_insensitive_literal_and_never_searches_email(): void
    {
        $literal = $this->player('literal_player');
        $literal->profile->update(['display_name' => '100%_Complete']);
        $this->player('other_player');
        $this->get('/players?q='.urlencode('%_'))->assertInertia(fn (Assert $page) => $page->has('players.data', 1)->where('players.data.0.username', 'literal_player'));
        $this->get('/players?q=LITERAL')->assertInertia(fn (Assert $page) => $page->has('players.data', 1));
        $this->get('/players?q='.urlencode($literal->email))->assertInertia(fn (Assert $page) => $page->has('players.data', 0));
    }

    public function test_feed_pagination_preserves_following_scope_and_profile_lists_remain_paginated(): void
    {
        $viewer = User::factory()->create();
        $writer = $this->player('many_stories');
        Follow::create(['follower_id' => $viewer->id, 'followed_id' => $writer->id]);
        for ($i = 0; $i < 13; $i++) {
            $this->review($writer);
        }
        GameList::factory()->for($writer)->count(7)->create(['visibility' => 'public']);
        $this->actingAs($viewer)->get('/community?feed=following')->assertInertia(fn (Assert $page) => $page
            ->has('reviews.data', 12)->where('reviews.meta.total', 13)->where('reviews.links.next', fn ($url) => str_contains($url, 'feed=following') && str_contains($url, 'page=2')));
        $this->get('/players/many_stories')->assertInertia(fn (Assert $page) => $page->has('reviews.data', 12)->has('lists.data', 6)
            ->where('reviews.links.next', fn ($url) => str_contains($url, 'reviews_page=2'))->where('lists.links.next', fn ($url) => str_contains($url, 'lists_page=2')));
    }

    public function test_browse_query_shapes_are_rejected_before_database_searches(): void
    {
        $this->getJson('/community?feed=invalid&page=-1')->assertUnprocessable()->assertJsonValidationErrors(['feed', 'page']);
        $this->getJson('/players?q[]=bad')->assertUnprocessable()->assertJsonValidationErrors('q');
        $this->getJson('/players?q='.str_repeat('x', 101))->assertUnprocessable()->assertJsonValidationErrors('q');
    }

    public function test_public_game_review_links_use_opted_in_alias_and_disappear_when_profile_is_hidden(): void
    {
        $writer = $this->player('linked_writer');
        $review = $this->review($writer);
        $this->get(route('games.show', $review->libraryEntry->game->slug))->assertInertia(fn (Assert $page) => $page
            ->where('reviews.data.0.author.username', 'linked_writer')->where('reviews.data.0.author.name', 'Player linked_writer'));
        $writer->profile->update(['is_public' => false]);
        $this->get(route('games.show', $review->libraryEntry->game->slug))->assertInertia(fn (Assert $page) => $page
            ->where('reviews.data.0.author.username', null)->where('reviews.data.0.author.name', 'Player linked_writer'));
    }

    public function test_unverified_users_cannot_mutate_community_outside_the_local_bypass(): void
    {
        config(['auth.require_email_verification' => false]);
        $viewer = User::factory()->unverified()->create();
        $this->player('verified_target');
        $this->actingAs($viewer)->get(route('players.edit'))->assertRedirect(route('verification.notice'));
        $this->put(route('players.update'), $this->profileData())->assertRedirect(route('verification.notice'));
        $this->post(route('follows.store', 'verified_target'))->assertRedirect(route('verification.notice'));
        $this->delete(route('follows.destroy', 'verified_target'))->assertRedirect(route('verification.notice'));
        $this->assertDatabaseCount('follows', 0);
        $this->assertDatabaseCount('user_profiles', 1);
    }

    public function test_follow_mutations_are_rate_limited(): void
    {
        $viewer = User::factory()->create();
        $this->player('popular_player');
        $this->actingAs($viewer);
        for ($i = 0; $i < 30; $i++) {
            $this->post(route('follows.store', 'popular_player'))->assertRedirect();
        }
        $this->post(route('follows.store', 'popular_player'))->assertStatus(429);
        $this->assertDatabaseCount('follows', 1);
    }
}
