<?php

namespace App\Http\Resources;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Review */
class ProfileReviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'contains_spoilers' => (bool) $this->contains_spoilers,
            'is_public' => (bool) $this->is_public,
            'updated_at' => $this->updated_at?->toISOString(),
            'rating' => $this->libraryEntry->rating?->stars,
            'game' => (new GameResource($this->libraryEntry->game))->resolve($request),
        ];
    }
}
