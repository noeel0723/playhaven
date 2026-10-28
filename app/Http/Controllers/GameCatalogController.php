<?php

namespace App\Http\Controllers;

use App\Http\Requests\CatalogRequest;
use App\Http\Resources\GameResource;
use App\Models\Game;
use App\Models\Genre;
use App\Models\Platform;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class GameCatalogController extends Controller
{
    public function index(CatalogRequest $request): Response
    {
        $search = trim($request->string('q')->value());
        $genre = $request->string('genre')->value();
        $platform = $request->string('platform')->value();
        $year = $request->filled('year') ? $request->integer('year') : null;
        $sort = $request->filled('sort') ? $request->string('sort')->value() : 'recent';
        $query = Game::query()->with(['genres', 'platforms'])
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
            'filters' => ['q' => $search, 'genre' => $genre, 'platform' => $platform, 'year' => $year, 'sort' => $sort],
            'genres' => Genre::whereHas('games')->orderBy('name')->get(['id', 'name', 'slug']),
            'platforms' => Platform::whereHas('games')->orderBy('name')->get(['id', 'name', 'slug']),
            'catalogCount' => Game::count(),
        ]);
    }

    public function show(Game $game): Response
    {
        $game->load(['genres', 'platforms'])->loadCount(['ratings', 'libraryEntries as players_count'])->loadAvg('ratings', 'score');

        return Inertia::render('games/show', ['game' => (new GameResource($game))->resolve(request())]);
    }
}
