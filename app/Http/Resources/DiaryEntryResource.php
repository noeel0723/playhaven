<?php

namespace App\Http\Resources;

use App\Models\DiaryEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DiaryEntry */
class DiaryEntryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'logged_on' => $this->logged_on->format('Y-m-d'),
            'minutes_played' => $this->minutes_played,
            'notes' => $this->notes,
            'updated_at' => $this->updated_at?->toISOString(),
            'playthrough' => $this->whenLoaded('playthrough', fn () => [
                'id' => $this->playthrough->id,
                'label' => $this->playthrough->label,
                'game' => $this->playthrough->libraryEntry->game->only(['id', 'name', 'slug']),
            ]),
        ];
    }
}
