<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\ProfilePhotos;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class PublicPlayerResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'username' => $this->profile->username,
            'name' => $this->profile->display_name ?: $this->profile->username,
            'bio' => $this->profile->bio,
            'avatar_url' => ProfilePhotos::url($this->profile),
            'followers_count' => (int) $this->getAttribute('followers_count'),
            'following_count' => (int) $this->getAttribute('following_count'),
            'is_following' => (bool) $this->getAttribute('is_following'),
            'is_self' => $request->user()?->id === $this->id,
        ];
    }
}
