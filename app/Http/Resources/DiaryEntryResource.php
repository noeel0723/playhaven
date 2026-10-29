<?php

namespace App\Http\Resources;

use App\Models\DiaryEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;

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
            'catalog_game' => $this->when($request->routeIs('diary.index'), fn () => Arr::only((new GameResource($this->playthrough->libraryEntry->game))->resolve($request), ['id', 'name', 'slug', 'cover_url', 'released_on'])),
            'rating' => $this->when($request->routeIs('diary.index'), fn () => $this->playthrough->libraryEntry->rating?->stars),
            'is_favorite' => $this->when($request->routeIs('diary.index'), fn () => (bool) $this->playthrough->libraryEntry->is_favorite),
            'has_review' => $this->when($request->routeIs('diary.index'), fn () => $this->playthrough->libraryEntry->review !== null),
            'is_replay' => $this->when($request->routeIs('diary.index'), fn () => (bool) $this->playthrough->getAttribute('is_replay')),
            'session_page' => $this->when($request->routeIs('diary.index'), fn () => intdiv((int) $this->getAttribute('newer_session_count'), 20) + 1),
            'playthrough' => $this->whenLoaded('playthrough', fn () => [
                'id' => $this->playthrough->id,
                'label' => $this->playthrough->label,
                'game' => $this->playthrough->libraryEntry->game->only(['id', 'name', 'slug']),
            ]),
        ];
    }
}
