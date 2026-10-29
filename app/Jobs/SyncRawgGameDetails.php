<?php

namespace App\Jobs;

use App\Services\Rawg\CatalogSynchronizer;
use App\Services\Rawg\RawgRateLimited;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncRawgGameDetails implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 10;

    public int $maxExceptions = 3;

    public int $timeout = 60;

    public int $uniqueFor = 1800;

    /** @var list<int> */
    public array $backoff = [5, 30, 120];

    public function __construct(public int $rawgId) {}

    public function uniqueId(): string
    {
        return (string) $this->rawgId;
    }

    public function handle(CatalogSynchronizer $synchronizer): void
    {
        try {
            $synchronizer->syncGame($this->rawgId);
        } catch (RawgRateLimited $exception) {
            $this->release($exception->retryAfter);
        }
    }
}
