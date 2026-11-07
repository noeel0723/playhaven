<?php

namespace App\Console\Commands;

use App\Jobs\SyncTheGamesDbGame;
use App\Services\TheGamesDb\CatalogSynchronizer;
use App\Services\TheGamesDb\TheGamesDbClient;
use Illuminate\Console\Command;
use Throwable;

class SyncCatalog extends Command
{
    protected $signature = 'catalog:sync {--ids= : Comma-separated TheGamesDB IDs} {--query= : Search title to import} {--page=1} {--inline : Import immediately instead of queueing}';

    protected $description = 'Import TheGamesDB games into the local catalog';

    public function handle(TheGamesDbClient $client, CatalogSynchronizer $synchronizer): int
    {
        $ids = trim((string) $this->option('ids'));
        $query = trim((string) $this->option('query'));
        $page = filter_var($this->option('page'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 1000]]);
        if (($ids === '') === ($query === '') || $page === false || ($ids !== '' && ! preg_match('/^[1-9][0-9]{0,9}(,[1-9][0-9]{0,9}){0,99}$/', $ids))) {
            $this->error('Choose --ids=53,432 or --query="Sonic" with a valid --page=1.');

            return self::FAILURE;
        }
        try {
            $gameIds = $ids !== '' ? array_map('intval', explode(',', $ids)) : array_column($client->search($query, $page)['games'], 'id');
            foreach (array_unique($gameIds) as $id) {
                if ($this->option('inline')) {
                    $synchronizer->syncGame($id);
                } else {
                    if (! config('services.thegamesdb.api_key')) {
                        throw new \RuntimeException('Missing credentials.');
                    }
                    SyncTheGamesDbGame::dispatch($id);
                }
            }
        } catch (Throwable) {
            $this->error('Catalog import stopped. Set THEGAMESDB_API_KEY and check allowance, connection, and provider data.');

            return self::FAILURE;
        }
        $this->info(count(array_unique($gameIds)).($this->option('inline') ? ' games imported.' : ' games queued. Run php artisan queue:work.'));

        return self::SUCCESS;
    }
}
