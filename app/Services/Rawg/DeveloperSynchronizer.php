<?php

namespace App\Services\Rawg;

use App\Models\Developer;
use App\Services\Wikipedia\DeveloperBiography;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

class DeveloperSynchronizer
{
    public function __construct(private RawgClient $client, private DeveloperBiography $wikipedia) {}

    public function sync(Developer $developer, bool $force = false): void
    {
        if (! $developer->rawg_id) {
            throw new RuntimeException('No RAWG developer ID is available.');
        }
        Cache::lock('rawg.developer-import.'.$developer->id, 60)->block(3, function () use ($developer, $force): void {
            $developer->refresh();
            $savedBio = DeveloperBiography::plainText($developer->description);
            $fallbackFresh = $developer->bio_fallback_checked_at?->isAfter(now()->subDay()) ?? false;
            if (! $force && $developer->details_synced_at?->isAfter(now()->subDay()) && ($savedBio !== '' || $fallbackFresh)) {
                return;
            }
            $data = Validator::make($this->client->developer($developer->rawg_id, $force), [
                'description' => ['present', 'nullable', 'string', 'max:200000'],
                'image_background' => ['sometimes', 'nullable', 'string', 'max:2048'],
                'slug' => ['sometimes', 'string', 'max:200', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i'],
            ])->validate();
            $updates = ['details_synced_at' => now()];
            $rawgBio = DeveloperBiography::plainText($data['description']);
            if ($rawgBio !== '') {
                $updates['description'] = $rawgBio;
                $updates['description_source'] = 'rawg';
                $updates['description_source_url'] = isset($data['slug']) ? 'https://rawg.io/developers/'.$data['slug'] : null;
            } elseif (($savedBio === '' || $developer->description_source === 'wikipedia') && (! $fallbackFresh || $force)) {
                $biography = $this->wikipedia->find($developer->name, $developer->wikipedia_title, $developer->wikipedia_page_id, $force);
                $updates['bio_fallback_checked_at'] = now();
                if ($biography) {
                    $updates['description'] = $biography['text'];
                    $updates['description_source'] = 'wikipedia';
                    $updates['description_source_url'] = $biography['url'];
                    $updates['wikipedia_title'] = $biography['title'];
                    $updates['wikipedia_page_id'] = $biography['page_id'];
                    $updates['wikipedia_revision'] = $biography['revision'];
                }
            }
            if ($image = CatalogImage::url($data['image_background'] ?? null)) {
                $updates['image_url'] = $image;
            }
            $developer->update($updates);
        });
    }
}
