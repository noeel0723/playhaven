<?php

namespace App\Http\Resources;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Review */
class PublicReviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'contains_spoilers' => $this->contains_spoilers,
            'updated_at' => $this->updated_at?->toISOString(),
            'author' => ['name' => $this->libraryEntry->user->name],
            'rating' => $this->libraryEntry->rating?->stars,
        ];
    }
}
