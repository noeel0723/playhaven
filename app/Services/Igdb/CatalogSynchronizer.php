<?php

namespace App\Services\Igdb;

use App\Models\Game;
use App\Models\Genre;
use App\Models\Platform;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CatalogSynchronizer
{
    public function __construct(private IgdbClient $client) {}

    public function syncPage(int $offset, int $limit): int
    {
        if ($offset < 0 || $limit < 1 || $limit > 100) {
            throw new \InvalidArgumentException('Invalid IGDB page bounds.');
        }

        $query = 'fields id,name,slug,summary,storyline,first_release_date,cover.image_id,updated_at,'
            .'genres.id,genres.name,genres.slug,platforms.id,platforms.name,platforms.slug; '
            .'where version_parent = null; sort total_rating_count desc; '
            ."limit {$limit}; offset {$offset};";

        return $this->import($this->client->games($query));
    }

    /** @param list<array<string, mixed>> $games */
    public function import(array $games): int
    {
        $validated = Validator::make(['games' => $games], [
            'games' => ['present', 'array', 'list', 'max:100'],
            'games.*.id' => ['required', 'integer', 'min:1', 'distinct'],
            'games.*.name' => ['required', 'string', 'max:255'],
            'games.*.slug' => ['required', 'string', 'max:200'],
            'games.*.updated_at' => ['required', 'integer', 'min:1'],
            'games.*.summary' => ['nullable', 'string'],
            'games.*.storyline' => ['nullable', 'string'],
            'games.*.first_release_date' => ['nullable', 'integer', 'min:0'],
            'games.*.cover' => ['nullable', 'array'],
            'games.*.cover.image_id' => ['nullable', 'string', 'max:128', 'regex:/^[a-zA-Z0-9_]+$/'],
            'games.*.genres' => ['sometimes', 'array', 'list'],
            'games.*.genres.*.id' => ['required', 'integer', 'min:1'],
            'games.*.genres.*.name' => ['required', 'string', 'max:255'],
            'games.*.genres.*.slug' => ['required', 'string', 'max:200'],
            'games.*.platforms' => ['sometimes', 'array', 'list'],
            'games.*.platforms.*.id' => ['required', 'integer', 'min:1'],
            'games.*.platforms.*.name' => ['required', 'string', 'max:255'],
            'games.*.platforms.*.slug' => ['required', 'string', 'max:200'],
        ])->validate();

        return Cache::lock('igdb.catalog-import', 120)->block(5, function () use ($validated): int {
            return DB::transaction(function () use ($validated): int {
                $count = 0;
                foreach ($validated['games'] as $data) {
                    $game = Game::firstOrNew(['igdb_id' => $data['id']]);
                    $updatedAt = CarbonImmutable::createFromTimestampUTC($data['updated_at']);

                    if ($game->igdb_updated_at !== null && $game->igdb_updated_at->greaterThan($updatedAt)) {
                        continue;
                    }

                    $game->fill([
                        'name' => $data['name'],
                        'slug' => $this->slug($game, $data['slug'], $data['id']),
                        'summary' => $data['summary'] ?? null,
                        'storyline' => $data['storyline'] ?? null,
                        'released_on' => isset($data['first_release_date']) ? CarbonImmutable::createFromTimestampUTC($data['first_release_date'])->toDateString() : null,
                        'cover_image_id' => $data['cover']['image_id'] ?? null,
                        'igdb_updated_at' => $updatedAt,
                        'synced_at' => now(),
                    ])->save();

                    $game->genres()->sync($this->terms(Genre::class, $data['genres'] ?? []));
                    $game->platforms()->sync($this->terms(Platform::class, $data['platforms'] ?? []));
                    $count++;
                }

                return $count;
            });
        });
    }

    /**
     * @param  class-string<Genre|Platform>  $model
     * @param  list<array{id: int, name: string, slug: string}>  $terms
     * @return list<int>
     */
    private function terms(string $model, array $terms): array
    {
        $ids = [];
        foreach ($terms as $data) {
            $term = $model::firstOrNew(['igdb_id' => $data['id']]);
            $term->fill(['name' => $data['name'], 'slug' => $this->slug($term, $data['slug'], $data['id'])])->save();
            $ids[] = $term->id;
        }

        return array_values(array_unique($ids));
    }

    private function slug(Model $model, string $source, int $igdbId): string
    {
        $existing = $model->getAttribute('slug');
        if (is_string($existing) && $existing !== '') {
            return $existing;
        }

        $base = Str::slug($source) ?: 'game';
        $slug = $base;
        $suffix = 0;
        while ($model->newQuery()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$igdbId.($suffix === 0 ? '' : '-'.$suffix);
            $suffix++;
        }

        return $slug;
    }
}
