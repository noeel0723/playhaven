<?php

namespace Tests\Feature;

use App\Enums\LibraryStatus;
use App\Models\DiaryEntry;
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

class LibraryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_read_or_change_a_personal_library(): void
    {
        $game = Game::factory()->create();
        $this->get(route('library.index'))->assertRedirect(route('login'));
        $this->put(route('library.save', $game->slug), ['status' => 'playing', 'is_favorite' => true])->assertRedirect(route('login'));
        $this->delete(route('library.destroy', $game->slug), ['confirm' => true])->assertRedirect(route('login'));
        $this->assertDatabaseCount('library_entries', 0);
    }

    public static function statuses(): array
    {
        return array_map(fn (LibraryStatus $status) => [$status->value], LibraryStatus::cases());
    }

    #[DataProvider('statuses')]
    public function test_all_statuses_can_be_saved_without_duplicate_entries(string $status): void
    {
        $user = User::factory()->create();
        $game = Game::factory()->create();
        $this->actingAs($user)->put(route('library.save', $game->slug), ['status' => 'backlog', 'is_favorite' => false])->assertRedirect(route('games.show', $game->slug));
        $id = $user->libraryEntries()->sole()->id;

        $this->put(route('library.save', $game->slug), ['status' => $status, 'is_favorite' => true])->assertRedirect(route('games.show', $game->slug));

        $this->assertDatabaseCount('library_entries', 1);
        $this->assertDatabaseHas('library_entries', ['id' => $id, 'user_id' => $user->id, 'game_id' => $game->id, 'status' => $status, 'is_favorite' => true]);
        $this->assertDatabaseCount('playthroughs', 0);
    }

    public function test_invalid_status_and_favorite_values_do_not_create_entries(): void
    {
        $user = User::factory()->create();
        $game = Game::factory()->create();
        $this->actingAs($user)->put(route('library.save', $game->slug), ['status' => 'invalid', 'is_favorite' => 'yes'])->assertSessionHasErrors(['status', 'is_favorite']);
        $this->put(route('library.save', $game->slug), [])->assertSessionHasErrors(['status', 'is_favorite']);
        $this->assertDatabaseCount('library_entries', 0);
    }

    public function test_forged_ownership_and_game_fields_cannot_change_another_users_library(): void
    {
        $owner = User::factory()->create();
        $other = LibraryEntry::factory()->create(['status' => 'completed']);
        $targetGame = Game::factory()->create();

        $this->actingAs($owner)->put(route('library.save', $targetGame->slug), [
            'status' => 'playing', 'is_favorite' => false,
            'id' => $other->id, 'user_id' => $other->user_id, 'game_id' => $other->game_id,
        ])->assertRedirect();

        $this->assertDatabaseHas('library_entries', ['id' => $other->id, 'user_id' => $other->user_id, 'status' => 'completed']);
        $this->assertDatabaseHas('library_entries', ['user_id' => $owner->id, 'game_id' => $targetGame->id, 'status' => 'playing']);
        $this->assertDatabaseCount('library_entries', 2);
    }

    public function test_status_updates_preserve_the_entry_and_all_player_history(): void
    {
        $entry = LibraryEntry::factory()->create(['status' => 'completed']);
        $rating = Rating::factory()->for($entry)->create();
        $review = Review::factory()->for($entry)->create();
        $run = Playthrough::factory()->for($entry)->create();
        $diary = DiaryEntry::factory()->for($run)->create();

        $this->actingAs($entry->user)->put(route('library.save', $entry->game->slug), ['status' => 'playing', 'is_favorite' => true])->assertRedirect();

        $this->assertDatabaseCount('library_entries', 1);
        foreach ([$rating, $review, $run, $diary] as $record) {
            $this->assertModelExists($record);
        }
        $this->assertSame('playing', $entry->fresh()->status->value);
    }

    public function test_public_details_only_expose_the_current_users_library_state(): void
    {
        $game = Game::factory()->create();
        $other = LibraryEntry::factory()->for($game)->create(['status' => 'completed']);
        $user = User::factory()->create();
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page->where('libraryEntry', null));
        $this->actingAs($user)->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page->where('libraryEntry', null));
        LibraryEntry::factory()->for($game)->for($user)->create(['status' => 'paused', 'is_favorite' => true]);
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page
            ->has('libraryEntry', 2)->where('libraryEntry.status', 'paused')->where('libraryEntry.is_favorite', true));
        $this->assertSame('completed', $other->fresh()->status->value);
    }

    public function test_library_filters_and_counts_are_private_and_search_wildcards_are_literal(): void
    {
        $user = User::factory()->create();
        $match = LibraryEntry::factory()->for($user)->for(Game::factory()->state(['name' => '100%_Adventure']))->create(['status' => 'playing', 'is_favorite' => true]);
        LibraryEntry::factory()->for($user)->for(Game::factory()->state(['name' => '100 Days']))->create(['status' => 'playing', 'is_favorite' => true]);
        LibraryEntry::factory()->for($user)->create(['status' => 'backlog', 'is_favorite' => false]);
        LibraryEntry::factory()->for(Game::factory()->state(['name' => '100%_Private']))->create(['status' => 'playing', 'is_favorite' => true]);

        $this->actingAs($user)->get(route('library.index', ['q' => '%_', 'status' => 'playing', 'favorite' => 1]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('library/index')->has('entries.data', 1)->where('entries.data.0.id', $match->id)
            ->where('entries.data.0.game.name', '100%_Adventure')->missing('entries.data.0.user_id')
            ->where('counts.total', 3)->where('counts.playing', 2)->where('counts.backlog', 1)->where('counts.favorites', 2));
    }

    public function test_name_sort_and_pagination_preserve_filters(): void
    {
        $user = User::factory()->create();
        foreach (range(1, 25) as $number) {
            LibraryEntry::factory()->for($user)->for(Game::factory()->state(['name' => sprintf('Adventure %02d', $number)]))->create(['status' => 'backlog']);
        }
        $this->actingAs($user)->get(route('library.index', ['status' => 'backlog', 'sort' => 'name']))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('entries.data', 24)->where('entries.data.0.game.name', 'Adventure 01')->where('entries.meta.total', 25)
            ->where('entries.links.next', fn ($url) => str_contains($url, 'status=backlog') && str_contains($url, 'sort=name') && str_contains($url, 'page=2')));
    }

    public function test_dashboard_shows_only_the_owners_recent_entries_and_empty_counts(): void
    {
        $user = User::factory()->create();
        LibraryEntry::factory()->create();
        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->where('counts.total', 0)->where('counts.playing', 0)->where('counts.favorites', 0)->has('recentEntries', 0));

        $older = LibraryEntry::factory()->for($user)->create(['updated_at' => now()->subDays(2), 'status' => 'completed']);
        LibraryEntry::factory()->for($user)->count(6)->create(['status' => 'playing']);
        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->where('counts.total', 7)->where('counts.playing', 6)->where('counts.completed', 1)->has('recentEntries', 6)
            ->where('recentEntries', fn ($entries) => ! collect($entries)->pluck('id')->contains($older->id)));
    }

    public function test_filter_shapes_and_unknown_values_are_validated(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->get(route('library.index', ['status' => 'other', 'favorite' => 'yes', 'sort' => 'unsafe', 'q' => ['bad'], 'page' => -1]))
            ->assertSessionHasErrors(['status', 'favorite', 'sort', 'q', 'page']);
    }

    public function test_removal_requires_confirmation_and_cannot_remove_another_users_entry(): void
    {
        $entry = LibraryEntry::factory()->create();
        $this->actingAs($entry->user)->delete(route('library.destroy', $entry->game->slug))->assertSessionHasErrors('confirm');
        $this->assertModelExists($entry);
        $otherUser = User::factory()->create();
        $this->actingAs($otherUser)->delete(route('library.destroy', $entry->game->slug), ['confirm' => true])->assertNotFound();
        $this->assertModelExists($entry);
    }

    public function test_confirmed_removal_only_cascades_the_owners_game_history(): void
    {
        $entry = LibraryEntry::factory()->create();
        $other = LibraryEntry::factory()->for($entry->game)->create();
        $rating = Rating::factory()->for($entry)->create();
        $review = Review::factory()->for($entry)->create();
        $run = Playthrough::factory()->for($entry)->create();
        $diary = DiaryEntry::factory()->for($run)->create();

        $this->actingAs($entry->user)->delete(route('library.destroy', $entry->game->slug), ['confirm' => true])->assertRedirect(route('games.show', $entry->game->slug));

        foreach ([$entry, $rating, $review, $run, $diary] as $record) {
            $this->assertModelMissing($record);
        }
        $this->assertModelExists($other);
        $this->assertModelExists($entry->game);
    }

    public function test_unverified_users_still_require_verification_outside_local_development(): void
    {
        $user = User::factory()->unverified()->create();
        $game = Game::factory()->create();
        $this->actingAs($user)->get(route('library.index'))->assertRedirect(route('verification.notice'));
        $this->put(route('library.save', $game->slug), ['status' => 'playing', 'is_favorite' => true])->assertRedirect(route('verification.notice'));
        $this->assertDatabaseCount('library_entries', 0);
    }
}
