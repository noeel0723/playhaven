<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\Rawg\CatalogSynchronizer;
use App\Services\Rawg\RawgRateLimited;
use Illuminate\Console\Command;
use Throwable;

class EnrichCatalog extends Command
{
    protected $signature = 'catalog:enrich {--limit=50 : Maximum games with missing credits to update}';

    protected $description = 'Fill developer, publisher and website metadata for existing RAWG games';

    public function handle(CatalogSynchronizer $synchronizer): int
    {
        $limit = filter_var($this->option('limit'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 500]]);
        if ($limit === false) {
            $this->error('Choose a limit between 1 and 500.');

            return self::FAILURE;
        }
        $games = Game::whereNotNull('rawg_id')->whereNull('credits_synced_at')->orderBy('id')->limit($limit)->get();
        try {
            foreach ($games as $game) {
                $attempt = 0;
                while (true) {
                    try {
                        $synchronizer->syncGame($game->rawg_id);
                        break;
                    } catch (RawgRateLimited $exception) {
                        if ($exception->retryAfter > 5 || ++$attempt > 3) {
                            throw $exception;
                        }
                        sleep($exception->retryAfter);
                    }
                }
                if ($game->fresh()->credits_synced_at === null) {
                    throw new \RuntimeException('Stale details could not enrich this entry.');
                }
            }
        } catch (Throwable) {
            $this->error('Enrichment stopped. Saved player data is preserved; check RAWG credentials, quota, or connection and retry.');

            return self::FAILURE;
        }
        $this->info($games->count().' games enriched.');

        return self::SUCCESS;
    }
}
