<?php

namespace App\Http\Resources;

use App\Models\Playthrough;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Playthrough */
class PlaythroughResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'status' => $this->status->value,
            'platform_id' => $this->platform_id,
            'platform' => $this->platform?->only(['id', 'name']),
            'started_on' => $this->started_on?->format('Y-m-d'),
            'finished_on' => $this->finished_on?->format('Y-m-d'),
            'sessions_count' => (int) $this->getAttribute('diary_entries_count'),
            'minutes_played' => (int) $this->getAttribute('diary_entries_sum_minutes_played'),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
