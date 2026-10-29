<?php

namespace App\Console\Commands;

use App\Services\Rawg\RawgClient;
use Illuminate\Console\Command;
use Throwable;

class CheckRawg extends Command
{
    protected $signature = 'rawg:check';

    protected $description = 'Verify the server-side RAWG API connection';

    public function handle(RawgClient $rawg): int
    {
        try {
            $rawg->games(1, 1);
        } catch (Throwable) {
            $this->error('RAWG connection failed. Check RAWG_API_KEY, account quota, and network access.');

            return self::FAILURE;
        }
        $this->info('RAWG connection successful.');

        return self::SUCCESS;
    }
}
