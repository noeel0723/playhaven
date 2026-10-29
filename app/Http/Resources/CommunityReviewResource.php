<?php

namespace App\Http\Resources;

use App\Models\Review;
use App\Services\ProfilePhotos;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Review */
class CommunityReviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $profile = $this->libraryEntry->user->profile;

        return [
            'id' => $this->id,
            'body' => $this->body,
            'contains_spoilers' => $this->contains_spoilers,
            'updated_at' => $this->updated_at?->toISOString(),
            'author' => ['username' => $profile->username, 'name' => $profile->display_name ?: $profile->username, 'avatar_url' => ProfilePhotos::url($profile)],
            'rating' => $this->libraryEntry->rating?->stars,
            'game' => (new GameResource($this->libraryEntry->game))->resolve($request),
        ];
    }
}
