<?php

namespace App\Http\Controllers;

use App\Http\Requests\CatalogRequest;
use App\Http\Requests\GameDetailsRequest;
use App\Http\Resources\GameResource;
use App\Http\Resources\PublicReviewResource;
use App\Models\Developer;
use App\Models\Game;
use App\Models\Genre;
use App\Models\Platform;
use App\Models\Publisher;
use App\Models\Review;
use App\Services\GameConnections;
use App\Services\Rawg\ConnectionSynchronizer;
use App\Support\EmailVerification;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class GameCatalogController extends Controller
{
    public function index(CatalogRequest $request): Response
    {
        $search = trim($request->string('q')->value());
        $genre = $request->string('genre')->value();
        $developer = $request->string('developer')->value();
        $publisher = $request->string('publisher')->value();
        $platform = $request->string('platform')->value();
        $year = $request->filled('year') ? $request->integer('year') : null;
        $sort = $request->filled('sort') ? $request->string('sort')->value() : 'recent';
        $query = Game::query()->with(['genres', 'platforms', 'developers'])
            ->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score');

        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $query->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%']);
        }
        if ($genre !== '') {
            $query->whereHas('genres', fn (Builder $query) => $query->where('slug', $genre));
        }
        if ($platform !== '') {
            $query->whereHas('platforms', fn (Builder $query) => $query->where('slug', $platform));
        }
        if ($developer !== '') {
            $query->whereHas('developers', fn (Builder $query) => $query->where('slug', $developer));
        }
        if ($publisher !== '') {
            $query->whereHas('publishers', fn (Builder $query) => $query->where('slug', $publisher));
        }
        if ($year !== null) {
            $query->whereBetween('released_on', ["{$year}-01-01", "{$year}-12-31"]);
        }

        match ($sort) {
            'name' => $query->orderBy('name'),
            'popular' => $query->orderByDesc('players_count'),
            'rating' => $query->orderByRaw('ratings_avg_score DESC NULLS LAST')->orderByDesc('ratings_count'),
            default => $query->orderByRaw('released_on DESC NULLS LAST'),
        };

        return Inertia::render('games/index', [
            'games' => GameResource::collection($query->orderBy('games.id')->paginate(24)->withQueryString()),
            'filters' => ['q' => $search, 'genre' => $genre, 'platform' => $platform, 'developer' => $developer, 'publisher' => $publisher, 'year' => $year, 'sort' => $sort],
            'developers' => Developer::whereHas('games')->orderBy('name')->get(['id', 'name', 'slug']),
            'publishers' => Publisher::whereHas('games')->orderBy('name')->get(['id', 'name', 'slug']),
            'genres' => Genre::whereHas('games')->orderBy('name')->get(['id', 'name', 'slug']),
            'platforms' => Platform::whereHas('games')->orderBy('name')->get(['id', 'name', 'slug']),
            'catalogCount' => Game::count(),
        ]);
    }

    public function show(GameDetailsRequest $request, Game $game, GameConnections $connections, ConnectionSynchronizer $synchronizer): Response
    {
        $game->load(['genres', 'platforms', 'developers', 'publishers'])->loadCount(['ratings', 'libraryEntries as players_count'])->loadAvg('ratings', 'score');

        $entry = $request->user()?->libraryEntries()->with(['rating', 'review'])->where('game_id', $game->id)->first();
        $reviews = Review::query()->where('is_public', true)
            ->whereHas('libraryEntry', fn (Builder $query) => $query->where('game_id', $game->id))
            ->with(['libraryEntry.user:id,name', 'libraryEntry.user.profile', 'libraryEntry.rating'])
            ->orderByDesc('updated_at')->orderByDesc('id')
            ->paginate(10, ['*'], 'reviews_page')->withQueryString();

        return Inertia::render('games/show', [
            'game' => (new GameResource($game))->resolve($request),
            'libraryEntry' => $entry ? ['status' => $entry->status?->value, 'is_favorite' => $entry->is_favorite] : null,
            'availableLists' => $request->user()?->gameLists()->select(['id', 'name', 'visibility'])
                ->withExists(['items as contains_game' => fn (Builder $query) => $query->where('game_id', $game->id)])->orderBy('name')->orderBy('id')->get()
                ->map(fn ($list) => ['id' => $list->id, 'name' => $list->name, 'visibility' => $list->visibility->value, 'contains_game' => (bool) $list->getAttribute('contains_game')]) ?? [],
            'personalRating' => $entry?->rating?->stars,
            'personalReview' => $entry?->review ? [
                'id' => $entry->review->id,
                'body' => $entry->review->body,
                'contains_spoilers' => $entry->review->contains_spoilers,
                'is_public' => $entry->review->is_public,
                'updated_at' => $entry->review->updated_at?->toISOString(),
            ] : null,
            'reviews' => PublicReviewResource::collection($reviews),
            'connections' => $connections->forGame($game),
            'connectionState' => ['can_refresh' => $request->user() !== null && (! EmailVerification::required() || $request->user()->hasVerifiedEmail()) && $synchronizer->canRefresh($game),
                'synced_at' => $game->connections_synced_at?->toISOString(), 'checked_at' => $game->connections_checked_at?->toISOString(),
                'truncated' => (bool) $game->connections_truncated, 'supported' => $game->rawg_id !== null],
        ]);
    }
}
