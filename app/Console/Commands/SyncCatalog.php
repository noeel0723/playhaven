<?php

namespace App\Console\Commands;

use App\Jobs\SyncRawgGames;
use App\Services\Rawg\CatalogSynchronizer;
use App\Services\Rawg\RawgRateLimited;
use Illuminate\Console\Command;
use Throwable;

class SyncCatalog extends Command
{
    protected $signature = 'catalog:sync {--page=1} {--pages=1} {--per-page=20} {--inline : Import metadata and descriptions immediately}';

    protected $description = 'Import RAWG games into the local catalog';

    public function handle(CatalogSynchronizer $synchronizer): int
    {
        $page = filter_var($this->option('page'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 1000000]]);
        $pages = filter_var($this->option('pages'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 20]]);
        $pageSize = filter_var($this->option('per-page'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 40]]);
        if ($page === false || $pages === false || $pageSize === false) {
            $this->error('Use a positive starting page, 1–20 pages, and 1–40 games per page.');

            return self::FAILURE;
        }
        if (! config('services.rawg.api_key')) {
            $this->error('Set RAWG_API_KEY in .env first.');

            return self::FAILURE;
        }
        try {
            for ($current = $page; $current < $page + $pages; $current++) {
                if (! $this->option('inline')) {
                    SyncRawgGames::dispatch($current, $pageSize);

                    continue;
                }
                $result = $this->paced(fn () => $synchronizer->syncPage($current, $pageSize));
                $this->info("Page {$current}: {$result['imported']} games stored. Fetching descriptions…");
                foreach ($result['ids'] as $id) {
                    $this->paced(fn () => $synchronizer->syncGame($id));
                }
                $this->info("Page {$current}: descriptions synchronized.");
                if ($result['ids'] === []) {
                    break;
                }
            }
        } catch (Throwable $exception) {
            // Client exceptions are sanitized; do not print HTTP URLs, bodies, or credentials.
            $this->error('RAWG catalog sync could not complete. Check credentials, quota, network, and upstream data before retrying.');

            return self::FAILURE;
        }
        if (! $this->option('inline')) {
            $this->info('RAWG catalog and detail synchronization queued. Run php artisan queue:work.');
        }

        return self::SUCCESS;
    }

    /**
     * @template T
     *
     * @param  callable(): T  $operation
     * @return T
     */
    private function paced(callable $operation): mixed
    {
        $attempts = 0;
        while (true) {
            try {
                return $operation();
            } catch (RawgRateLimited $exception) {
                if (++$attempts >= 4) {
                    throw $exception;
                }
                sleep(min(5, $exception->retryAfter));
            }
        }
    }
}
