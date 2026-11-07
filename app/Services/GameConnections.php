<?php

namespace App\Services;

use App\Enums\GameConnectionType;
use App\Models\Game;
use App\Services\Rawg\CatalogImage;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class GameConnections
{
    /** @return list<array<string, mixed>> */
    public function forGame(Game $game): array
    {
        $rows = $game->connections()->orderByRaw("CASE WHEN source = 'curated' THEN 0 ELSE 1 END")
            ->orderByRaw('released_on ASC NULLS LAST')->orderBy('name')->orderBy('id')->get();
        $curatedIds = $rows->where('source', 'curated')->pluck('related_rawg_id')->all();
        $local = Game::whereIn('rawg_id', $rows->pluck('related_rawg_id'))->get()->keyBy('rawg_id');

        return array_values($rows->filter(fn ($row) => $row->source === 'curated' || ! in_array($row->related_rawg_id, $curatedIds, true))->map(function ($row) use ($local): array {
            $target = $local->get($row->related_rawg_id);

            return ['id' => $row->id, 'rawg_id' => $row->related_rawg_id, 'name' => $target->name ?? $row->name,
                'released_on' => ($target->released_on ?? $row->released_on)?->format('Y-m-d'),
                'cover_url' => CatalogImage::url($target?->getAttribute('cover_url') ?? $row->cover_url),
                'local_slug' => $target?->slug, 'type' => $row->type->value, 'source' => $row->source,
                'note' => $row->note, 'source_url' => $row->source_url];
        })->all());
    }

    public function curate(Game $game, Game $related, ?GameConnectionType $type, ?string $note, ?string $url): void
    {
        if ($game->id === $related->id || ! $game->rawg_id || ! $related->rawg_id) {
            throw new InvalidArgumentException('Choose two different local games with RAWG IDs.');
        }
        DB::transaction(function () use ($game, $related, $type, $note, $url): void {
            Game::whereIn('id', [$game->id, $related->id])->orderBy('id')->lockForUpdate()->get();
            $game->connections()->where('source', 'curated')->where('related_rawg_id', $related->rawg_id)->delete();
            $related->connections()->where('source', 'curated')->where('related_rawg_id', $game->rawg_id)->delete();
            if (! $type) {
                return;
            }
            foreach ([[$game, $related, $type], [$related, $game, $type->inverse()]] as [$source, $target, $kind]) {
                $source->connections()->create(['related_rawg_id' => $target->rawg_id, 'type' => $kind, 'source' => 'curated',
                    'name' => $target->name, 'released_on' => $target->released_on?->format('Y-m-d'),
                    'cover_url' => CatalogImage::url($target->getAttribute('cover_url')), 'note' => $note, 'source_url' => $url]);
            }
        });
    }
}
