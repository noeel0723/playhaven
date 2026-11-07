<?php

namespace App\Services\TheGamesDb;

use App\Models\Developer;
use App\Models\Game;
use App\Models\Genre;
use App\Models\Platform;
use App\Models\Publisher;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class CatalogSynchronizer
{
    public function __construct(private TheGamesDbClient $client) {}

    public function syncGame(int $id, bool $force = false): Game
    {
        return Cache::lock('thegamesdb.import.'.$id, 120)->block(10, function () use ($id, $force): Game {
            $existing = Game::where('thegamesdb_id', $id)->first();
            if (! $force && $existing?->details_synced_at?->isAfter(now()->subDay())) {
                return $existing;
            }
            $data = $this->client->game($id);
            $images = $this->client->images($id);
            $dictionaries = [];
            foreach (['genres', 'platforms', 'developers', 'publishers'] as $kind) {
                $ids = $kind === 'platforms' ? array_filter([$data['platform'] ?? null]) : ($data[$kind] ?? []);
                if ($ids !== []) {
                    $dictionaries[$kind] = $this->client->terms($kind);
                }
            }

            return DB::transaction(function () use ($id, $data, $images, $dictionaries): Game {
                $game = Game::firstOrNew(['thegamesdb_id' => $id]);
                if ($game->source_updated_at && ! empty($data['last_updated']) && $game->source_updated_at->isAfter(CarbonImmutable::parse($data['last_updated']))) {
                    return $game;
                }
                $game->fill([
                    'name' => trim($data['game_title']), 'slug' => $this->slug($game, $data['game_title'], $id),
                    'released_on' => $data['release_date'] ?? null,
                    'source_updated_at' => $data['last_updated'] ?? $game->source_updated_at,
                    'details_synced_at' => now(), 'credits_synced_at' => now(), 'synced_at' => now(),
                ]);
                if (array_key_exists('overview', $data)) {
                    $game->summary = trim(html_entity_decode(strip_tags($data['overview'] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?: null;
                }
                // Missing optional artwork must not wipe a previously saved image.
                $game->cover_url = CatalogImage::pick($images) ?? $game->getAttribute('cover_url');
                $game->banner_url = CatalogImage::pick($images, true) ?? $game->getAttribute('banner_url');
                $game->save();
                foreach (['genres' => Genre::class, 'platforms' => Platform::class, 'developers' => Developer::class, 'publishers' => Publisher::class] as $kind => $model) {
                    if ($kind !== 'platforms' && ! isset($data[$kind])) {
                        continue;
                    }
                    $externalIds = $kind === 'platforms' ? array_filter([$data['platform'] ?? null]) : ($data[$kind] ?? []);
                    $localIds = [];
                    foreach (array_unique($externalIds) as $externalId) {
                        $term = $dictionaries[$kind][(string) $externalId] ?? null;
                        if (! is_array($term) || ! is_string($term['name'] ?? null) || trim($term['name']) === '' || mb_strlen($term['name']) > 255) {
                            throw new RuntimeException('Missing or invalid TheGamesDB taxonomy entry.');
                        }
                        $record = $model::firstOrNew(['thegamesdb_id' => $externalId]);
                        $record->fill(['name' => trim($term['name']), 'slug' => $this->slug($record, $term['name'], (int) $externalId)])->save();
                        $localIds[] = $record->id;
                    }
                    $game->{$kind}()->sync($localIds);
                }

                return $game;
            });
        });
    }

    private function slug(Model $model, string $name, int $id): string
    {
        if ($model->exists) {
            return (string) $model->getAttribute('slug');
        }
        $base = Str::limit(Str::slug($name) ?: 'game', 150, '');
        $slug = $base;
        $suffix = 0;
        while ($model->newQuery()->where('slug', $slug)->exists()) {
            $slug = $base.'-tgdb-'.$id.($suffix++ ? '-'.$suffix : '');
        }

        return $slug;
    }
}
