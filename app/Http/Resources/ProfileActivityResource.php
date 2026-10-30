<?php

namespace App\Http\Resources;

use App\Models\LibraryEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LibraryEntry */
class ProfileActivityResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'game' => (new GameResource($this->game))->resolve($request),
            'status' => $this->status?->value,
            'rating' => $this->rating?->stars,
            'has_review' => $this->review !== null,
            'occurred_at' => $this->getAttribute('activity_at'),
        ];
    }
}
