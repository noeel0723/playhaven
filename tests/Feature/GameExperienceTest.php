<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Playthrough;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class GameExperienceTest extends TestCase
{
    use RefreshDatabase;

    public static function validRatings(): array
    {
        return array_map(fn (int $score) => [$score / 2, $score], range(1, 10));
    }

    #[DataProvider('validRatings')]
    public function test_half_star_ratings_update_one_vote_without_changing_library_status(float $stars, int $score): void
    {
        $entry = LibraryEntry::factory()->create(['status' => 'paused', 'is_favorite' => true]);
        $this->actingAs($entry->user)->put(route('ratings.update', $entry->game->slug), ['stars' => 1])->assertRedirect();
        $id = $entry->rating()->sole()->id;
        $this->put(route('ratings.update', $entry->game->slug), ['stars' => $stars])->assertRedirect(route('games.show', $entry->game->slug));

        $this->assertDatabaseCount('ratings', 1);
        $this->assertDatabaseHas('ratings', ['id' => $id, 'library_entry_id' => $entry->id, 'score' => $score]);
        $this->assertDatabaseHas('library_entries', ['id' => $entry->id, 'status' => 'paused', 'is_favorite' => true]);
    }

    public static function invalidRatings(): array
    {
        return [[0], [-0.5], [5.5], [4.25], ['NaN'], ['infinity'], [['bad']], [true]];
    }

    #[DataProvider('invalidRatings')]
    public function test_invalid_ratings_cannot_overwrite_an_existing_vote(mixed $stars): void
    {
        $rating = Rating::factory()->create(['score' => 8]);
        $entry = $rating->libraryEntry;
        $this->actingAs($entry->user)->put(route('ratings.update', $entry->game->slug), ['stars' => $stars])->assertSessionHasErrors('stars');
        $this->assertSame(8, $rating->fresh()->score);
    }

    public function test_rating_field_must_be_present_and_clearing_preserves_review_and_playthroughs(): void
    {
        $entry = LibraryEntry::factory()->create();
        Rating::factory()->for($entry)->create();
        $review = Review::factory()->for($entry)->create();
        $run = Playthrough::factory()->for($entry)->create();
        $this->actingAs($entry->user)->put(route('ratings.update', $entry->game->slug), [])->assertSessionHasErrors('stars');
        $this->put(route('ratings.update', $entry->game->slug), ['stars' => null])->assertRedirect();
        $this->assertDatabaseCount('ratings', 0);
        $this->assertModelExists($review);
        $this->assertModelExists($run);
        $this->assertModelExists($entry);
    }

    public function test_experience_actions_require_login_and_an_owned_library_entry(): void
    {
        $entry = LibraryEntry::factory()->create();
        $game = $entry->game;
        $reviewData = ['body' => 'A wonderful world.', 'is_public' => false, 'contains_spoilers' => false];
        $this->put(route('ratings.update', $game->slug), ['stars' => 4])->assertRedirect(route('login'));
        $this->put(route('reviews.update', $game->slug), $reviewData)->assertRedirect(route('login'));
        $this->delete(route('reviews.destroy', $game->slug), ['confirm' => true])->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->put(route('ratings.update', $game->slug), ['stars' => 4])->assertNotFound();
        $this->put(route('reviews.update', $game->slug), $reviewData)->assertNotFound();
        $this->delete(route('reviews.destroy', $game->slug), ['confirm' => true])->assertNotFound();
        $this->assertDatabaseCount('ratings', 0);
        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_review_edits_preserve_identity_and_can_be_saved_without_rating_or_completion(): void
    {
        $entry = LibraryEntry::factory()->create(['status' => 'backlog']);
        $this->actingAs($entry->user)->put(route('reviews.update', $entry->game->slug), [
            'body' => '  First impressions.  ', 'is_public' => false, 'contains_spoilers' => false,
        ])->assertRedirect();
        $review = $entry->review()->sole();
        $this->assertSame('First impressions.', $review->body);
        $this->put(route('reviews.update', $entry->game->slug), [
            'body' => 'The ending stayed with me.', 'is_public' => true, 'contains_spoilers' => true,
        ])->assertRedirect();
        $this->assertDatabaseCount('reviews', 1);
        $this->assertDatabaseHas('reviews', ['id' => $review->id, 'body' => 'The ending stayed with me.', 'is_public' => true, 'contains_spoilers' => true]);
        $this->assertDatabaseCount('ratings', 0);
        $this->assertDatabaseHas('library_entries', ['id' => $entry->id, 'status' => 'backlog']);
    }

    public function test_review_validation_rejects_blank_oversized_and_invalid_fields(): void
    {
        $entry = LibraryEntry::factory()->create();
        $url = route('reviews.update', $entry->game->slug);
        $this->actingAs($entry->user)->put($url, ['body' => " \n\t\u{2003} ", 'is_public' => 'yes', 'contains_spoilers' => []])->assertSessionHasErrors(['body', 'is_public', 'contains_spoilers']);
        $this->put($url, ['body' => str_repeat('x', 10001), 'is_public' => false, 'contains_spoilers' => false])->assertSessionHasErrors('body');
        $this->put($url, ['body' => ['bad']])->assertSessionHasErrors(['body', 'is_public', 'contains_spoilers']);
        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_forged_ids_never_update_another_players_rating_or_review(): void
    {
        $other = LibraryEntry::factory()->create();
        $otherRating = Rating::factory()->for($other)->create(['score' => 10]);
        $otherReview = Review::factory()->for($other)->create(['body' => 'Other private thoughts.', 'is_public' => false]);
        $owner = LibraryEntry::factory()->for($other->game)->create();
        $this->actingAs($owner->user)->put(route('ratings.update', $other->game->slug), [
            'stars' => 1.5, 'id' => $otherRating->id, 'library_entry_id' => $other->id, 'user_id' => $other->user_id, 'score' => 10,
        ])->assertRedirect();
        $this->put(route('reviews.update', $other->game->slug), [
            'body' => 'My own review.', 'is_public' => true, 'contains_spoilers' => false,
            'id' => $otherReview->id, 'library_entry_id' => $other->id,
        ])->assertRedirect();
        $this->assertSame(10, $otherRating->fresh()->score);
        $this->assertSame('Other private thoughts.', $otherReview->fresh()->body);
        $this->assertDatabaseHas('ratings', ['library_entry_id' => $owner->id, 'score' => 3]);
        $this->assertDatabaseHas('reviews', ['library_entry_id' => $owner->id, 'body' => 'My own review.']);
    }

    public function test_private_reviews_never_enter_the_public_payload_but_owners_can_edit_them(): void
    {
        $game = Game::factory()->create();
        $normal = Review::factory()->for(LibraryEntry::factory()->for($game))->create(['body' => 'Public opinion.', 'is_public' => true]);
        $spoiler = Review::factory()->for(LibraryEntry::factory()->for($game))->create(['body' => 'The ending revealed.', 'is_public' => true, 'contains_spoilers' => true]);
        Review::factory()->for(LibraryEntry::factory()->for($game))->create(['body' => 'SECRET_OTHER_PRIVATE', 'is_public' => false]);
        $own = Review::factory()->for(LibraryEntry::factory()->for($game))->create(['body' => 'SECRET_OWN_PRIVATE', 'is_public' => false]);
        Review::factory()->create(['body' => 'SECRET_OTHER_GAME', 'is_public' => true]);
        $url = route('games.show', $game->slug);
        $this->get($url)->assertOk()->assertDontSee('SECRET_')->assertInertia(fn (Assert $page) => $page
            ->has('reviews.data', 2)->where('reviews.meta.total', 2)->where('personalReview', null)->where('personalRating', null)
            ->missing('reviews.data.0.author.email')->missing('reviews.data.0.library_entry_id')
            ->where('reviews.data', fn ($reviews) => collect($reviews)->pluck('id')->sort()->values()->all() === collect([$normal->id, $spoiler->id])->sort()->values()->all()));
        $this->actingAs($own->libraryEntry->user)->get($url)->assertDontSee('SECRET_OTHER_PRIVATE')->assertInertia(fn (Assert $page) => $page
            ->where('personalReview.body', 'SECRET_OWN_PRIVATE')->where('personalReview.is_public', false)->has('reviews.data', 2));
    }

    public function test_switching_a_public_review_to_private_removes_it_from_community_results(): void
    {
        $review = Review::factory()->create(['is_public' => true]);
        $entry = $review->libraryEntry;
        $this->actingAs($entry->user)->put(route('reviews.update', $entry->game->slug), [
            'body' => 'NOW_PRIVATE_ONLY', 'contains_spoilers' => false, 'is_public' => false,
        ])->assertRedirect();
        $this->get(route('games.show', $entry->game->slug))->assertInertia(fn (Assert $page) => $page
            ->where('reviews.meta.total', 0)->has('reviews.data', 0)->where('personalReview.id', $review->id));
        $this->post(route('logout'))->assertRedirect();
        $this->get(route('games.show', $entry->game->slug))->assertDontSee('NOW_PRIVATE_ONLY')->assertInertia(fn (Assert $page) => $page->where('personalReview', null));
    }

    public function test_public_review_pagination_and_spoiler_flags_exclude_private_counts(): void
    {
        $game = Game::factory()->create();
        Review::factory()->count(12)->create(['library_entry_id' => fn () => LibraryEntry::factory()->for($game)->create()->id, 'is_public' => true, 'contains_spoilers' => true]);
        Review::factory()->count(3)->create(['library_entry_id' => fn () => LibraryEntry::factory()->for($game)->create()->id, 'is_public' => false]);
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page
            ->has('reviews.data', 10)->where('reviews.meta.total', 12)->where('reviews.data.0.contains_spoilers', true)
            ->where('reviews.links.next', fn ($url) => str_contains($url, 'reviews_page=2')));
        $this->get(route('games.show', ['game' => $game->slug, 'reviews_page' => 2]))->assertInertia(fn (Assert $page) => $page->has('reviews.data', 2));
        $this->get(route('games.show', ['game' => $game->slug, 'reviews_page' => ['bad']]))->assertSessionHasErrors('reviews_page');
    }

    public function test_review_deletion_requires_confirmation_and_keeps_rating_and_history(): void
    {
        $review = Review::factory()->create();
        $entry = $review->libraryEntry;
        $rating = Rating::factory()->for($entry)->create();
        $run = Playthrough::factory()->for($entry)->create();
        $other = Review::factory()->for(LibraryEntry::factory()->for($entry->game))->create();
        $url = route('reviews.destroy', $entry->game->slug);
        $this->actingAs($entry->user)->delete($url)->assertSessionHasErrors('confirm');
        $this->delete($url, ['confirm' => false])->assertSessionHasErrors('confirm');
        $this->assertModelExists($review);
        $this->delete($url, ['confirm' => true])->assertRedirect(route('games.show', $entry->game->slug));
        $this->assertModelMissing($review);
        foreach ([$entry, $rating, $run, $other] as $record) {
            $this->assertModelExists($record);
        }
    }

    public function test_rating_updates_refresh_community_average_and_personal_library_rating(): void
    {
        $entry = LibraryEntry::factory()->create();
        Rating::factory()->for(LibraryEntry::factory()->for($entry->game))->create(['score' => 4]);
        Playthrough::factory()->count(3)->for($entry)->create();
        $this->actingAs($entry->user)->put(route('ratings.update', $entry->game->slug), ['stars' => 5])->assertRedirect();
        $this->get(route('games.show', $entry->game->slug))->assertInertia(fn (Assert $page) => $page
            ->where('game.rating', 3.5)->where('game.ratings_count', 2)->where('personalRating', fn ($stars) => (float) $stars === 5.0));
        $this->get(route('library.index'))->assertInertia(fn (Assert $page) => $page
            ->where('entries.data.0.your_rating', fn ($stars) => (float) $stars === 5.0));
        $this->put(route('ratings.update', $entry->game->slug), ['stars' => null])->assertRedirect();
        $this->get(route('games.show', $entry->game->slug))->assertInertia(fn (Assert $page) => $page
            ->where('game.ratings_count', 1)->where('game.rating', fn ($stars) => (float) $stars === 2.0));
    }

    public function test_production_verification_middleware_also_protects_experience_actions(): void
    {
        $entry = LibraryEntry::factory()->for(User::factory()->unverified())->create();
        $this->actingAs($entry->user)->put(route('ratings.update', $entry->game->slug), ['stars' => 4])->assertRedirect(route('verification.notice'));
        $this->put(route('reviews.update', $entry->game->slug), ['body' => 'My review.', 'is_public' => true, 'contains_spoilers' => false])->assertRedirect(route('verification.notice'));
        $this->assertDatabaseCount('ratings', 0);
        $this->assertDatabaseCount('reviews', 0);
    }
}
