<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_is_public_with_an_empty_catalog_and_never_calls_a_provider(): void
    {
        Http::preventStrayRequests();
        config(['services.rawg.api_key' => 'home-secret-never-render']);
        $this->get(route('home'))->assertOk()->assertDontSee('home-secret-never-render')->assertInertia(fn (Assert $page) => $page
            ->component('welcome')->has('featuredGames', 0)->where('featuredWorld', null)->where('catalogCount', 0));
        Http::assertNothingSent();
    }

    public function test_home_uses_six_local_games_and_prefers_the_red_dead_feature_without_duplicate_entries(): void
    {
        Http::preventStrayRequests();
        $hero = Game::factory()->create(['name' => 'Red Dead Redemption 2', 'slug' => 'red-dead-redemption-2']);
        $rated = Game::factory()->create();
        Rating::factory()->for(LibraryEntry::factory()->for($rated)->create())->create(['score' => 9]);
        Game::factory()->count(7)->create();
        $this->get(route('home'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('catalogCount', 9)->has('featuredGames', 6)->where('featuredGames.0.id', $hero->id)
            ->where('featuredGames.1.id', $rated->id)->where('featuredGames.1.rating', 4.5)
            ->where('featuredWorld', ['name' => $hero->name, 'slug' => $hero->slug])
            ->where('featuredGames', fn ($games) => collect($games)->pluck('id')->unique()->count() === 6));
        Http::assertNothingSent();
    }

    public function test_featured_resources_do_not_expose_provider_secrets_or_private_review_data(): void
    {
        $other = User::factory()->create();
        $game = Game::factory()->create(['rawg_id' => 28, 'slug' => 'red-dead-redemption-2', 'cover_url' => 'https://untrusted.example/image.jpg']);
        $entry = LibraryEntry::factory()->for($game)->for($other)->create();
        Review::factory()->for($entry)->create(['body' => 'PRIVATE HOME REVIEW BODY', 'is_public' => false]);
        $this->get('/')->assertOk()->assertDontSee($other->email)->assertDontSee('PRIVATE HOME REVIEW BODY')
            ->assertInertia(fn (Assert $page) => $page->where('featuredGames.0.cover_url', null)
                ->missing('featuredGames.0.rawg_id')->missing('featuredGames.0.library_entries')->missing('featuredGames.0.summary')->missing('featuredWorld.rawg_id'));
    }

    public function test_signed_in_users_can_still_open_home_without_changing_library_data(): void
    {
        $user = User::factory()->create();
        $entry = LibraryEntry::factory()->for($user)->create();
        $before = $entry->fresh()->getRawOriginal();
        $this->actingAs($user)->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('welcome')->where('auth.user.id', $user->id)->has('featuredGames', 1)->where('featuredWorld', null));
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
    }
}
