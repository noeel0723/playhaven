<?php

namespace Tests\Feature\Catalog;

use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Services\Rawg\CatalogSynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameBannerTest extends TestCase
{
    use RefreshDatabase;

    private const COVER = 'https://media.rawg.io/media/games/cover.jpg';

    private const BANNER = 'https://media.rawg.io/media/screenshots/banner.jpg';

    private function payload(array $overrides = []): array
    {
        return array_replace(['id' => 900, 'name' => 'Banner Game', 'slug' => 'banner-game', 'updated' => '2026-01-01T12:00:00', 'background_image' => self::COVER, 'background_image_additional' => self::BANNER], $overrides);
    }

    public function test_detail_import_stores_banner_without_replacing_cover_or_player_history(): void
    {
        $sync = app(CatalogSynchronizer::class);
        $sync->import([$this->payload()], true);
        $game = Game::where('rawg_id', 900)->firstOrFail();
        $entry = LibraryEntry::factory()->for($game)->create();
        $rating = Rating::factory()->for($entry)->create(['score' => 9]);
        $this->assertSame(self::BANNER, $game->getAttribute('banner_url'));
        $this->assertSame(self::COVER, $game->getAttribute('cover_url'));
        $sync->import([$this->payload(['background_image_additional' => null, 'updated' => '2025-01-01T12:00:00'])], true);
        $this->assertSame(self::BANNER, $game->fresh()->getAttribute('banner_url'));
        $sync->import([$this->payload()]);
        $sync->import([array_diff_key($this->payload(), ['background_image_additional' => true])], true);
        $this->assertSame(self::BANNER, $game->fresh()->getAttribute('banner_url'));
        $this->assertDatabaseCount('games', 1);
        $this->assertModelExists($entry);
        $this->assertSame(9, $rating->fresh()->score);
    }

    public function test_game_details_prefer_banner_and_legacy_games_use_validated_cover_without_api_calls(): void
    {
        Http::preventStrayRequests();
        $game = Game::factory()->create(['rawg_id' => 900, 'cover_url' => self::COVER, 'banner_url' => self::BANNER]);
        $this->get(route('games.show', $game->slug))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('game.banner_url', self::BANNER)->where('game.cover_url', self::COVER));
        $game->update(['banner_url' => null]);
        $this->get(route('games.show', $game->slug))->assertOk()->assertInertia(fn (Assert $page) => $page->where('game.banner_url', self::COVER));
        $game->update(['cover_url' => null]);
        $this->get(route('games.show', $game->slug))->assertOk()->assertInertia(fn (Assert $page) => $page->where('game.banner_url', null));
        Http::assertNothingSent();
    }

    public function test_untrusted_banner_urls_are_filtered_on_import_and_output(): void
    {
        $sync = app(CatalogSynchronizer::class);
        foreach (['https://evil.example/banner.jpg', self::BANNER.'?key=never-render', 'javascript:alert(1)', 'https://media.rawg.io:443/media/banner.jpg'] as $url) {
            $sync->import([$this->payload(['background_image_additional' => $url])], true);
            $game = Game::where('rawg_id', 900)->firstOrFail();
            $this->assertNull($game->getAttribute('banner_url'));
            // Revalidate stored values too, including legacy/manual database writes.
            $game->update(['banner_url' => $url]);
            $this->get(route('games.show', $game->slug))->assertOk()->assertDontSee('never-render')->assertInertia(fn (Assert $page) => $page->where('game.banner_url', self::COVER));
        }
    }

    public function test_banner_is_detail_only_and_missing_additional_image_still_imports(): void
    {
        app(CatalogSynchronizer::class)->import([array_diff_key($this->payload(), ['background_image_additional' => true])], true);
        $game = Game::where('rawg_id', 900)->firstOrFail();
        $this->assertNull($game->getAttribute('banner_url'));
        $this->get(route('games.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->has('games.data', 1)->missing('games.data.0.banner_url'));
        $game->update(['rawg_id' => null, 'igdb_id' => 901, 'cover_image_id' => 'valid_cover']);
        $this->get(route('games.show', $game->slug))->assertOk()->assertInertia(fn (Assert $page) => $page->where('game.banner_url', 'https://images.igdb.com/igdb/image/upload/t_cover_big/valid_cover.jpg'));
    }
}
