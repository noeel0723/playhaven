<?php

namespace App\Services\Rawg;

use App\Models\Developer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

class DeveloperSynchronizer
{
    public function __construct(private RawgClient $client) {}

    public function sync(Developer $developer): void
    {
        if (! $developer->rawg_id) {
            throw new RuntimeException('No RAWG developer ID is available.');
        }
        Cache::lock('rawg.developer-import.'.$developer->id, 30)->block(3, function () use ($developer): void {
            $developer->refresh();
            if ($developer->details_synced_at?->isAfter(now()->subDay())) {
                return;
            }
            $data = Validator::make($this->client->developer($developer->rawg_id), [
                'description' => ['sometimes', 'nullable', 'string', 'max:200000'],
                'image_background' => ['sometimes', 'nullable', 'string', 'max:2048'],
            ])->validate();
            $updates = ['details_synced_at' => now()];
            if (is_string($data['description'] ?? null) && trim($data['description']) !== '') {
                $updates['description'] = trim(html_entity_decode(strip_tags($data['description']), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            }
            if ($image = CatalogImage::url($data['image_background'] ?? null)) {
                $updates['image_url'] = $image;
            }
            $developer->update($updates);
        });
    }
}
