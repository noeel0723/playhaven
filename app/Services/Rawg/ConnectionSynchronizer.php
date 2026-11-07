<?php

namespace App\Services\Rawg;

use App\Models\Game;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

class ConnectionSynchronizer
{
    public function __construct(private RawgClient $client) {}

    public function canRefresh(Game $game): bool
    {
        return $game->rawg_id !== null &&
            (! $game->connections_synced_at || $game->connections_synced_at->lessThan(now()->subDay())) &&
            (! $game->connections_checked_at || $game->connections_checked_at->lessThan(now()->subMinutes(5)));
    }

    public function sync(Game $game): void
    {
        if (! $this->canRefresh($game->fresh())) {
            return;
        }
        Cache::lock('rawg.connections.'.$game->id, 90)->block(1, function () use ($game): void {
            $game->refresh();
            if (! $this->canRefresh($game)) {
                return;
            }
            $game->connections_checked_at = now();
            $game->save();
            $rows = [];
            $truncated = false;
            $deadline = microtime(true) + 20;
            foreach (['series' => 'game-series', 'addition' => 'additions', 'parent' => 'parent-games'] as $type => $endpoint) {
                $result = $this->fetch($game->rawg_id, $endpoint, $deadline);
                $data = Validator::make($result, [
                    'results' => ['present', 'array', 'max:40'],
                    'results.*.id' => ['required', 'integer', 'between:1,2147483647', 'distinct'],
                    'results.*.name' => ['required', 'string', 'max:255'],
                    'results.*.released' => ['nullable', 'date_format:Y-m-d'],
                    'results.*.background_image' => ['nullable', 'string'],
                ])->validate();
                foreach ($data['results'] as $related) {
                    if ((int) $related['id'] === $game->rawg_id) {
                        continue;
                    }
                    $rows[] = ['related_rawg_id' => (int) $related['id'], 'type' => $type, 'source' => 'rawg',
                        'name' => $related['name'], 'released_on' => $related['released'] ?? null,
                        'cover_url' => CatalogImage::url($related['background_image'] ?? null)];
                }
                $truncated = $truncated || $result['has_next'];
            }
            DB::transaction(function () use ($game, $rows, $truncated): void {
                $game->connections()->where('source', 'rawg')->delete();
                foreach ($rows as $row) {
                    $game->connections()->create($row);
                }
                $game->connections_synced_at = now();
                $game->connections_truncated = $truncated;
                $game->save();
            });
        });
    }

    /** @return array{results: list<array<string, mixed>>, has_next: bool} */
    private function fetch(int $id, string $endpoint, float $deadline): array
    {
        $attempt = 0;
        while (true) {
            if (microtime(true) > $deadline) {
                throw new RuntimeException('Relationship refresh time budget exceeded.');
            }
            try {
                return $this->client->related($id, $endpoint);
            } catch (RawgRateLimited $exception) {
                if ($exception->retryAfter > 2 || ++$attempt > 2) {
                    throw $exception;
                }
                usleep(1100000 * $exception->retryAfter);
            }
        }
    }
}
