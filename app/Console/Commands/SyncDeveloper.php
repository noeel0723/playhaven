<?php

namespace App\Console\Commands;

use App\Models\Developer;
use App\Services\Rawg\DeveloperSynchronizer;
use Illuminate\Console\Command;
use Throwable;

class SyncDeveloper extends Command
{
    protected $signature = 'catalog:developer {slug : Local developer slug} {--force : Check RAWG and fallback biography again now}';

    protected $description = 'Fetch developer details from RAWG, using Wikipedia for missing biographies';

    public function handle(DeveloperSynchronizer $synchronizer): int
    {
        $developer = Developer::where('slug', $this->argument('slug'))->first();
        if (! $developer) {
            $this->error('Developer not found.');

            return self::FAILURE;
        }
        try {
            $synchronizer->sync($developer, (bool) $this->option('force'));
        } catch (Throwable) {
            $this->error('Could not update developer details. Check RAWG credentials and provider connections. Saved data was preserved.');

            return self::FAILURE;
        }
        $this->info('Developer details saved.');

        return self::SUCCESS;
    }
}
