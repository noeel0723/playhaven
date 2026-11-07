<?php

namespace App\Services\Igdb;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class IgdbClient
{
    /**
     * Run a developer-defined IGDB query. Do not pass raw user input here.
     *
     * @return list<array<string, mixed>>
     */
    public function games(string $query): array
    {
        $clientId = config('services.igdb.client_id');
        $clientSecret = config('services.igdb.client_secret');

        if (! is_string($clientId) || $clientId === '' || ! is_string($clientSecret) || $clientSecret === '') {
            throw new RuntimeException('Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in .env first.');
        }

        return Cache::remember(
            'igdb.games.'.hash('sha256', $clientId.$clientSecret.$query),
            now()->addHour(),
            fn (): array => $this->requestGames($query, $clientId, $clientSecret),
        );
    }

    /** @return list<array<string, mixed>> */
    private function requestGames(string $query, string $clientId, string $clientSecret): array
    {
        $cacheKey = 'igdb.token.'.hash('sha256', $clientId.$clientSecret);
        $token = Cache::get($cacheKey);

        if (! is_string($token)) {
            $response = Http::asForm()->acceptJson()->connectTimeout(5)->timeout(15)
                ->post('https://id.twitch.tv/oauth2/token', [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'grant_type' => 'client_credentials',
                ])->throw();

            $token = $response->json('access_token');
            $expiresIn = $response->json('expires_in');

            if (! is_string($token) || $token === '' || ! is_int($expiresIn) || $expiresIn <= 0) {
                throw new RuntimeException('Twitch returned an invalid access token response.');
            }

            Cache::put($cacheKey, $token, max(1, $expiresIn - 60));
        }

        // Reserve a shared request slot across workers; cached responses use no slot.
        $requestKey = 'igdb.requests.'.hash('sha256', $clientId);
        $response = Cache::lock($requestKey.'.lock', 25)->block(5, function () use ($requestKey, $clientId, $token, $query): Response {
            $nextRequestAt = Cache::get($requestKey, 0);
            $now = now()->getTimestampMs();

            if (is_numeric($nextRequestAt) && $nextRequestAt > $now) {
                throw new IgdbRateLimited('Wait before making another IGDB request.');
            }

            Cache::put($requestKey, $now + 350, now()->addMinute());

            $response = Http::acceptJson()->connectTimeout(5)->timeout(15)
                ->withHeaders(['Client-ID' => $clientId])->withToken($token)
                ->withBody($query, 'text/plain')
                ->post('https://api.igdb.com/v4/games');

            if ($response->status() === 429) {
                Cache::put($requestKey, now()->addSeconds(5)->getTimestampMs(), now()->addMinute());
                throw new IgdbRateLimited('IGDB is temporarily rate limited.');
            }

            return $response;
        });

        if ($response->status() === 401) {
            Cache::forget($cacheKey);
        }

        $games = $response->throw()->json();

        if (! is_array($games) || ! array_is_list($games)) {
            throw new RuntimeException('IGDB returned an invalid games response.');
        }

        foreach ($games as $game) {
            if (! is_array($game)) {
                throw new RuntimeException('IGDB returned an invalid game record.');
            }
        }

        return $games;
    }
}
