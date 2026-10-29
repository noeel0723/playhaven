<?php

namespace App\Services\Rawg;

use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class RawgClient
{
    /** @return list<array<string, mixed>> */
    public function games(int $page, int $pageSize): array
    {
        if ($page < 1 || $pageSize < 1 || $pageSize > 40) {
            throw new InvalidArgumentException('Invalid RAWG page bounds.');
        }
        $data = $this->request('games', ['page' => $page, 'page_size' => $pageSize, 'ordering' => '-added'], 3600);
        $results = $data['results'] ?? null;
        if (! is_array($results) || ! array_is_list($results)) {
            throw new RuntimeException('RAWG returned an invalid game list.');
        }
        foreach ($results as $game) {
            if (! is_array($game)) {
                throw new RuntimeException('RAWG returned an invalid game record.');
            }
        }

        return $results;
    }

    /** @return array<string, mixed> */
    public function game(int $id): array
    {
        if ($id < 1) {
            throw new InvalidArgumentException('Invalid RAWG game ID.');
        }
        $data = $this->request('games/'.$id, [], 86400);
        if (($data['id'] ?? null) !== $id) {
            throw new RuntimeException('RAWG returned an unexpected game ID.');
        }

        return $data;
    }

    /** @return array{results: list<array<string, mixed>>, has_next: bool} */
    public function search(string $query, int $page = 1): array
    {
        $query = trim($query);
        if (mb_strlen($query) < 2 || mb_strlen($query) > 100 || $page < 1 || $page > 1000) {
            throw new InvalidArgumentException('Enter 2–100 characters and a valid RAWG page.');
        }
        $data = $this->request('games', ['search' => $query, 'page' => $page, 'page_size' => 12], 3600);
        $results = $data['results'] ?? null;
        if (! is_array($results) || ! array_is_list($results) || count($results) > 12) {
            throw new RuntimeException('RAWG returned an invalid search result.');
        }
        foreach ($results as $result) {
            if (! is_array($result)) {
                throw new RuntimeException('RAWG returned an invalid search record.');
            }
        }

        return ['results' => $results, 'has_next' => ! empty($data['next'])];
    }

    public function forgetGame(int $id): void
    {
        $key = config('services.rawg.api_key');
        if (! is_string($key) || trim($key) === '') {
            return;
        }
        Cache::forget($this->cacheKey('games/'.$id, []));
    }

    private function apiKey(): string
    {
        $key = config('services.rawg.api_key');
        if (! is_string($key) || trim($key) === '') {
            throw new RuntimeException('Set RAWG_API_KEY in .env first.');
        }

        return trim($key);
    }

    /** @param array<string, int|string> $parameters */
    private function cacheKey(string $path, array $parameters): string
    {
        return 'rawg.response.'.hash('sha256', $this->apiKey().$path.serialize($parameters));
    }

    /**
     * @param  array<string, int|string>  $parameters
     * @return array<string, mixed>
     */
    private function request(string $path, array $parameters, int $ttl): array
    {
        $apiKey = $this->apiKey();

        return Cache::remember($this->cacheKey($path, $parameters), $ttl, function () use ($apiKey, $path, $parameters): array {
            $paceKey = 'rawg.pacing.'.hash('sha256', $apiKey);
            try {
                return Cache::lock($paceKey.'.lock', 25)->block(5, function () use ($apiKey, $path, $parameters, $paceKey): array {
                    $now = now()->getTimestampMs();
                    $availableAt = Cache::get($paceKey, 0);
                    if (is_numeric($availableAt) && $availableAt > $now) {
                        throw new RawgRateLimited(max(1, (int) ceil(($availableAt - $now) / 1000)));
                    }
                    // A conservative local policy: serialize requests and start at most once a second.
                    Cache::put($paceKey, $now + 1000, now()->addMinutes(5));
                    try {
                        $response = Http::acceptJson()->connectTimeout(5)->timeout(15)
                            ->withOptions(['allow_redirects' => false])
                            ->get('https://api.rawg.io/api/'.$path, [...$parameters, 'key' => $apiKey]);
                    } catch (Throwable) {
                        // Never propagate a URL-bearing HTTP exception: RAWG puts its key in the query.
                        throw new RuntimeException('RAWG could not be reached. Check network access and try again.');
                    }
                    if ($response->status() === 429) {
                        $retryAfter = min(300, max(1, (int) ($response->header('Retry-After') ?: '5')));
                        Cache::put($paceKey, now()->addSeconds($retryAfter)->getTimestampMs(), now()->addMinutes(5));
                        throw new RawgRateLimited($retryAfter);
                    }
                    if (! $response->successful()) {
                        throw new RuntimeException('RAWG request failed (HTTP '.$response->status().'). Check the API key and account quota.');
                    }
                    $data = $response->json();
                    if (! is_array($data) || array_is_list($data)) {
                        throw new RuntimeException('RAWG returned an invalid response.');
                    }

                    return $data;
                });
            } catch (LockTimeoutException) {
                throw new RawgRateLimited(2);
            }
        });
    }
}
