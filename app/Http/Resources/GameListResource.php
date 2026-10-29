<?php

namespace App\Http\Resources;

use App\Models\GameList;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GameList */
class GameListResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'slug' => $this->slug, 'description' => $this->description,
            'visibility' => $this->visibility->value, 'items_count' => (int) $this->getAttribute('items_count'),
            'owner' => ['id' => $this->user->id, 'name' => $this->user->name]];
    }
}
