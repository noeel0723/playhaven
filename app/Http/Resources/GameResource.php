<?php

namespace App\Http\Resources;

use App\Models\Game;
use App\Services\Rawg\OfficialWebsite;
use App\Support\GameCoverUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Game */
class GameResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $score = $this->getAttribute('ratings_avg_score');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'released_on' => $this->released_on?->format('Y-m-d'),
            'cover_url' => GameCoverUrl::forGame($this->resource),
            'genres' => $this->genres->map->only(['id', 'name', 'slug'])->values(),
            'platforms' => $this->platforms->map->only(['id', 'name', 'slug'])->values(),
            'rating' => is_numeric($score) ? round((float) $score / 2, 1) : null,
            'ratings_count' => (int) $this->getAttribute('ratings_count'),
            'players_count' => (int) $this->getAttribute('players_count'),
            'summary' => $this->when($request->routeIs('games.show'), $this->summary),
            'storyline' => $this->when($request->routeIs('games.show'), $this->storyline),
            'developers' => $this->when($request->routeIs('games.index', 'games.show'), fn () => $this->developers->map->only(['id', 'name', 'slug'])->values()),
            'publishers' => $this->when($request->routeIs('games.show'), fn () => $this->publishers->map->only(['id', 'name', 'slug'])->values()),
            'official_website' => $this->when($request->routeIs('games.show'), fn () => OfficialWebsite::url($this->getAttribute('website_url'))),
        ];
    }
}
