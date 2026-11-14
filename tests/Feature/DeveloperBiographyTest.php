<?php

namespace Tests\Feature;

use App\Models\Developer;
use App\Models\Game;
use App\Services\Rawg\DeveloperSynchronizer;
use App\Services\Wikipedia\DeveloperBiography;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DeveloperBiographyTest extends TestCase
{
    use RefreshDatabase;

    private function studio(array $attributes = []): Developer
    {
        return Developer::create([...['rawg_id' => 10, 'name' => 'Rockstar Games', 'slug' => 'rockstar-games'], ...$attributes]);
    }

    private function wikipedia(array $overrides = []): array
    {
        return [...['type' => 'standard', 'namespace' => ['id' => 0], 'title' => 'Rockstar Games', 'pageid' => 358392, 'revision' => '1234567890',
            'description' => 'American video game publisher',
            'extract' => 'Rockstar Games is an American video game publisher based in New York City. The company develops and publishes video games through its studios.'], ...$overrides];
    }

    private function fake(array $rawg, array $wiki = [], int $rawgStatus = 200, int $wikiStatus = 200): void
    {
        config(['services.rawg.api_key' => 'test-key-never-visible']);
        Http::preventStrayRequests();
        Http::fake([
            'api.rawg.io/api/developers/10*' => Http::response($rawg, $rawgStatus),
            'en.wikipedia.org/api/rest_v1/page/summary/*' => Http::response($wiki ?: $this->wikipedia(), $wikiStatus),
        ]);
    }

    public function test_only_confirmed_empty_rawg_bio_uses_wikipedia_and_records_attribution(): void
    {
        $this->fake(['id' => 10, 'slug' => 'rockstar-games', 'description' => '<p>&nbsp; </p>', 'image_background' => 'https://media.rawg.io/media/developers/rockstar.jpg']);
        $studio = $this->studio(['details_synced_at' => now()]);
        $game = Game::factory()->create();
        $game->developers()->attach($studio);
        app(DeveloperSynchronizer::class)->sync($studio);
        $studio->refresh();
        $this->assertSame('wikipedia', $studio->description_source);
        $this->assertSame($this->wikipedia()['extract'], $studio->description);
        $this->assertSame(358392, $studio->wikipedia_page_id);
        $this->assertSame('1234567890', $studio->wikipedia_revision);
        $this->assertSame('https://en.wikipedia.org/wiki/Rockstar_Games', $studio->description_source_url);
        $this->assertSame(1, $studio->games()->count());
        $this->assertSame('rockstar-games', $studio->slug);
        $this->assertNotNull($studio->bio_fallback_checked_at);
        app(DeveloperSynchronizer::class)->sync($studio);
        Http::assertSentCount(2);
        Http::assertSent(fn ($request) => str_contains($request->url(), 'en.wikipedia.org') && ! isset($request['key']) && ! isset($request['apikey']));
        $this->get(route('developers.show', $studio->slug))->assertDontSee('test-key-never-visible')->assertInertia(fn (Assert $page) => $page
            ->where('developer.description_source', 'wikipedia')->where('developer.description_source_url', 'https://en.wikipedia.org/wiki/Rockstar_Games')
            ->missing('developer.wikipedia_page_id')->missing('developer.rawg_id'));
        Http::assertSentCount(2);
    }

    public function test_rawg_bio_takes_priority_over_wikipedia_and_never_calls_it(): void
    {
        $this->fake(['id' => 10, 'slug' => 'rockstar-games', 'description' => '<p>Official provider biography.</p>']);
        $studio = $this->studio(['description' => 'Saved Wikipedia summary', 'description_source' => 'wikipedia', 'details_synced_at' => now()->subDays(2)]);
        app(DeveloperSynchronizer::class)->sync($studio);
        $this->assertSame('Official provider biography.', $studio->fresh()->description);
        $this->assertSame('rawg', $studio->fresh()->description_source);
        $this->assertSame('https://rawg.io/developers/rockstar-games', $studio->fresh()->description_source_url);
        Http::assertSentCount(1);
    }

    public function test_rawg_errors_and_missing_description_fields_are_not_treated_as_empty_biographies(): void
    {
        $studio = $this->studio();
        $this->fake(['id' => 10, 'description' => ''], rawgStatus: 503);
        $this->artisan('catalog:developer', ['slug' => $studio->slug])->assertFailed();
        Http::assertSentCount(1);
        $this->assertNull($studio->fresh()->details_synced_at);
        Cache::flush();
        $this->fake(['id' => 10]);
        $this->artisan('catalog:developer', ['slug' => $studio->slug])->assertFailed();
        Http::assertSentCount(1);
        $this->assertNull($studio->fresh()->description);
    }

    public function test_ambiguous_parent_company_unrelated_and_changed_articles_are_rejected(): void
    {
        Http::preventStrayRequests();
        $client = app(DeveloperBiography::class);
        $cases = [
            ['Rockstar Games', $this->wikipedia(['type' => 'disambiguation'])],
            ['Konami Computer Entertainment Japan', $this->wikipedia(['title' => 'Konami', 'description' => 'Japanese video game company', 'extract' => 'Konami is a Japanese multinational video game developer and publisher. The company produces games for many different platforms around the world.'])],
            ['Rockstar Games', $this->wikipedia(['description' => 'American clothing company', 'extract' => 'Rockstar Games is a clothing company based in a large city. Its business makes and sells clothing to international retailers and customers.'])],
            ['Rockstar Games', $this->wikipedia(['namespace' => ['id' => 1]])],
        ];
        foreach ($cases as [$name,$payload]) {
            Cache::flush();
            Http::fake(['en.wikipedia.org/*' => Http::response($payload)]);
            $this->assertNull($client->find($name));
        }
        Cache::flush();
        Http::fake(['en.wikipedia.org/*' => Http::response($this->wikipedia())]);
        $this->assertNull($client->find('Rockstar Games', pageId: 999));
    }

    public function test_no_match_is_cached_and_saved_or_curated_biographies_are_not_erased(): void
    {
        $this->fake(['id' => 10, 'description' => null], wikiStatus: 404);
        $studio = $this->studio();
        app(DeveloperSynchronizer::class)->sync($studio);
        app(DeveloperSynchronizer::class)->sync($studio);
        $this->assertNull($studio->fresh()->description);
        $this->assertNotNull($studio->fresh()->bio_fallback_checked_at);
        Http::assertSentCount(2);
        Cache::flush();
        $this->fake(['id' => 10, 'description' => '']);
        $studio->update(['description' => 'Curated local biography', 'description_source' => null, 'details_synced_at' => now()->subDays(2)]);
        app(DeveloperSynchronizer::class)->sync($studio);
        $this->assertSame('Curated local biography', $studio->fresh()->description);
        Http::assertSentCount(1);
    }

    public function test_wikipedia_outage_preserves_previous_biography_and_can_be_retried(): void
    {
        $studio = $this->studio(['description' => 'Saved Wikipedia biography', 'description_source' => 'wikipedia', 'description_source_url' => 'https://en.wikipedia.org/wiki/Rockstar_Games', 'details_synced_at' => now()->subDays(2)]);
        $this->fake(['id' => 10, 'description' => ''], wikiStatus: 503);
        $this->artisan('catalog:developer', ['slug' => $studio->slug])->assertFailed();
        $this->assertSame('Saved Wikipedia biography', $studio->fresh()->description);
        $this->assertNull($studio->fresh()->bio_fallback_checked_at);
    }

    public function test_source_links_are_safe_and_extracts_are_plain_text(): void
    {
        foreach (['javascript:alert(1)', 'https://evil.test/wiki/Rockstar', 'https://user@en.wikipedia.org/wiki/Rockstar', 'https://en.wikipedia.org/wiki/Rockstar?key=SECRET', 'http://en.wikipedia.org/wiki/Rockstar'] as $url) {
            $this->assertNull(DeveloperBiography::sourceUrl($url, 'wikipedia'));
        }
        $this->assertSame('', DeveloperBiography::plainText('<p>&nbsp;</p>'));
        $this->assertSame("A & B\n\nNext paragraph.", DeveloperBiography::plainText('<p>A &amp; B</p><p>Next paragraph.</p>'));
    }

    public function test_force_rechecks_rawg_instead_of_reusing_a_saved_empty_response(): void
    {
        config(['services.rawg.api_key' => 'test-key-never-visible']);
        Http::preventStrayRequests();
        Http::fake([
            'api.rawg.io/*' => Http::sequence()->push(['id' => 10, 'description' => ''])->push(['id' => 10, 'slug' => 'rockstar-games', 'description' => 'A newly supplied RAWG biography.']),
            'en.wikipedia.org/*' => Http::response($this->wikipedia()),
        ]);
        $studio = $this->studio();
        app(DeveloperSynchronizer::class)->sync($studio);
        $this->travel(2)->seconds();
        $this->artisan('catalog:developer', ['slug' => $studio->slug, '--force' => true])->assertSuccessful();
        $this->assertSame('A newly supplied RAWG biography.', $studio->fresh()->description);
        $this->assertSame('rawg',$studio->fresh()->description_source);
        Http::assertSentCount(3);
    }
}
