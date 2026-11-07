<?php

namespace App\Console\Commands;

use App\Services\TheGamesDb\TheGamesDbClient;
use Illuminate\Console\Command;
use Throwable;

class CheckTheGamesDb extends Command
{
    protected $signature = 'thegamesdb:check';

    protected $description = 'Verify the server-side TheGamesDB API key and connection';

    public function handle(TheGamesDbClient $client): int
    {
        try {
            $client->allowance();
        } catch (Throwable) {
            $this->error('TheGamesDB connection failed. Set THEGAMESDB_API_KEY in .env and check API allowance and network access.');

            return self::FAILURE;
        }
        $this->info('TheGamesDB connection successful.');

        return self::SUCCESS;
    }
}
