<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CreateGameListTest extends TestCase
{
    use RefreshDatabase;

    public function test_creation_page_requires_auth_and_searches_bounded_local_results_literally_without_creating_a_list(): void
    {
        Http::preventStrayRequests();
        $url = route('lists.create');
        $this->get($url)->assertRedirect(route('login'));
        $this->actingAs(User::factory()->unverified()->create())->get($url)->assertRedirect(route('verification.notice'));
        $this->actingAs(User::factory()->create())->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('lists/create')->has('availableGames', 0));
        Game::factory()->count(13)->create(['name' => 'Adventure game']);
        $literal = Game::factory()->create(['name' => '100%_Complete']);
        $this->get($url.'?q=ADVENTURE')->assertInertia(fn (Assert $page) => $page->has('availableGames', 12)->where('query', 'ADVENTURE'));
        $this->get($url.'?q=%25_')->assertInertia(fn (Assert $page) => $page->has('availableGames', 1)->where('availableGames.0.id', $literal->id));
        $this->getJson($url.'?q[]=bad')->assertUnprocessable();
        $this->assertDatabaseCount('game_lists', 0);
        Http::assertNothingSent();
    }

    public function test_saving_creates_the_list_and_ordered_games_together_without_mutating_the_library(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $games = Game::factory()->count(3)->create();
        $entry = LibraryEntry::factory()->for($owner)->for($games[0])->create(['status' => 'playing']);
        $before = $entry->fresh()->getRawOriginal();
        $ids = [$games[2]->id, $games[0]->id, $games[1]->id];
        $this->actingAs($owner)->post(route('lists.store'), [
            'name' => '  Weekend games  ', 'description' => 'My next picks', 'visibility' => 'private', 'games' => $ids, 'user_id' => $other->id,
        ])->assertSessionHasNoErrors()->assertRedirect();
        $list = $owner->gameLists()->sole();
        $this->assertSame('Weekend games', $list->name);
        $this->assertSame($ids, $list->items()->pluck('game_id')->all());
        $this->assertSame([1, 2, 3], $list->items()->pluck('position')->all());
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
        $this->assertDatabaseCount('library_entries', 1);
        $this->assertSame(0, $other->gameLists()->count());
    }

    public function test_invalid_selection_does_not_leave_a_partial_list_and_empty_lists_are_supported(): void
    {
        $this->actingAs(User::factory()->create());
        $game = Game::factory()->create();
        foreach ([[$game->id, $game->id], [$game->id, 9999999], ['bad'], ['slot' => $game->id], array_fill(0, 101, $game->id)] as $games) {
            $this->post(route('lists.store'), ['name' => 'Invalid picks', 'visibility' => 'private', 'games' => $games])->assertSessionHasErrors();
            $this->assertDatabaseCount('game_lists', 0);
            $this->assertDatabaseCount('game_list_items', 0);
        }
        $this->post(route('lists.store'), ['name' => 'Empty list', 'visibility' => 'unlisted', 'games' => []])->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseCount('game_lists', 1);
        $this->assertDatabaseCount('game_list_items', 0);
    }
}
