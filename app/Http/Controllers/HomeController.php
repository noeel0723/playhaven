<?php

namespace App\Http\Controllers;

use App\Http\Resources\GameResource;
use App\Models\Game;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $games = Game::with(['genres', 'platforms'])->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')
            ->orderByRaw('CASE WHEN slug = ? THEN 0 ELSE 1 END', ['red-dead-redemption-2'])
            ->orderByDesc('ratings_count')->orderByDesc('players_count')->orderByRaw('released_on DESC NULLS LAST')->orderBy('id')->limit(6)->get();
        $hero = Game::where('slug', 'red-dead-redemption-2')->first(['name', 'slug']);

        return Inertia::render('welcome', [
            'featuredGames' => GameResource::collection($games)->resolve($request),
            'featuredWorld' => $hero?->only(['name', 'slug']),
            'catalogCount' => Game::count(),
        ]);
    }
}
