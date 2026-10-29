<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveRatingRequest;
use App\Http\Requests\SaveReviewRequest;
use App\Models\Game;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GameExperienceController extends Controller
{
    public function rate(SaveRatingRequest $request, Game $game): RedirectResponse
    {
        DB::transaction(function () use ($request, $game): void {
            $entry = $request->user()->libraryEntries()->where('game_id', $game->id)->lockForUpdate()->firstOrFail();
            $stars = $request->validated('stars');
            if ($stars === null) {
                $entry->rating()->delete();
            } else {
                $entry->rating()->updateOrCreate([], ['score' => (int) ((float) $stars * 2)]);
            }
            $entry->touch();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your rating has been updated.']);

        return to_route('games.show', $game->slug);
    }

    public function review(SaveReviewRequest $request, Game $game): RedirectResponse
    {
        DB::transaction(function () use ($request, $game): void {
            $entry = $request->user()->libraryEntries()->where('game_id', $game->id)->lockForUpdate()->firstOrFail();
            $entry->review()->updateOrCreate([], $request->validated());
            $entry->touch();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your review has been saved.']);

        return to_route('games.show', $game->slug);
    }

    public function destroyReview(Request $request, Game $game): RedirectResponse
    {
        $request->validate(['confirm' => ['required', 'accepted']]);
        DB::transaction(function () use ($request, $game): void {
            $entry = $request->user()->libraryEntries()->where('game_id', $game->id)->lockForUpdate()->firstOrFail();
            $entry->review()->firstOrFail()->delete();
            $entry->touch();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your review has been deleted.']);

        return to_route('games.show', $game->slug);
    }
}
