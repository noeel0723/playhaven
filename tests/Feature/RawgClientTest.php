<?php

namespace Tests\Feature;

use App\Services\Rawg\RawgClient;
use App\Services\Rawg\RawgRateLimited;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class RawgClientTest extends TestCase
{
    public function test_a_key_is_required_before_any_network_call(): void
    {
        config(['services.rawg.api_key' => null]);
        Http::preventStrayRequests();
        $this->expectException(RuntimeException::class);
        app(RawgClient::class)->games(1, 20);
    }

    public function test_key_is_sent_only_to_rawg_and_successes_are_cached(): void
    {
        config(['services.rawg.api_key' => 'test-key']);
        Http::preventStrayRequests();
        Http::fake(['api.rawg.io/api/games?*' => Http::response(['results' => [['id' => 1]]])]);
        $client = app(RawgClient::class);
        $this->assertSame([['id' => 1]], $client->games(1, 20));
        $client->games(1, 20);
        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) => str_starts_with($request->url(), 'https://api.rawg.io/api/games?') && $request['key'] === 'test-key');
    }

    public function test_uncached_requests_are_paced_across_instances(): void
    {
        config(['services.rawg.api_key' => 'test-key']);
        Http::fake(['api.rawg.io/api/*' => Http::response(['results' => []])]);
        app(RawgClient::class)->games(1, 20);
        try {
            app(RawgClient::class)->games(2, 20);
            $this->fail('Expected request pacing.');
        } catch (RawgRateLimited) {
            Http::assertSentCount(1);
        }
        $this->travel(2)->seconds();
        app(RawgClient::class)->games(2, 20);
        Http::assertSentCount(2);
    }

    public function test_upstream_cooldown_is_respected_and_errors_are_not_cached(): void
    {
        config(['services.rawg.api_key' => 'test-key']);
        Http::fake(['api.rawg.io/api/*' => Http::sequence()->push([], 429, ['Retry-After' => '5'])->push(['results' => [['id' => 1]]])]);
        try {
            app(RawgClient::class)->games(1, 20);
            $this->fail('Expected upstream rate limiting.');
        } catch (RawgRateLimited $exception) {
            $this->assertSame(5, $exception->retryAfter);
        }
        $this->travel(6)->seconds();
        $this->assertSame([['id' => 1]], app(RawgClient::class)->games(1, 20));
    }

    public function test_authentication_errors_do_not_expose_credentials_or_response_bodies(): void
    {
        config(['services.rawg.api_key' => 'test-secret-never-print']);
        Http::fake(['api.rawg.io/api/*' => Http::response(['error' => 'test-secret-never-print'], 401)]);
        try {
            app(RawgClient::class)->games(1, 20);
            $this->fail('Expected sanitized error.');
        } catch (RuntimeException $exception) {
            $this->assertStringNotContainsString('test-secret-never-print', (string) $exception);
            $this->assertStringContainsString('HTTP 401', $exception->getMessage());
        }
    }

    public function test_connection_errors_cannot_leak_the_query_string_key(): void
    {
        config(['services.rawg.api_key' => 'test-secret-never-print']);
        Http::fake(fn () => throw new RuntimeException('https://api.rawg.io?key=test-secret-never-print'));
        try {
            app(RawgClient::class)->games(1, 20);
            $this->fail('Expected sanitized connection failure.');
        } catch (RuntimeException $exception) {
            $this->assertStringNotContainsString('test-secret-never-print', (string) $exception);
            $this->assertNull($exception->getPrevious());
        }
    }

    public function test_details_must_match_the_requested_id(): void
    {
        config(['services.rawg.api_key' => 'test-key']);
        Http::fake(['api.rawg.io/api/*' => Http::response(['id' => 2])]);
        $this->expectException(RuntimeException::class);
        app(RawgClient::class)->game(1);
    }
}
