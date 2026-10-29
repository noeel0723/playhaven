<?php

namespace App\Http\Resources;

use App\Models\GameListItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GameListItem */
class GameListItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'position' => $this->position, 'notes' => $this->notes, 'game' => new GameResource($this->game)];
    }
}
