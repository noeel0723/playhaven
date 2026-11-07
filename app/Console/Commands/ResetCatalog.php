<?php

namespace App\Console\Commands;

use App\Services\CatalogReset;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetCatalog extends Command
{
    protected $signature = 'catalog:reset {--confirm= : Must be playhaven; removes games and game-linked history}';

    protected $description = 'Reset only the isolated local PlayHaven game catalog, preserving accounts and list definitions';

    public function handle(CatalogReset $reset): int
    {
        $connection = DB::connection();
        $valid = app()->environment('local') && $this->option('confirm') === 'playhaven'
            && $connection->getDriverName() === 'pgsql'
            && $connection->getDatabaseName() === 'playhaven'
            && $connection->getConfig('host') === '127.0.0.1'
            && (int) $connection->getConfig('port') === 5433;
        if ($valid) {
            $actual = DB::selectOne('SHOW data_directory')->data_directory;
            $valid = realpath($actual) === realpath(base_path('.local/postgres'));
        }
        if (! $valid) {
            $this->error('Reset refused: requires local PlayHaven PostgreSQL on 127.0.0.1:5433, the project data directory, and --confirm=playhaven.');

            return self::FAILURE;
        }
        $count = $reset->run()['games'];
        $this->info("Removed $count games and their linked game history. Accounts, profiles, follows and list definitions preserved.");

        return self::SUCCESS;
    }
}
