<?php

namespace App\Jobs;

use App\Services\Igdb\CatalogSynchronizer;
use App\Services\Igdb\IgdbRateLimited;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncIgdbGames implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 10;

    public int $maxExceptions = 3;

    public int $timeout = 60;

    public int $uniqueFor = 1800;

    /** @var list<int> */
    public array $backoff = [5, 30, 120];

    public function __construct(public int $offset, public int $limit) {}

    public function uniqueId(): string
    {
        return $this->offset.':'.$this->limit;
    }

    public function handle(CatalogSynchronizer $synchronizer): void
    {
        try {
            $synchronizer->syncPage($this->offset, $this->limit);
        } catch (IgdbRateLimited) {
            $this->release(5);
        }
    }
}
