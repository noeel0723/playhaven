<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\LibraryEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ListEditorTest extends TestCase
{
    use RefreshDatabase;

    public function test_editing_requires_the_owner_and_reading_a_list_does_not_return_editor_search_results(): void
    {
        $list = GameList::factory()->create(['visibility' => 'public']);
        $url = route('lists.edit', $list->id);
        $this->get($url)->assertRedirect(route('login'));
        $this->actingAs(User::factory()->unverified()->create())->get($url)->assertRedirect(route('verification.notice'));
        $this->actingAs(User::factory()->create())->get($url)->assertNotFound();
        $this->actingAs($list->user)->get($url)->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow')
            ->assertHeader('Cache-Control', 'no-store, private')->assertInertia(fn (Assert $page) => $page->component('lists/edit')->where('list.id', $list->id));
        $this->get(route('lists.show', [$list->user_id, $list->slug]).'?q=game')->assertInertia(fn (Assert $page) => $page
            ->component('lists/show')->where('isOwner', true)->missing('availableGames')->missing('query'));
    }

    public function test_completion_progress_only_counts_the_current_viewers_completed_library_games(): void
    {
        $list = GameList::factory()->create(['visibility' => 'public']);
        $games = Game::factory()->count(2)->create();
        foreach ($games as $index => $game) {
            GameListItem::factory()->for($list)->for($game)->create(['position' => $index + 1]);
        }
        $viewer = User::factory()->create();
        LibraryEntry::factory()->for($viewer)->for($games[0])->create(['status' => 'completed']);
        LibraryEntry::factory()->for($viewer)->for($games[1])->create(['status' => 'playing']);
        foreach ($games as $game) {
            LibraryEntry::factory()->for($list->user)->for($game)->create(['status' => 'completed']);
        }
        $url = route('lists.show', [$list->user_id, $list->slug]);
        $this->get($url)->assertInertia(fn (Assert $page) => $page->where('progress', null));
        $this->actingAs($viewer)->get($url)->assertInertia(fn (Assert $page) => $page->where('progress.completed', 1)->where('progress.total', 2)->where('progress.percentage', 50));
        $empty = GameList::factory()->create(['visibility' => 'public']);
        $this->get(route('lists.show', [$empty->user_id, $empty->slug]))->assertInertia(fn (Assert $page) => $page->where('progress.completed', 0)->where('progress.total', 0)->where('progress.percentage', 0));
    }

    public function test_editor_mutations_return_to_editor_and_preserve_library_records(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner)->post(route('lists.store'), ['name' => 'Editable collection', 'description' => '', 'visibility' => 'private', 'return_to_edit' => true])->assertRedirect();
        $list = $owner->gameLists()->sole();
        $first = Game::factory()->create();
        $second = Game::factory()->create();
        $entry = LibraryEntry::factory()->for($owner)->for($first)->create(['status' => 'completed']);
        $before = $entry->fresh()->getRawOriginal();
        $this->post(route('list-items.store', $list), ['game_id' => $first->id, 'return_to_edit' => true])->assertRedirect(route('lists.edit', $list->id));
        $this->post(route('list-items.store', $list), ['game_id' => $second->id, 'return_to_edit' => true])->assertRedirect(route('lists.edit', $list->id));
        $item = $list->items()->where('game_id', $second->id)->sole();
        $this->put(route('list-items.update', [$list, $item]), ['position' => 1, 'notes' => 'New first pick', 'return_to_edit' => true])->assertRedirect(route('lists.edit', $list->id));
        $this->assertSame([$second->id, $first->id], $list->items()->pluck('game_id')->all());
        $this->put(route('lists.update', $list), ['name' => 'Renamed collection', 'description' => 'Updated description', 'visibility' => 'unlisted', 'return_to_edit' => true])->assertRedirect(route('lists.edit', $list->id));
        $this->assertSame('New first pick', $item->fresh()->notes);
        $this->delete(route('list-items.destroy', [$list, $item]), ['confirm' => true, 'return_to_edit' => true])->assertRedirect(route('lists.edit', $list->id));
        $this->assertSame([1], $list->items()->pluck('position')->all());
        $this->assertSame($before, $entry->fresh()->getRawOriginal());
    }

    public function test_adding_or_moving_a_game_after_the_first_page_returns_to_its_page(): void
    {
        $list = GameList::factory()->create();
        for ($position = 1; $position <= 24; $position++) {
            GameListItem::factory()->for($list)->create(['position' => $position]);
        }
        $game = Game::factory()->create();
        $this->actingAs($list->user)->post(route('list-items.store', $list), ['game_id' => $game->id, 'return_to_edit' => true])->assertRedirect(route('lists.edit', ['gameList' => $list->id, 'page' => 2]));
        $this->get(route('lists.edit', ['gameList' => $list->id, 'page' => 2]))->assertInertia(fn (Assert $page) => $page->has('items.data', 1)->where('items.data.0.position', 25));
        $item = $list->items()->firstOrFail();
        $this->put(route('list-items.update', [$list, $item]), ['position' => 25, 'notes' => '', 'return_to_edit' => true])->assertRedirect(route('lists.edit', ['gameList' => $list->id, 'page' => 2]));
    }
}
