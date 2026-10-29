<?php

namespace App\Http\Resources;

use App\Models\LibraryEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LibraryEntry */
class CompletedGameResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'game' => (new GameResource($this->game))->resolve($request),
            'rating' => $this->rating?->stars,
            'completed_at' => $this->completed_at?->toISOString(),
        ];
    }
}
