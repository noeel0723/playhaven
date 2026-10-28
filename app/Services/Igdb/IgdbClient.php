<?php

namespace App\Services\Igdb;

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

        $response = Http::acceptJson()->connectTimeout(5)->timeout(15)
            ->withHeaders(['Client-ID' => $clientId])->withToken($token)
            ->withBody($query, 'text/plain')
            ->post('https://api.igdb.com/v4/games');

        if ($response->status() === 401) {
            Cache::forget($cacheKey);
        }

        $games = $response->throw()->json();

        if (! is_array($games) || ! array_is_list($games)) {
            throw new RuntimeException('IGDB returned an invalid games response.');
        }

        return $games;
    }
}
