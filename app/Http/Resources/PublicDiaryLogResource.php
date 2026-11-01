<?php

namespace App\Http\Resources;

use App\Models\GameDiaryLog;
use App\Support\GameCoverUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GameDiaryLog */
class PublicDiaryLogResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $game = $this->libraryEntry->game;

        return [
            'id' => $this->id,
            'logged_on' => $this->logged_on->format('Y-m-d'),
            'status' => $this->status->value,
            'completed_on' => $this->completed_on?->format('Y-m-d'),
            'rating' => $this->libraryEntry->rating?->stars,
            'has_public_review' => (bool) $this->libraryEntry->review?->is_public,
            'game' => ['id' => $game->id, 'name' => $game->name, 'slug' => $game->slug, 'cover_url' => GameCoverUrl::forGame($game), 'released_on' => $game->released_on?->format('Y-m-d')],
        ];
    }
}
