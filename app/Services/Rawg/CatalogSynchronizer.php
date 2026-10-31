<?php

namespace App\Services\Rawg;

use App\Models\Developer;
use App\Models\Game;
use App\Models\Genre;
use App\Models\Platform;
use App\Models\Publisher;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CatalogSynchronizer
{
    public function __construct(private RawgClient $client) {}

    /** @return array{imported: int, ids: list<int>} */
    public function syncPage(int $page, int $pageSize): array
    {
        $games = $this->client->games($page, $pageSize);
        $count = $this->import($games);

        return ['imported' => $count, 'ids' => array_map(fn (array $game): int => (int) $game['id'], $games)];
    }

    public function syncGame(int $id): void
    {
        $game = Game::where('rawg_id', $id)->first();
        if ($game?->rawg_details_synced_at?->greaterThan(now()->subDay()) && $game->credits_synced_at !== null) {
            return;
        }
        $this->import([$this->client->game($id)], true);
    }

    /** @param list<array<string, mixed>> $games */
    public function import(array $games, bool $withDetails = false): int
    {
        $validated = Validator::make(['games' => $games], [
            'games' => ['present', 'array', 'list', 'max:40'],
            'games.*.id' => ['required', 'integer', 'min:1', 'distinct'],
            'games.*.name' => ['required', 'string', 'max:255'],
            'games.*.slug' => ['required', 'string', 'max:200'],
            'games.*.updated' => ['required', 'date'],
            'games.*.released' => ['nullable', 'date_format:Y-m-d'],
            'games.*.background_image' => ['nullable', 'string'],
            'games.*.background_image_additional' => ['nullable', 'string'],
            'games.*.description_raw' => ['nullable', 'string'],
            'games.*.description' => ['nullable', 'string'],
            'games.*.website' => ['nullable', 'string'],
            'games.*.developers' => ['nullable', 'array', 'list', 'max:100'],
            'games.*.developers.*.id' => ['required', 'integer', 'min:1'],
            'games.*.developers.*.name' => ['required', 'string', 'max:255'],
            'games.*.developers.*.slug' => ['required', 'string', 'max:200'],
            'games.*.publishers' => ['nullable', 'array', 'list', 'max:100'],
            'games.*.publishers.*.id' => ['required', 'integer', 'min:1'],
            'games.*.publishers.*.name' => ['required', 'string', 'max:255'],
            'games.*.publishers.*.slug' => ['required', 'string', 'max:200'],
            'games.*.genres' => ['nullable', 'array', 'list'],
            'games.*.genres.*.id' => ['required', 'integer', 'min:1'],
            'games.*.genres.*.name' => ['required', 'string', 'max:255'],
            'games.*.genres.*.slug' => ['required', 'string', 'max:200'],
            'games.*.platforms' => ['nullable', 'array', 'list'],
            'games.*.platforms.*.platform.id' => ['required', 'integer', 'min:1'],
            'games.*.platforms.*.platform.name' => ['required', 'string', 'max:255'],
            'games.*.platforms.*.platform.slug' => ['required', 'string', 'max:200'],
        ])->validate();

        return Cache::lock('rawg.catalog-import', 120)->block(5, function () use ($validated, $withDetails): int {
            return DB::transaction(function () use ($validated, $withDetails): int {
                $count = 0;
                foreach ($validated['games'] as $data) {
                    $game = Game::firstOrNew(['rawg_id' => $data['id']]);
                    $updatedAt = CarbonImmutable::parse($data['updated'], 'UTC');
                    if ($game->rawg_updated_at !== null && $game->rawg_updated_at->greaterThan($updatedAt)) {
                        continue;
                    }
                    if (! $withDetails && ($game->rawg_updated_at === null || $game->rawg_updated_at->lessThan($updatedAt))) {
                        $game->rawg_details_synced_at = null;
                        $this->client->forgetGame((int) $data['id']);
                    }
                    $game->fill([
                        'name' => $data['name'],
                        'slug' => $this->slug($game, $data['slug'], (int) $data['id']),
                        'released_on' => $data['released'] ?? null,
                        'cover_url' => CatalogImage::url($data['background_image'] ?? null),
                        'rawg_updated_at' => $updatedAt,
                        'synced_at' => now(),
                    ]);
                    if ($withDetails) {
                        if (array_key_exists('background_image_additional', $data)) {
                            $game->banner_url = CatalogImage::url($data['background_image_additional']);
                        }
                        $description = $data['description_raw'] ?? $data['description'] ?? null;
                        $game->summary = is_string($description) ? trim(html_entity_decode(strip_tags($description), ENT_QUOTES | ENT_HTML5, 'UTF-8')) : null;
                        $game->rawg_details_synced_at = now();
                        $game->credits_synced_at = now();
                        if (array_key_exists('website', $data)) {
                            $game->website_url = OfficialWebsite::url($data['website']);
                        }
                    }
                    $game->save();
                    $game->genres()->sync($this->terms(Genre::class, $data['genres'] ?? []));
                    $platforms = [];
                    foreach ($data['platforms'] ?? [] as $entry) {
                        $platforms[] = ['id' => (int) $entry['platform']['id'], 'name' => (string) $entry['platform']['name'], 'slug' => (string) $entry['platform']['slug']];
                    }
                    $game->platforms()->sync($this->terms(Platform::class, $platforms));
                    if ($withDetails && array_key_exists('developers', $data)) {
                        $game->developers()->sync($this->terms(Developer::class, $data['developers'] ?? []));
                    }
                    if ($withDetails && array_key_exists('publishers', $data)) {
                        $game->publishers()->sync($this->terms(Publisher::class, $data['publishers'] ?? []));
                    }
                    $count++;
                }

                return $count;
            });
        });
    }

    /**
     * @param  class-string<Genre|Platform|Developer|Publisher>  $model
     * @param  list<array{id: int, name: string, slug: string}>  $terms
     * @return list<int>
     */
    private function terms(string $model, array $terms): array
    {
        $ids = [];
        foreach ($terms as $data) {
            $term = $model::firstOrNew(['rawg_id' => $data['id']]);
            $term->fill(['name' => $data['name'], 'slug' => $this->slug($term, $data['slug'], $data['id'])])->save();
            $ids[] = $term->id;
        }

        return array_values(array_unique($ids));
    }

    private function slug(Model $model, string $source, int $id): string
    {
        $existing = $model->getAttribute('slug');
        if (is_string($existing) && $existing !== '') {
            return $existing;
        }
        $base = Str::slug($source) ?: 'game';
        $slug = $base;
        $suffix = 0;
        while ($model->newQuery()->where('slug', $slug)->exists()) {
            $slug = $base.'-rawg-'.$id.($suffix === 0 ? '' : '-'.$suffix);
            $suffix++;
        }

        return $slug;
    }
}
