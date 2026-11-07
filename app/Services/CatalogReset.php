<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class CatalogReset
{
    /** @return array{games: int} */
    public function run(): array
    {
        return DB::transaction(function (): array {
            $count = DB::table('games')->count();
            // These relations intentionally restrict ordinary game deletion.
            // Explicitly clear them only for the operator's full catalog reset.
            DB::table('library_entries')->delete();
            DB::table('game_list_items')->delete();
            DB::table('profile_game_favorites')->delete();
            // Remaining game foreign keys cascade into game details and edges,
            // never account profiles, follows, or list definitions.
            DB::table('games')->delete();
            foreach (['developers', 'publishers', 'genres', 'platforms'] as $table) {
                DB::table($table)->delete();
            }
            foreach (['jobs', 'failed_jobs'] as $table) {
                DB::table($table)->where(function ($query): void {
                    foreach (['SyncRawgGames', 'SyncRawgGameDetails', 'SyncIgdbGames', 'SyncTheGamesDbGame'] as $job) {
                        $query->orWhere('payload', 'like', '%'.$job.'%');
                    }
                })->delete();
            }
            foreach (['cache', 'cache_locks'] as $table) {
                DB::table($table)->where(function ($query): void {
                    foreach (['rawg.', 'igdb.', 'thegamesdb.', 'SyncRawg', 'SyncIgdb', 'SyncTheGamesDb'] as $prefix) {
                        $query->orWhere('key', 'like', '%'.$prefix.'%');
                    }
                })->delete();
            }

            return ['games' => $count];
        });
    }
}
