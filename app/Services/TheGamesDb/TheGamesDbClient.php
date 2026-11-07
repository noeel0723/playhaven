<?php

namespace App\Services\TheGamesDb;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use RuntimeException;
use Throwable;

class TheGamesDbClient
{
    private const FIELDS = 'overview,genres,publishers,last_updated';

    /** @return array{games: list<array<string, mixed>>, images: array<array-key, mixed>, has_next: bool} */
    public function search(string $query, int $page = 1): array
    {
        if (mb_strlen(trim($query)) < 2 || mb_strlen($query) > 100 || $page < 1 || $page > 1000) {
            throw new RuntimeException('Invalid catalog search.');
        }
        $response = $this->request('v1.1/Games/ByGameName', ['name' => trim($query), 'page' => $page, 'fields' => self::FIELDS, 'include' => 'boxart']);

        return ['games' => $this->games($response), 'images' => $response['include']['boxart']['data'] ?? [], 'has_next' => ! empty($response['pages']['next'])];
    }

    /** @return array<string, mixed> */
    public function game(int $id): array
    {
        if ($id < 1 || $id > 2147483647) {
            throw new RuntimeException('Invalid TheGamesDB game ID.');
        }
        $response = $this->request('v1/Games/ByGameID', ['id' => $id, 'fields' => self::FIELDS, 'include' => 'boxart'], 86400);
        foreach ($this->games($response) as $game) {
            if ((int) $game['id'] === $id) {
                return $game;
            }
        }
        throw new RuntimeException('TheGamesDB did not return the requested game.');
    }

    /** @return array<array-key, mixed> */
    public function images(int $id): array
    {
        $response = $this->request('v1/Games/Images', ['games_id' => $id, 'filter[type]' => 'boxart,fanart,banner,screenshot'], 86400);
        $images = $response['data']['images'][(string) $id] ?? [];
        if (! is_array($images)) {
            throw new RuntimeException('Invalid TheGamesDB images.');
        }

        return $images;
    }

    /** @return array<array-key, mixed> */
    public function terms(string $kind): array
    {
        $paths = ['genres' => 'Genres', 'platforms' => 'Platforms', 'developers' => 'Developers', 'publishers' => 'Publishers'];
        if (! isset($paths[$kind])) {
            throw new RuntimeException('Unsupported catalog dictionary.');
        }
        $data = $this->request('v1/'.$paths[$kind], [], 604800)['data'][$kind] ?? null;
        if (! is_array($data)) {
            throw new RuntimeException('Invalid TheGamesDB dictionary.');
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public function allowance(): array
    {
        return $this->request('v1/API/Limit', [], 0);
    }

    /** @param array<string, mixed> $response
     * @return list<array<string, mixed>>
     */
    private function games(array $response): array
    {
        $rows = $response['data']['games'] ?? null;
        if (! is_array($rows)) {
            throw new RuntimeException('Invalid TheGamesDB game response.');
        }
        $data = Validator::make(['games' => array_values($rows)], [
            'games' => ['array', 'max:100'], 'games.*' => ['array'],
            'games.*.id' => ['required', 'integer', 'between:1,2147483647'],
            'games.*.game_title' => ['required', 'string', 'max:255'],
            'games.*.release_date' => ['nullable', 'date_format:Y-m-d'],
            'games.*.overview' => ['nullable', 'string', 'max:200000'],
            'games.*.platform' => ['nullable', 'integer', 'min:1'],
            'games.*.genres' => ['sometimes', 'array', 'max:100'], 'games.*.genres.*' => ['integer', 'min:1'],
            'games.*.developers' => ['sometimes', 'array', 'max:100'], 'games.*.developers.*' => ['integer', 'min:1'],
            'games.*.publishers' => ['sometimes', 'array', 'max:100'], 'games.*.publishers.*' => ['integer', 'min:1'],
            'games.*.last_updated' => ['nullable', 'date'],
        ])->validate();

        return $data['games'];
    }

    /** @param array<string, mixed> $parameters
     * @return array<string, mixed>
     */
    private function request(string $path, array $parameters, int $ttl = 3600): array
    {
        $key = config('services.thegamesdb.api_key');
        if (! is_string($key) || trim($key) === '') {
            throw new RuntimeException('Set THEGAMESDB_API_KEY in .env first.');
        }
        $cacheKey = 'thegamesdb.'.hash('sha256', $key.$path.json_encode($parameters));
        $fetch = function () use ($key, $path, $parameters): array {
            return Cache::lock('thegamesdb.requests.'.hash('sha256', $key), 25)->block(10, function () use ($key, $path, $parameters): array {
                try {
                    $response = Http::acceptJson()->connectTimeout(5)->timeout(15)->withOptions(['allow_redirects' => false])
                        ->get('https://api.thegamesdb.net/'.$path, [...$parameters, 'apikey' => $key]);
                } catch (Throwable) {
                    throw new RuntimeException('TheGamesDB could not be reached. Please try again later.');
                }
                if (! $response->successful()) {
                    // Provider URLs and error bodies can contain the API key.
                    throw new RuntimeException('TheGamesDB request failed (HTTP '.$response->status().'). Check credentials and allowance.');
                }
                $data = $response->json();
                if (! is_array($data) || ! is_numeric($data['code'] ?? null) || (int) $data['code'] !== 200) {
                    throw new RuntimeException('TheGamesDB returned an invalid response.');
                }

                return $data;
            });
        };

        return $ttl === 0 ? $fetch() : Cache::remember($cacheKey, $ttl, $fetch);
    }
}
