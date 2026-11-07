<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameDiaryLog;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\CatalogReset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CatalogResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_reset_cascades_game_history_but_preserves_accounts_profiles_follows_and_list_definitions(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $profile = UserProfile::factory()->for($owner)->create(['avatar_path' => 'profile-photos/keep.webp', 'banner_path' => 'profile-banners/keep.webp']);
        $owner->following()->attach($other);
        $game = Game::factory()->create();
        $profile->topGames()->attach($game, ['position' => 1]);
        $entry = LibraryEntry::factory()->for($owner)->for($game)->create();
        Rating::factory()->for($entry)->create();
        Review::factory()->for($entry)->create();
        GameDiaryLog::create(['library_entry_id' => $entry->id, 'logged_on' => today(), 'status' => 'completed']);
        $list = GameList::factory()->for($owner)->create(['visibility' => 'private']);
        GameListItem::factory()->for($list)->for($game)->create();
        $before = [$owner->fresh()->getRawOriginal(), $profile->fresh()->getRawOriginal(), $list->fresh()->getRawOriginal()];
        DB::table('jobs')->insert(['queue' => 'default', 'payload' => '{"displayName":"App\\Jobs\\SyncRawgGames"}', 'attempts' => 0, 'available_at' => time(), 'created_at' => time()]);
        DB::table('jobs')->insert(['queue' => 'default', 'payload' => '{"displayName":"SomeUnrelatedJob"}', 'attempts' => 0, 'available_at' => time(), 'created_at' => time()]);
        $this->assertSame(['games' => 1], app(CatalogReset::class)->run());
        foreach (['games', 'library_entries', 'ratings', 'reviews', 'game_diary_logs', 'game_list_items', 'profile_game_favorites'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertSame($before, [$owner->fresh()->getRawOriginal(), $profile->fresh()->getRawOriginal(), $list->fresh()->getRawOriginal()]);
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('follows', 1);
        $this->assertDatabaseCount('jobs', 1);
        $this->assertDatabaseHas('jobs', ['payload' => '{"displayName":"SomeUnrelatedJob"}']);
    }
}
