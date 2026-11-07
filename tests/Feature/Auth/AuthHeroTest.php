<?php

namespace Tests\Feature\Auth;

use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\User;
use App\Models\UserProfile;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthHeroTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-11-01 12:00:00', 'UTC'));
        Http::preventStrayRequests();
    }

    private function activePlayer(Game $game, CarbonImmutable $when): void
    {
        $user = User::factory()->create();
        UserProfile::factory()->for($user)->create(['is_public' => true]);
        LibraryEntry::factory()->for($user)->for($game)->create(['created_at' => $when]);
    }

    public function test_home_login_and_registration_use_the_same_weekly_leader_and_validated_artwork(): void
    {
        config(['services.thegamesdb.api_key' => 'auth-secret-never-render']);
        $game = Game::factory()->create(['thegamesdb_id' => 101, 'banner_url' => 'https://cdn.thegamesdb.net/images/original/screenshots/auth-hero.jpg', 'cover_url' => 'https://cdn.thegamesdb.net/images/original/games/auth-cover.jpg']);
        $this->activePlayer($game, CarbonImmutable::now());
        $expected = $this->get(route('home'))->assertOk()->viewData('page')['props']['featuredWorld'];
        $before = LibraryEntry::firstOrFail()->getRawOriginal();
        foreach (['login', 'register'] as $route) {
            $this->get(route($route))->assertOk()->assertDontSee('auth-secret-never-render')->assertInertia(fn (Assert $page) => $page
                ->component('auth/'.$route)->where('featuredWorld', $expected)
                ->where('featuredWorld.banner_url', 'https://cdn.thegamesdb.net/images/original/screenshots/auth-hero.jpg')->missing('featuredWorld.thegamesdb_id')->missing('featuredWorld.user_id'));
        }
        $this->assertSame($before, LibraryEntry::firstOrFail()->getRawOriginal());
        Http::assertNothingSent();
    }

    public function test_auth_hero_follows_a_new_weekly_leader_when_older_activity_expires(): void
    {
        $now = CarbonImmutable::now();
        $old = Game::factory()->create();
        $next = Game::factory()->create();
        for ($i = 0; $i < 2; $i++) {
            $this->activePlayer($old, $now->subDays(7)->addMinute());
        }
        $this->activePlayer($next, $now);
        $this->get(route('login'))->assertInertia(fn (Assert $page) => $page->where('featuredWorld.slug', $old->slug));
        $this->travelTo($now->addMinutes(2));
        foreach (['home', 'login', 'register'] as $route) {
            $this->get(route($route))->assertInertia(fn (Assert $page) => $page->where('featuredWorld.slug', $next->slug));
        }
    }

    public function test_empty_catalog_and_untrusted_image_urls_do_not_break_authentication_pages(): void
    {
        foreach (['login', 'register'] as $route) {
            $this->get(route($route))->assertOk()->assertInertia(fn (Assert $page) => $page->where('featuredWorld', null));
        }
        Game::factory()->create(['thegamesdb_id' => 999, 'banner_url' => 'https://untrusted.example/secret.jpg', 'cover_url' => 'https://untrusted.example/cover.jpg']);
        foreach (['login', 'register'] as $route) {
            $this->get(route($route))->assertOk()->assertDontSee('untrusted.example')->assertInertia(fn (Assert $page) => $page
                ->where('featuredWorld.banner_url', null)->where('featuredWorld.cover_url', null));
        }
        Http::assertNothingSent();
    }

    public function test_password_recovery_does_not_load_a_popular_hero_or_require_catalog_data(): void
    {
        $this->get(route('password.request'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('auth/forgot-password')->missing('featuredWorld'));
        Http::assertNothingSent();
    }
}
