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
        $profile = $this->libraryEntry->user->profile;
        $username = $profile?->is_public ? $profile->username : null;

        return [
            'id' => $this->id,
            'body' => $this->body,
            'contains_spoilers' => $this->contains_spoilers,
            'updated_at' => $this->updated_at?->toISOString(),
            'author' => ['name' => $profile?->display_name ?: ($username ?: $this->libraryEntry->user->name), 'username' => $username],
            'rating' => $this->libraryEntry->rating?->stars,
        ];
    }
}
