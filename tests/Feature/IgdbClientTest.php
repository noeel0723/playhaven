<?php

namespace Tests\Feature;

use App\Services\Igdb\IgdbClient;
use App\Services\Igdb\IgdbRateLimited;
use Illuminate\Http\Client\Request;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class IgdbClientTest extends TestCase
{
    public function test_credentials_are_required_before_any_network_request(): void
    {
        config(['services.igdb.client_id' => null, 'services.igdb.client_secret' => null]);
        Http::preventStrayRequests();

        $this->expectException(RuntimeException::class);
        app(IgdbClient::class)->games('fields name; limit 1;');
    }

    public function test_it_authenticates_on_the_server_and_reuses_the_token(): void
    {
        config(['services.igdb.client_id' => 'test-client', 'services.igdb.client_secret' => 'test-secret']);
        Cache::flush();
        Http::preventStrayRequests();
        Http::fake([
            'id.twitch.tv/oauth2/token' => Http::response(['access_token' => 'test-token', 'expires_in' => 3600]),
            'api.igdb.com/v4/games' => Http::response([['id' => 1, 'name' => 'Test Game']]),
        ]);

        $client = app(IgdbClient::class);
        $this->assertSame('Test Game', $client->games('fields name; limit 1;')[0]['name']);
        $client->games('fields name; limit 1;');

        Http::assertSentCount(2);
        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://api.igdb.com/v4/games'
            && $request->hasHeader('Client-ID', 'test-client')
            && $request->hasHeader('Authorization', 'Bearer test-token')
            && $request->body() === 'fields name; limit 1;');
    }

    public function test_an_expired_token_is_discarded_for_the_next_request(): void
    {
        config(['services.igdb.client_id' => 'test-client', 'services.igdb.client_secret' => 'test-secret']);
        Cache::flush();
        Http::fake([
            'id.twitch.tv/oauth2/token' => Http::response(['access_token' => 'test-token', 'expires_in' => 3600]),
            'api.igdb.com/v4/games' => Http::response([], 401),
        ]);

        try {
            app(IgdbClient::class)->games('fields name; limit 1;');
            $this->fail('Expected an authentication exception.');
        } catch (RequestException) {
            $this->assertFalse(Cache::has('igdb.token.'.hash('sha256', 'test-clienttest-secret')));
        }
    }

    public function test_different_uncached_requests_are_paced_across_clients(): void
    {
        config(['services.igdb.client_id' => 'test-client', 'services.igdb.client_secret' => 'test-secret']);
        Cache::flush();
        Http::fake([
            'id.twitch.tv/oauth2/token' => Http::response(['access_token' => 'test-token', 'expires_in' => 3600]),
            'api.igdb.com/v4/games' => Http::response([['id' => 1]]),
        ]);
        app(IgdbClient::class)->games('fields id; limit 1;');
        try {
            app(IgdbClient::class)->games('fields id; limit 2;');
            $this->fail('Expected shared rate limiting.');
        } catch (IgdbRateLimited) {
            Http::assertSentCount(2);
        }
        $this->travel(1)->seconds();
        app(IgdbClient::class)->games('fields id; limit 2;');
        Http::assertSentCount(3);
    }

    public function test_upstream_rate_limits_are_not_cached_as_successful_results(): void
    {
        config(['services.igdb.client_id' => 'test-client', 'services.igdb.client_secret' => 'test-secret']);
        Cache::flush();
        Http::fake([
            'id.twitch.tv/oauth2/token' => Http::response(['access_token' => 'test-token', 'expires_in' => 3600]),
            'api.igdb.com/v4/games' => Http::sequence()->push([], 429)->push([['id' => 1]]),
        ]);
        try {
            app(IgdbClient::class)->games('fields id; limit 1;');
            $this->fail('Expected upstream rate limiting.');
        } catch (IgdbRateLimited) {
            $this->travel(6)->seconds();
            $this->assertSame([['id' => 1]], app(IgdbClient::class)->games('fields id; limit 1;'));
        }
    }
}
