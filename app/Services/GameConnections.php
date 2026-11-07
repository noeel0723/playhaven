<?php

namespace App\Services;

use App\Enums\GameConnectionType;
use App\Models\Game;
use App\Services\TheGamesDb\CatalogImage;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class GameConnections
{
    /** @return list<array<string, mixed>> */
    public function forGame(Game $game): array
    {
        $rows = $game->connections()->where('source', 'curated')
            ->orderByRaw('released_on ASC NULLS LAST')->orderBy('name')->orderBy('id')->get();
        $local = Game::whereIn('thegamesdb_id', $rows->pluck('related_thegamesdb_id'))->get()->keyBy('thegamesdb_id');

        return array_values($rows->map(function ($row) use ($local): array {
            $target = $local->get($row->related_thegamesdb_id);

            return ['id' => $row->id, 'thegamesdb_id' => $row->related_thegamesdb_id, 'name' => $target->name ?? $row->name,
                'released_on' => ($target->released_on ?? $row->released_on)?->format('Y-m-d'),
                'cover_url' => CatalogImage::url($target?->getAttribute('cover_url') ?? $row->cover_url),
                'local_slug' => $target?->slug, 'type' => $row->type->value, 'source' => $row->source,
                'note' => $row->note, 'source_url' => $row->source_url];
        })->all());
    }

    public function curate(Game $game, Game $related, ?GameConnectionType $type, ?string $note, ?string $url): void
    {
        if ($game->id === $related->id || ! $game->thegamesdb_id || ! $related->thegamesdb_id) {
            throw new InvalidArgumentException('Choose two different local games with TheGamesDB IDs.');
        }
        DB::transaction(function () use ($game, $related, $type, $note, $url): void {
            Game::whereIn('id', [$game->id, $related->id])->orderBy('id')->lockForUpdate()->get();
            $game->connections()->where('source', 'curated')->where('related_thegamesdb_id', $related->thegamesdb_id)->delete();
            $related->connections()->where('source', 'curated')->where('related_thegamesdb_id', $game->thegamesdb_id)->delete();
            if (! $type) {
                return;
            }
            foreach ([[$game, $related, $type], [$related, $game, $type->inverse()]] as [$source, $target, $kind]) {
                $source->connections()->create(['related_thegamesdb_id' => $target->thegamesdb_id, 'type' => $kind, 'source' => 'curated',
                    'name' => $target->name, 'released_on' => $target->released_on?->format('Y-m-d'),
                    'cover_url' => CatalogImage::url($target->getAttribute('cover_url')), 'note' => $note, 'source_url' => $url]);
            }
        });
    }
}
