<?php

namespace Tests\Feature;

use App\Enums\ListVisibility;
use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\LibraryEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class GameListsTest extends TestCase
{
    use RefreshDatabase;

    private function listData(array $changes = []): array
    {
        return array_replace(['name' => 'Worlds worth visiting', 'description' => 'A personal collection.', 'visibility' => 'private'], $changes);
    }

    private function link(GameList $list): string
    {
        return route('lists.show', ['listOwner' => $list->user_id, 'listSlug' => $list->slug]);
    }

    public function test_guests_cannot_create_or_modify_lists(): void
    {
        $list = GameList::factory()->create();
        $item = GameListItem::factory()->for($list)->create();
        $this->get(route('lists.index'))->assertRedirect(route('login'));
        $this->post(route('lists.store'), $this->listData())->assertRedirect(route('login'));
        $this->put(route('lists.update', $list->id), $this->listData())->assertRedirect(route('login'));
        $this->delete(route('lists.destroy', $list->id), ['confirm' => true])->assertRedirect(route('login'));
        $this->post(route('list-items.store', $list->id), ['game_id' => $item->game_id])->assertRedirect(route('login'));
        $this->assertModelExists($item);
    }

    public function test_create_and_rename_preserve_owner_and_share_url_even_when_names_repeat(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($owner)->post(route('lists.store'), $this->listData(['user_id' => $other->id, 'slug' => 'forged']))->assertRedirect();
        $list = $owner->gameLists()->sole();
        $slug = $list->slug;
        $this->assertNotSame('forged', $slug);
        $this->put(route('lists.update', $list->id), $this->listData(['name' => 'A renamed collection', 'visibility' => 'public', 'user_id' => $other->id, 'slug' => 'forged']))->assertRedirect($this->link($list));
        $this->assertSame($slug, $list->fresh()->slug);
        $this->assertSame($owner->id, $list->fresh()->user_id);
        $this->post(route('lists.store'), $this->listData())->assertRedirect();
        $this->assertSame(2, $owner->gameLists()->count());
        $this->assertSame(2, $owner->gameLists()->pluck('slug')->unique()->count());
    }

    public function test_names_descriptions_and_visibility_are_validated(): void
    {
        $this->actingAs(User::factory()->create())->post(route('lists.store'), $this->listData(['name' => " \u{2003} ", 'visibility' => 'secret', 'description' => str_repeat('x', 5001)]))->assertSessionHasErrors(['name', 'visibility', 'description']);
        $this->assertDatabaseCount('game_lists', 0);
    }

    public static function visibilityCases(): array
    {
        return [['public', 200], ['unlisted', 200], ['private', 404]];
    }

    #[DataProvider('visibilityCases')]
    public function test_visibility_is_enforced_for_direct_links(string $visibility, int $status): void
    {
        $list = GameList::factory()->create(['visibility' => $visibility]);
        GameListItem::factory()->for($list)->create(['notes' => 'LIST_NOTE_MARKER']);
        $response = $this->get($this->link($list))->assertStatus($status);
        if ($status === 404) {
            $response->assertDontSee('LIST_NOTE_MARKER');
        }
        if ($visibility === 'unlisted') {
            $response->assertHeader('X-Robots-Tag', 'noindex, nofollow');
        }
        $this->actingAs($list->user)->get($this->link($list))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('isOwner', true)->where('list.visibility', $visibility)->missing('list.owner.email'));
    }

    public function test_discovery_only_lists_public_collections_and_owner_scopes_are_respected(): void
    {
        $public = GameList::factory()->create(['visibility' => ListVisibility::Public, 'name' => 'Public collection']);
        GameList::factory()->create(['visibility' => ListVisibility::Unlisted, 'name' => 'HIDDEN_UNLISTED']);
        GameList::factory()->create(['visibility' => ListVisibility::Private, 'name' => 'HIDDEN_PRIVATE']);
        $this->get(route('lists.discover'))->assertDontSee('HIDDEN_')->assertInertia(fn (Assert $page) => $page
            ->has('lists.data', 1)->where('lists.data.0.id', $public->id));
        $other = User::factory()->create();
        $this->get(route('lists.show', ['listOwner' => $other->id, 'listSlug' => $public->slug]))->assertNotFound();
        $this->actingAs($other)->get(route('lists.index'))->assertInertia(fn (Assert $page) => $page->has('lists.data', 0));
    }

    public function test_adding_games_is_idempotent_and_does_not_require_library_membership(): void
    {
        $list = GameList::factory()->create();
        $game = Game::factory()->create();
        $url = route('list-items.store', $list->id);
        $this->actingAs($list->user)->post($url, ['game_id' => $game->id, 'notes' => 'Original note'])->assertRedirect();
        $this->post($url, ['game_id' => $game->id, 'notes' => 'Should not overwrite'])->assertRedirect();
        $this->assertDatabaseCount('game_list_items', 1);
        $this->assertDatabaseHas('game_list_items', ['game_list_id' => $list->id, 'game_id' => $game->id, 'notes' => 'Original note', 'position' => 1]);
        $this->assertDatabaseCount('library_entries', 0);
    }

    public function test_items_can_be_reordered_and_notes_saved_without_losing_other_items(): void
    {
        $list = GameList::factory()->create();
        $a = GameListItem::factory()->for($list)->create(['position' => 1]);
        $b = GameListItem::factory()->for($list)->create(['position' => 2, 'notes' => 'Keep me']);
        $c = GameListItem::factory()->for($list)->create(['position' => 3]);
        $this->actingAs($list->user)->put(route('list-items.update', [$list->id, $c->id]), ['position' => 1, 'notes' => 'Now first.'])->assertRedirect();
        $this->assertSame([$c->id, $a->id, $b->id], $list->items()->pluck('id')->all());
        $this->assertSame([1, 2, 3], $list->items()->pluck('position')->all());
        $this->assertSame('Keep me', $b->fresh()->notes);
        $this->assertSame('Now first.', $c->fresh()->notes);
        $this->put(route('list-items.update', [$list->id, $c->id]), ['position' => 99, 'notes' => 'Invalid'])->assertSessionHasErrors('position');
        $this->assertSame('Now first.', $c->fresh()->notes);
    }

    public function test_owners_cannot_edit_another_users_list_or_an_item_from_a_different_list(): void
    {
        $list = GameList::factory()->create();
        $item = GameListItem::factory()->for($list)->create();
        $owner = User::factory()->create();
        $ownList = GameList::factory()->for($owner)->create();
        $this->actingAs($owner)->put(route('lists.update', $list->id), $this->listData())->assertNotFound();
        $this->post(route('list-items.store', $list->id), ['game_id' => $item->game_id])->assertNotFound();
        $this->put(route('list-items.update', [$ownList->id, $item->id]), ['position' => 1, 'notes' => 'Forged'])->assertNotFound();
        $this->delete(route('list-items.destroy', [$ownList->id, $item->id]), ['confirm' => true])->assertNotFound();
        $this->delete(route('lists.destroy', $list->id), ['confirm' => true])->assertNotFound();
        $this->assertModelExists($item);
    }

    public function test_confirmed_item_and_list_removal_keep_catalog_and_player_library(): void
    {
        $entry = LibraryEntry::factory()->create();
        $list = GameList::factory()->for($entry->user)->create();
        $item = GameListItem::factory()->for($list)->for($entry->game)->create();
        $other = GameListItem::factory()->for($list)->create(['position' => 2]);
        $this->actingAs($entry->user)->delete(route('list-items.destroy', [$list->id, $item->id]))->assertSessionHasErrors('confirm');
        $this->delete(route('list-items.destroy', [$list->id, $item->id]), ['confirm' => true])->assertRedirect();
        $this->assertModelMissing($item);
        $this->assertSame(1, $other->fresh()->position);
        $this->delete(route('lists.destroy', $list->id))->assertSessionHasErrors('confirm');
        $this->delete(route('lists.destroy', $list->id), ['confirm' => true])->assertRedirect(route('lists.index'));
        $this->assertModelMissing($list);
        $this->assertModelMissing($other);
        $this->assertModelExists($entry);
        $this->assertModelExists($entry->game);
    }

    public function test_picker_search_and_discovery_treat_wildcards_literally(): void
    {
        $list = GameList::factory()->create(['name' => '100%_Favorite']);
        $game = Game::factory()->create(['name' => '100%_Adventure']);
        Game::factory()->create(['name' => '100 Games']);
        GameList::factory()->create(['name' => '100 Collections']);
        $this->actingAs($list->user)->get(route('lists.edit', $list->id).'?q='.urlencode('%_'))->assertInertia(fn (Assert $page) => $page
            ->has('availableGames', 1)->where('availableGames.0.id', $game->id));
        $this->get(route('lists.discover', ['q' => '%_']))->assertInertia(fn (Assert $page) => $page->has('lists.data', 1)->where('lists.data.0.id', $list->id));
    }

    public function test_public_and_owner_lists_paginate_and_private_changes_hide_existing_links(): void
    {
        $owner = User::factory()->create();
        GameList::factory()->for($owner)->count(13)->create();
        $this->actingAs($owner)->get(route('lists.index'))->assertInertia(fn (Assert $page) => $page->has('lists.data', 12)->where('lists.meta.total', 13));
        $this->get(route('lists.discover'))->assertInertia(fn (Assert $page) => $page->has('lists.data', 12));
        $list = $owner->gameLists()->firstOrFail();
        $this->put(route('lists.update', $list->id), $this->listData())->assertRedirect();
        $this->post(route('logout'));
        $this->get($this->link($list))->assertNotFound();
    }
}
