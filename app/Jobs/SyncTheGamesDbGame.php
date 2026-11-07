<?php

namespace App\Jobs;

use App\Services\TheGamesDb\CatalogSynchronizer;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncTheGamesDbGame implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public int $uniqueFor = 1800;

    /** @var list<int> */
    public array $backoff = [60, 300, 900];

    public function __construct(public int $gameId) {}

    public function uniqueId(): string
    {
        return (string) $this->gameId;
    }

    public function handle(CatalogSynchronizer $synchronizer): void
    {
        $synchronizer->syncGame($this->gameId);
    }
}
