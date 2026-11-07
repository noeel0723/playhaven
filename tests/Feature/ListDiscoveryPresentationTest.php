<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ListDiscoveryPresentationTest extends TestCase
{
    use RefreshDatabase;

    private function fillList(GameList $list, int $count): array
    {
        $ids = [];
        for ($position = 1; $position <= $count; $position++) {
            $game = Game::factory()->create();
            $ids[] = $game->id;
            GameListItem::factory()->for($list)->for($game)->create(['position' => $position, 'notes' => 'ITEM NOTES MUST NOT APPEAR IN PREVIEWS']);
        }

        return $ids;
    }

    public function test_previews_are_limited_to_five_ordered_games_per_list_without_loading_each_item_separately(): void
    {
        $first = GameList::factory()->create(['name' => 'Alpha list']);
        $second = GameList::factory()->create(['name' => 'Beta list']);
        $firstGames = $this->fillList($first, 7);
        $secondGames = $this->fillList($second, 6);
        $previous = Model::preventsLazyLoading();
        Model::preventLazyLoading();
        try {
            $this->get('/lists/discover?sort=name')->assertOk()->assertDontSee('ITEM NOTES MUST NOT APPEAR IN PREVIEWS')
                ->assertInertia(fn (Assert $page) => $page->has('lists.data.0.preview_games', 5)->has('lists.data.1.preview_games', 5)
                    ->where('lists.data.0.preview_games', fn ($games) => collect($games)->pluck('id')->all() === array_slice($firstGames, 0, 5))
                    ->where('lists.data.1.preview_games.0.id', $secondGames[0])->where('lists.data.1.preview_games.4.id', $secondGames[4])
                    ->where('lists.data.0.items_count', 7)->missing('lists.data.0.preview_games.0.notes')->missing('lists.data.0.preview_games.0.pivot'));
        } finally {
            Model::preventLazyLoading($previous);
        }
    }

    public function test_featured_and_sorted_lists_only_include_public_data_and_search_pagination_keeps_sort(): void
    {
        $largest = GameList::factory()->create(['name' => 'Matching largest']);
        $this->fillList($largest, 6);
        GameList::factory()->count(12)->create(['name' => 'Matching small']);
        $hidden = GameList::factory()->create(['visibility' => 'private', 'name' => 'PRIVATE COLLECTION']);
        $this->fillList($hidden, 8);
        GameList::factory()->create(['visibility' => 'unlisted', 'name' => 'UNLISTED COLLECTION']);
        $this->get('/lists/discover')->assertDontSee('PRIVATE COLLECTION')->assertDontSee('UNLISTED COLLECTION')
            ->assertInertia(fn (Assert $page) => $page->has('featuredLists', 1)->where('featuredLists.0.id', $largest->id)->where('lists.meta.total', 13));
        $this->get('/lists/discover?q=Matching&sort=largest')->assertInertia(fn (Assert $page) => $page
            ->where('sort', 'largest')->where('query', 'Matching')->has('featuredLists', 0)->has('lists.data', 12)->where('lists.data.0.id', $largest->id)
            ->where('lists.links.next', fn ($url) => str_contains($url, 'q=Matching') && str_contains($url, 'sort=largest') && str_contains($url, 'page=2')));
        $this->get('/lists/discover?q=Matching&sort=largest&page=2')->assertInertia(fn (Assert $page) => $page->has('lists.data', 1)->has('featuredLists', 0));
        $this->getJson('/lists/discover?sort=invalid')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->getJson('/lists/discover?sort[]=recent')->assertUnprocessable()->assertJsonValidationErrors('sort');
    }

    public function test_owner_gets_private_previews_while_public_profiles_only_get_public_list_previews(): void
    {
        $owner = User::factory()->create();
        UserProfile::factory()->for($owner)->create(['username' => 'preview_player', 'is_public' => true]);
        $public = GameList::factory()->for($owner)->create(['visibility' => 'public']);
        $private = GameList::factory()->for($owner)->create(['visibility' => 'private', 'name' => 'PRIVATE PREVIEW LIST']);
        $this->fillList($public, 2);
        $this->fillList($private, 3);
        $this->actingAs($owner)->get('/lists')->assertInertia(fn (Assert $page) => $page->has('lists.data', 2)
            ->has('lists.data.0.preview_games', 3)->has('lists.data.1.preview_games', 2)->where('lists.data.0.owner.username', 'preview_player'));
        $this->get('/players/preview_player')->assertDontSee('PRIVATE PREVIEW LIST')->assertInertia(fn (Assert $page) => $page
            ->has('lists.data', 1)->has('lists.data.0.preview_games', 2));
    }

    public function test_empty_lists_and_invalid_cover_urls_have_honest_previews_and_hidden_profiles_do_not_expose_username(): void
    {
        $list = GameList::factory()->create();
        UserProfile::factory()->for($list->user)->create(['username' => 'hidden_alias', 'is_public' => false]);
        $this->get('/lists/discover')->assertInertia(fn (Assert $page) => $page->has('featuredLists', 0)->has('lists.data.0.preview_games', 0)
            ->where('lists.data.0.owner.username', null));
        $game = Game::factory()->create(['rawg_id' => 1234, 'cover_url' => 'https://unsafe.example/image.jpg']);
        GameListItem::factory()->for($list)->for($game)->create(['position' => 1]);
        $this->get('/lists/discover')->assertInertia(fn (Assert $page) => $page->has('lists.data.0.preview_games', 1)->where('lists.data.0.preview_games.0.cover_url', null));
    }

    public function test_personal_list_filters_preserve_ownership_and_pagination(): void
    {
        $owner = User::factory()->create();
        $largest = GameList::factory()->for($owner)->create(['name' => 'Matching largest', 'visibility' => 'private']);
        $this->fillList($largest, 2);
        GameList::factory()->for($owner)->count(12)->create(['name' => 'Matching small', 'visibility' => 'private']);
        GameList::factory()->for($owner)->create(['name' => 'Matching public', 'visibility' => 'public']);
        GameList::factory()->create(['name' => 'Matching other owner', 'visibility' => 'private']);
        $this->actingAs($owner)->get('/lists?q=Matching&visibility=private&sort=largest')->assertInertia(fn (Assert $page) => $page
            ->where('filters.q', 'Matching')->where('filters.visibility', 'private')->where('filters.sort', 'largest')
            ->where('lists.meta.total', 13)->has('lists.data', 12)->where('lists.data.0.id', $largest->id)
            ->where('lists.links.next', fn ($url) => str_contains($url, 'q=Matching') && str_contains($url, 'visibility=private') && str_contains($url, 'sort=largest') && str_contains($url, 'page=2')));
        $this->get('/lists?q=Matching&visibility=private&sort=largest&page=2')->assertInertia(fn (Assert $page) => $page->has('lists.data', 1));
        $literal = GameList::factory()->for($owner)->create(['name' => '100%_Complete!', 'visibility' => 'unlisted']);
        $this->get('/lists?q='.urlencode('%_').'&visibility=unlisted&sort=name')->assertInertia(fn (Assert $page) => $page->has('lists.data', 1)->where('lists.data.0.id', $literal->id));
        $this->getJson('/lists?visibility=unsafe&sort[]=recent')->assertUnprocessable()->assertJsonValidationErrors(['visibility', 'sort']);
    }
}
