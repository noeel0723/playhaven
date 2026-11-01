<?php

namespace App\Http\Controllers;

use App\Http\Resources\GameResource;
use App\Models\Game;
use App\Services\WeeklyPopularGames;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request, WeeklyPopularGames $popular): Response
    {
        $to = CarbonImmutable::now();
        $from = $to->subDays(7);
        $games = $popular->between($from, $to);

        return Inertia::render('welcome', [
            'featuredGames' => GameResource::collection($games)->resolve($request),
            'featuredWorld' => $popular->hero($games->first()),
            'popularity' => ['from' => $from->toISOString(), 'to' => $to->toISOString(),
                'has_weekly_activity' => $games->contains(fn (Game $game) => (int) $game->getAttribute('weekly_players_count') > 0)],
            'catalogCount' => Game::count(),
        ]);
    }
}
