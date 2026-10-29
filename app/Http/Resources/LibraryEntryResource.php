<?php

namespace App\Http\Resources;

use App\Models\LibraryEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LibraryEntry */
class LibraryEntryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'is_favorite' => $this->is_favorite,
            'updated_at' => $this->updated_at?->toISOString(),
            'game' => new GameResource($this->game),
        ];
    }
}
