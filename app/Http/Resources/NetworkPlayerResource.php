<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class NetworkPlayerResource extends PublicPlayerResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'public_reviews_count' => (int) $this->getAttribute('public_reviews_count'),
            'public_lists_count' => (int) $this->getAttribute('public_lists_count'),
        ];
    }
}
