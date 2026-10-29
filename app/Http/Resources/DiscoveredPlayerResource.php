<?php

namespace App\Http\Resources;

use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

/** @mixin User */
class DiscoveredPlayerResource extends PublicPlayerResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'public_reviews_count' => (int) $this->getAttribute('public_reviews_count'),
            'top_games' => $this->profile->topGames->map(fn (Game $game) => Arr::only(
                (new GameResource($game))->resolve($request), ['id', 'name', 'slug', 'cover_url']
            ))->values(),
        ];
    }
}
