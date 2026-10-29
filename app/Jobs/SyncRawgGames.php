<?php

namespace App\Jobs;

use App\Services\Rawg\CatalogSynchronizer;
use App\Services\Rawg\RawgRateLimited;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncRawgGames implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 10;

    public int $maxExceptions = 3;

    public int $timeout = 60;

    public int $uniqueFor = 1800;

    /** @var list<int> */
    public array $backoff = [5, 30, 120];

    public function __construct(public int $page, public int $pageSize) {}

    public function uniqueId(): string
    {
        return $this->page.':'.$this->pageSize;
    }

    public function handle(CatalogSynchronizer $synchronizer): void
    {
        try {
            $result = $synchronizer->syncPage($this->page, $this->pageSize);
            foreach ($result['ids'] as $id) {
                SyncRawgGameDetails::dispatch($id);
            }
        } catch (RawgRateLimited $exception) {
            $this->release($exception->retryAfter);
        }
    }
}
