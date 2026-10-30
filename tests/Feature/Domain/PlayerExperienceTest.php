<?php

namespace Tests\Feature\Domain;

use App\Enums\LibraryStatus;
use App\Enums\ListVisibility;
use App\Enums\PlaythroughStatus;
use App\Models\DiaryEntry;
use App\Models\Follow;
use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\Genre;
use App\Models\LibraryEntry;
use App\Models\Platform;
use App\Models\Playthrough;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PlayerExperienceTest extends TestCase
{
    use RefreshDatabase;

    public function test_one_library_entry_supports_replays_and_multiple_diary_sessions(): void
    {
        $entry = LibraryEntry::factory()->create(['status' => LibraryStatus::Completed]);
        $first = Playthrough::factory()->for($entry)->create(['status' => PlaythroughStatus::Completed]);
        $replay = Playthrough::factory()->for($entry)->create(['label' => 'New Game+']);
        DiaryEntry::factory()->for($replay)->count(2)->create(['logged_on' => '2026-02-01']);

        $this->assertSame(2, $entry->playthroughs()->count());
        $this->assertSame(2, $replay->diaryEntries()->count());
        $this->assertSame(2, $entry->user->playthroughs()->count());
        $this->assertSame(LibraryStatus::Completed, $entry->fresh()->status);
        $this->assertSame(PlaythroughStatus::Completed, $first->status);
        $this->assertSame(PlaythroughStatus::Playing, $replay->status);
    }

    public function test_a_user_cannot_add_the_same_game_to_the_library_twice(): void
    {
        $entry = LibraryEntry::factory()->create();
        $this->expectException(QueryException::class);
        LibraryEntry::factory()->create(['user_id' => $entry->user_id, 'game_id' => $entry->game_id]);
    }

    #[DataProvider('starRatings')]
    public function test_half_star_ratings_round_trip_exactly(float $stars, int $score): void
    {
        $rating = Rating::factory()->make()->setStars($stars);
        $rating->save();

        $this->assertSame($score, $rating->fresh()->score);
        $this->assertSame($stars, $rating->fresh()->stars);
    }

    public static function starRatings(): array
    {
        return array_map(fn (int $score): array => [$score / 2, $score], range(1, 10));
    }

    #[DataProvider('invalidStarRatings')]
    public function test_invalid_star_values_are_rejected(float $stars): void
    {
        $this->expectException(InvalidArgumentException::class);
        (new Rating)->setStars($stars);
    }

    public static function invalidStarRatings(): array
    {
        return [[0], [-0.5], [0.25], [4.75], [5.5], [NAN], [INF]];
    }

    #[DataProvider('invalidStoredValues')]
    public function test_database_constraints_reject_invalid_values(string $model, string $column, mixed $value): void
    {
        $record = $model::factory()->create();
        $this->expectException(QueryException::class);
        DB::table($record->getTable())->where('id', $record->id)->update([$column => $value]);
    }

    public static function invalidStoredValues(): array
    {
        return [
            'removed backlog status' => [LibraryEntry::class, 'status', 'backlog'],
            'unknown library status' => [LibraryEntry::class, 'status', 'wishlist'],
            'backlog is not a playthrough' => [Playthrough::class, 'status', 'backlog'],
            'zero rating' => [Rating::class, 'score', 0],
            'rating above maximum' => [Rating::class, 'score', 11],
            'fractional stored score' => [Rating::class, 'score', 1.5],
            'negative duration' => [DiaryEntry::class, 'minutes_played', -1],
            'invalid list position' => [GameListItem::class, 'position', 0],
            'unknown list visibility' => [GameList::class, 'visibility', 'hidden'],
            'empty review' => [Review::class, 'body', '   '],
            'reversed dates' => [Playthrough::class, 'finished_on', '2025-12-31'],
        ];
    }

    public function test_replays_do_not_multiply_a_players_rating_in_game_aggregates(): void
    {
        $game = Game::factory()->create();
        $entry = LibraryEntry::factory()->for($game)->create();
        Playthrough::factory()->for($entry)->count(3)->create();
        Rating::factory()->for($entry)->create(['score' => 8]);
        Rating::factory()->create(['library_entry_id' => LibraryEntry::factory()->for($game)->create()->id, 'score' => 10]);
        Review::factory()->for($entry)->create();

        $this->assertSame(2, $game->ratings()->count());
        $this->assertEquals(9, $game->ratings()->avg('score'));
        $this->assertSame(1, $game->reviews()->count());
        $this->assertSame(1, $entry->user->ratings()->count());
        $this->assertSame(1, $entry->user->reviews()->count());
    }

    #[DataProvider('singlePerLibraryModels')]
    public function test_a_library_entry_has_one_current_rating_and_review(string $model): void
    {
        $record = $model::factory()->create();
        $this->expectException(QueryException::class);
        $model::factory()->create(['library_entry_id' => $record->library_entry_id]);
    }

    public static function singlePerLibraryModels(): array
    {
        return [[Rating::class], [Review::class]];
    }

    public function test_deleting_a_player_removes_their_history_but_keeps_the_catalog(): void
    {
        $entry = LibraryEntry::factory()->create();
        $playthrough = Playthrough::factory()->for($entry)->create();
        DiaryEntry::factory()->for($playthrough)->create();
        Rating::factory()->for($entry)->create();
        Review::factory()->for($entry)->create();
        UserProfile::factory()->for($entry->user)->create();
        $list = GameList::factory()->for($entry->user)->create();
        GameListItem::factory()->for($list)->for($entry->game)->create();
        Follow::factory()->create(['follower_id' => $entry->user_id]);
        $entry->user->delete();

        foreach (['library_entries', 'playthroughs', 'diary_entries', 'ratings', 'reviews', 'user_profiles', 'game_lists', 'game_list_items', 'follows'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertDatabaseHas('games', ['id' => $entry->game_id]);
    }

    public function test_catalog_games_with_player_history_cannot_be_deleted(): void
    {
        $entry = LibraryEntry::factory()->create();
        $this->expectException(QueryException::class);
        $entry->game->delete();
    }

    public function test_catalog_metadata_supports_many_genres_and_platforms(): void
    {
        $game = Game::factory()->create();
        $game->genres()->attach(Genre::factory()->count(2)->create()->modelKeys());
        $platform = Platform::factory()->create();
        $game->platforms()->attach($platform);
        $run = Playthrough::factory()->create(['platform_id' => $platform->id]);

        $this->assertSame(2, $game->genres()->count());
        $this->assertTrue($platform->games->contains($game));
        $platform->delete();
        $this->assertNull($run->fresh()->platform_id);
        $this->assertSame(0, $game->platforms()->count());
    }

    public function test_profile_usernames_are_unique_regardless_of_letter_case(): void
    {
        UserProfile::factory()->create(['username' => 'PlayerOne']);
        $this->expectException(QueryException::class);
        UserProfile::factory()->create(['username' => 'playerone']);
    }

    public function test_a_user_has_only_one_profile(): void
    {
        $profile = UserProfile::factory()->create();
        $this->assertSame($profile->id, $profile->user->profile->id);
        $this->expectException(QueryException::class);
        UserProfile::factory()->create(['user_id' => $profile->user_id]);
    }

    public function test_lists_have_stable_order_and_slugs_scoped_to_their_owner(): void
    {
        $list = GameList::factory()->create(['slug' => 'favorites', 'visibility' => ListVisibility::Private]);
        GameList::factory()->create(['slug' => 'favorites']);
        $last = GameListItem::factory()->for($list)->create(['position' => 3]);
        $first = GameListItem::factory()->for($list)->create(['position' => 1]);
        $second = GameListItem::factory()->for($list)->create(['position' => 1]);

        $this->assertSame([$first->id, $second->id, $last->id], $list->items->modelKeys());
        $this->assertSame(ListVisibility::Private, $list->visibility);
        $this->assertSame(1, $list->user->gameLists()->count());
    }

    public function test_a_game_cannot_appear_twice_in_the_same_list(): void
    {
        $item = GameListItem::factory()->create();
        $this->expectException(QueryException::class);
        GameListItem::factory()->create(['game_list_id' => $item->game_list_id, 'game_id' => $item->game_id]);
    }

    public function test_list_slugs_cannot_repeat_for_the_same_owner(): void
    {
        $list = GameList::factory()->create();
        $this->expectException(QueryException::class);
        GameList::factory()->create(['user_id' => $list->user_id, 'slug' => $list->slug]);
    }

    public function test_games_used_only_in_lists_are_also_protected_from_deletion(): void
    {
        $item = GameListItem::factory()->create();
        $this->expectException(QueryException::class);
        $item->game->delete();
    }

    public function test_external_catalog_ids_cannot_be_duplicated(): void
    {
        Game::factory()->create(['igdb_id' => 123]);
        $this->expectException(QueryException::class);
        Game::factory()->create(['igdb_id' => 123]);
    }

    public function test_orphan_library_records_are_rejected(): void
    {
        $user = User::factory()->create();
        $this->expectException(QueryException::class);
        DB::table('library_entries')->insert(['user_id' => $user->id, 'game_id' => 999999, 'status' => null]);
    }

    public function test_follow_relationships_are_directional(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $alice->following()->attach($bob);

        $this->assertTrue($alice->following->contains($bob));
        $this->assertTrue($bob->followers->contains($alice));
        $this->assertSame(0, $bob->following()->count());
    }

    public function test_a_user_cannot_follow_themselves_even_with_a_raw_database_insert(): void
    {
        $user = User::factory()->create();
        $this->expectException(QueryException::class);
        DB::table('follows')->insert(['follower_id' => $user->id, 'followed_id' => $user->id]);
    }

    public function test_duplicate_follows_are_rejected(): void
    {
        $follow = Follow::factory()->create();
        $this->expectException(QueryException::class);
        Follow::factory()->create(['follower_id' => $follow->follower_id, 'followed_id' => $follow->followed_id]);
    }
}
