<?php

namespace App\Console\Commands;

use App\Jobs\SyncIgdbGames;
use App\Services\Igdb\CatalogSynchronizer;
use App\Services\Igdb\IgdbRateLimited;
use Illuminate\Console\Command;
use Throwable;

class SyncCatalog extends Command
{
    protected $signature = 'catalog:sync {--pages=1} {--per-page=50} {--offset=0} {--inline : Import immediately instead of dispatching jobs}';

    protected $description = 'Import IGDB games into the local catalog';

    public function handle(CatalogSynchronizer $synchronizer): int
    {
        $pages = filter_var($this->option('pages'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 20]]);
        $limit = filter_var($this->option('per-page'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100]]);
        $offset = filter_var($this->option('offset'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 10000000]]);
        if ($pages === false || $limit === false || $offset === false) {
            $this->error('Use 1–20 pages, 1–100 games per page, and a nonnegative offset up to 10000000.');

            return self::FAILURE;
        }

        if (! config('services.igdb.client_id') || ! config('services.igdb.client_secret')) {
            $this->error('Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in .env first.');

            return self::FAILURE;
        }

        try {
            for ($page = 0; $page < $pages; $page++) {
                if ($this->option('inline')) {
                    $attempts = 0;
                    while (true) {
                        try {
                            $count = $synchronizer->syncPage($offset + $page * $limit, $limit);
                            $this->info('Page '.($page + 1).": {$count} games imported.");
                            break;
                        } catch (IgdbRateLimited $exception) {
                            if (++$attempts >= 3) {
                                throw $exception;
                            }
                            usleep(500000);
                        }
                    }
                } else {
                    SyncIgdbGames::dispatch($offset + $page * $limit, $limit);
                }
            }
        } catch (Throwable) {
            $this->error('Catalog sync could not complete. Check IGDB credentials, network, and upstream data before retrying.');

            return self::FAILURE;
        }

        if (! $this->option('inline')) {
            $this->info('Catalog sync queued. Run php artisan queue:work to process it.');
        }

        return self::SUCCESS;
    }
}
