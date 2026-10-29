<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Services\Rawg\ConnectionSynchronizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class GameConnectionController extends Controller
{
    public function refresh(Request $request, Game $game, ConnectionSynchronizer $synchronizer): RedirectResponse
    {
        $request->validate(['reviews_page' => ['nullable', 'integer', 'between:1,100000']]);
        try {
            $synchronizer->sync($game);
        } catch (Throwable) {
            throw ValidationException::withMessages(['connections' => 'Connections could not refresh. Your game is saved; try again in a few minutes.']);
        }

        return to_route('games.show', ['game' => $game->slug, ...($request->integer('reviews_page') > 1 ? ['reviews_page' => $request->integer('reviews_page')] : [])]);
    }
}
