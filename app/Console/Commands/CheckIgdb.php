<?php

namespace App\Console\Commands;

use App\Services\Igdb\IgdbClient;
use Illuminate\Console\Command;
use Throwable;

class CheckIgdb extends Command
{
    protected $signature = 'igdb:check';

    protected $description = 'Verify the server-side Twitch / IGDB connection';

    public function handle(IgdbClient $igdb): int
    {
        try {
            $igdb->games('fields id,name; limit 1;');
        } catch (Throwable) {
            // OAuth exception bodies may contain sensitive information.
            $this->error('IGDB connection failed. Check credentials in .env and network access.');

            return self::FAILURE;
        }

        $this->info('IGDB connection successful.');

        return self::SUCCESS;
    }
}
