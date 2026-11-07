<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\TheGamesDb\CatalogSynchronizer;
use Illuminate\Console\Command;
use Throwable;

class EnrichCatalog extends Command
{
    protected $signature = 'catalog:enrich {--limit=50}';

    protected $description = 'Refresh TheGamesDB metadata and artwork for local games';

    public function handle(CatalogSynchronizer $synchronizer): int
    {
        $limit = filter_var($this->option('limit'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 500]]);
        if ($limit === false) {
            $this->error('Choose a limit between 1 and 500.');

            return self::FAILURE;
        }
        try {
            $games = Game::whereNotNull('thegamesdb_id')->orderBy('details_synced_at')->orderBy('id')->limit($limit)->get();
            foreach ($games as $game) {
                $synchronizer->syncGame($game->thegamesdb_id, true);
            }
        } catch (Throwable) {
            $this->error('Refresh stopped. Check TheGamesDB credentials, allowance, or connection.');

            return self::FAILURE;
        }
        $this->info($games->count().' games refreshed.');

        return self::SUCCESS;
    }
}
