<?php

namespace App\Http\Resources;

use App\Models\GameDiaryLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GameDiaryLog */
class GameDiaryLogResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'logged_on' => $this->logged_on->format('Y-m-d'),
            'status' => $this->status->value,
            'completed_on' => $this->completed_on?->format('Y-m-d'),
            'review_body' => $this->getAttribute('review_body'),
            'contains_spoilers' => (bool) $this->getAttribute('contains_spoilers'),
            'game' => (new GameResource($this->libraryEntry->game))->resolve($request),
            'rating' => $this->libraryEntry->rating?->stars,
        ];
    }
}
