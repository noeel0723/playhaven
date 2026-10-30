<?php

namespace App\Http\Resources;

use App\Models\GameList;
use App\Models\GameListItem;
use App\Services\ProfilePhotos;
use App\Support\GameCoverUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GameList */
class GameListResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $profile = $this->user->profile;

        return ['id' => $this->id, 'name' => $this->name, 'slug' => $this->slug, 'description' => $this->description,
            'visibility' => $this->visibility->value, 'items_count' => (int) $this->getAttribute('items_count'),
            'preview_games' => $this->whenLoaded('previewItems', fn () => $this->previewItems->map(fn (GameListItem $item) => [
                'id' => $item->game->id, 'name' => $item->game->name, 'slug' => $item->game->slug, 'cover_url' => GameCoverUrl::forGame($item->game),
            ])->values()),
            'owner' => ['id' => $this->user->id, 'name' => $profile?->display_name ?: ($profile?->is_public && $profile->username ? $profile->username : $this->user->name), 'avatar_url' => ProfilePhotos::url($profile),
                'username' => $profile?->is_public ? $profile->username : null]];
    }
}
