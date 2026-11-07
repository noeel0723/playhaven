<?php

namespace Tests\Feature\Catalog;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameBannerTest extends TestCase
{
    use RefreshDatabase;

    public function test_game_details_use_validated_local_banner_then_cover_without_provider_calls(): void
    {
        Http::preventStrayRequests();
        $cover = 'https://cdn.thegamesdb.net/images/original/boxart/front/53.jpg';
        $banner = 'https://cdn.thegamesdb.net/images/original/fanart/53.jpg';
        $game = Game::factory()->create(['thegamesdb_id' => 53, 'cover_url' => $cover, 'banner_url' => $banner]);
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page->where('game.banner_url', $banner)->where('game.cover_url', $cover));
        foreach ([null, 'https://untrusted.test/banner.jpg', $banner.'?apikey=SECRET'] as $invalid) {
            $game->update(['banner_url' => $invalid]);
            $this->get(route('games.show', $game->slug))->assertDontSee('SECRET')->assertInertia(fn (Assert $page) => $page->where('game.banner_url', $cover));
        }
        $game->update(['cover_url' => null]);
        $this->get(route('games.show', $game->slug))->assertInertia(fn (Assert $page) => $page->where('game.banner_url', null));
        $this->get(route('games.index'))->assertInertia(fn (Assert $page) => $page->missing('games.data.0.banner_url'));
        Http::assertNothingSent();
    }
}
