<?php

namespace App\Http\Controllers;

use App\Enums\ListVisibility;
use App\Http\Requests\GameListBrowseRequest;
use App\Http\Requests\SaveGameListRequest;
use App\Http\Resources\GameListItemResource;
use App\Http\Resources\GameListResource;
use App\Http\Resources\GameResource;
use App\Models\Game;
use App\Models\GameList;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class GameListController extends Controller
{
    public function index(GameListBrowseRequest $request): Response
    {
        return Inertia::render('lists/index', ['lists' => GameListResource::collection($request->user()->gameLists()->with(['user.profile', 'previewItems'])->withCount('items')->orderByDesc('updated_at')->orderByDesc('id')->paginate(12)->withQueryString())]);
    }

    public function discover(GameListBrowseRequest $request): Response
    {
        $search = trim($request->string('q')->value());
        $sort = $request->input('sort') ?: 'recent';
        $query = GameList::where('visibility', ListVisibility::Public)->with(['user.profile', 'previewItems'])->withCount('items');
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $query->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%']);
        }

        match ($sort) {
            'largest' => $query->orderByDesc('items_count')->orderByDesc('updated_at'),
            'name' => $query->orderBy('name'),
            default => $query->orderByDesc('updated_at'),
        };
        $lists = $query->orderByDesc('id')->paginate(12)->withQueryString();
        $featured = $search === '' && $sort === 'recent' && $lists->currentPage() === 1 && $lists->total() > 3
            ? GameList::where('visibility', ListVisibility::Public)->whereHas('items')->with(['user.profile', 'previewItems'])->withCount('items')
                ->orderByDesc('items_count')->orderByDesc('updated_at')->orderByDesc('id')->limit(3)->get()
            : collect();

        return Inertia::render('lists/discover', ['lists' => GameListResource::collection($lists), 'query' => $search, 'sort' => $sort,
            'featuredLists' => GameListResource::collection($featured)->resolve($request)]);
    }

    public function store(SaveGameListRequest $request): RedirectResponse
    {
        $list = $request->user()->gameLists()->create([...$request->validated(), 'slug' => substr(Str::slug($request->string('name')->value()) ?: 'list', 0, 100).'-'.strtolower((string) Str::ulid())]);

        return to_route('lists.show', ['listOwner' => $list->user_id, 'listSlug' => $list->slug]);
    }

    public function show(GameListBrowseRequest $request, User $listOwner, string $listSlug): HttpResponse
    {
        $list = $listOwner->gameLists()->where('slug', $listSlug)->with('user.profile')->withCount('items')->firstOrFail();
        $isOwner = $request->user()?->id === $list->user_id;
        abort_if($list->visibility === ListVisibility::Private && ! $isOwner, 404);
        $search = trim($request->string('q')->value());
        $games = [];
        if ($isOwner && $search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $games = GameResource::collection(Game::with(['genres', 'platforms'])->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')
                ->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])->whereNotIn('id', $list->items()->select('game_id'))->orderBy('name')->orderBy('id')->limit(12)->get())->resolve($request);
        }

        $response = Inertia::render('lists/show', [
            'list' => (new GameListResource($list))->resolve($request), 'isOwner' => $isOwner, 'query' => $search, 'availableGames' => $games,
            'shareUrl' => route('lists.show', ['listOwner' => $list->user_id, 'listSlug' => $list->slug]),
            'items' => GameListItemResource::collection($list->items()->with(['game' => fn (BelongsTo $query) => $query->with(['genres', 'platforms'])->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')])->paginate(24)->withQueryString()),
        ])->toResponse($request);
        $response->headers->set('Cache-Control', 'private, no-store');
        if ($list->visibility !== ListVisibility::Public) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }

        return $response;
    }

    public function update(SaveGameListRequest $request, GameList $gameList): RedirectResponse
    {
        $list = $request->user()->gameLists()->whereKey($gameList->id)->firstOrFail();
        $list->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'List updated.']);

        return to_route('lists.show', ['listOwner' => $list->user_id, 'listSlug' => $list->slug]);
    }

    public function destroy(Request $request, GameList $gameList): RedirectResponse
    {
        $request->validate(['confirm' => ['required', 'accepted']]);
        $request->user()->gameLists()->whereKey($gameList->id)->firstOrFail()->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'List removed. Your games and library are preserved.']);

        return to_route('lists.index');
    }
}
