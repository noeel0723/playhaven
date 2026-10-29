<?php

namespace App\Http\Controllers;

use App\Http\Requests\HistoryRequest;
use App\Http\Requests\SavePlaythroughRequest;
use App\Http\Resources\DiaryEntryResource;
use App\Http\Resources\PlaythroughResource;
use App\Models\Game;
use App\Models\Playthrough;
use App\Services\PlayerHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlaythroughController extends Controller
{
    public function index(HistoryRequest $request, Game $game): Response
    {
        $entry = $request->user()->libraryEntries()->where('game_id', $game->id)->firstOrFail();

        return Inertia::render('playthroughs/index', [
            'game' => $game->only(['id', 'name', 'slug']),
            'platforms' => $game->platforms()->orderBy('name')->get(['platforms.id', 'name']),
            'playthroughs' => PlaythroughResource::collection($entry->playthroughs()->with('platform')->withCount('diaryEntries')->withSum('diaryEntries', 'minutes_played')
                ->orderByDesc('updated_at')->orderByDesc('id')->paginate(10)->withQueryString()),
            'today' => now()->toDateString(),
        ]);
    }

    public function store(SavePlaythroughRequest $request, Game $game): RedirectResponse
    {
        $run = DB::transaction(function () use ($request, $game): Playthrough {
            $entry = $request->user()->libraryEntries()->where('game_id', $game->id)->lockForUpdate()->firstOrFail();
            $run = $entry->playthroughs()->create($request->validated());
            $entry->touch();

            return $run;
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Playthrough created.']);

        return to_route('playthroughs.show', $run->id);
    }

    public function show(HistoryRequest $request, Playthrough $playthrough): Response
    {
        $run = $request->user()->playthroughs()->whereKey($playthrough->id)->firstOrFail();
        $game = $run->libraryEntry->game;
        $run->load('platform')->loadCount('diaryEntries')->loadSum('diaryEntries', 'minutes_played');
        $platforms = $game->platforms()->orderBy('name')->get(['platforms.id', 'name']);
        if ($run->platform && ! $platforms->contains('id', $run->platform_id)) {
            $platforms->push($run->platform);
        }

        return Inertia::render('playthroughs/show', [
            'game' => $game->only(['id', 'name', 'slug']),
            'platforms' => $platforms->map->only(['id', 'name'])->values(),
            'playthrough' => (new PlaythroughResource($run))->resolve($request),
            'sessions' => DiaryEntryResource::collection($run->diaryEntries()->orderByDesc('logged_on')->orderByDesc('id')->paginate(20)->withQueryString()),
            'today' => now()->toDateString(),
        ]);
    }

    public function update(SavePlaythroughRequest $request, Playthrough $playthrough, PlayerHistory $history): RedirectResponse
    {
        DB::transaction(function () use ($request, $playthrough, $history): void {
            $run = $history->lock($request->user(), $playthrough);
            $history->validateRunDates($run, $request->validated());
            $run->update($request->validated());
            $run->libraryEntry->touch();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Playthrough updated.']);

        return to_route('playthroughs.show', $playthrough->id);
    }

    public function destroy(Request $request, Playthrough $playthrough, PlayerHistory $history): RedirectResponse
    {
        $request->validate(['confirm' => ['required', 'accepted']]);
        $game = DB::transaction(function () use ($request, $playthrough, $history): Game {
            $run = $history->lock($request->user(), $playthrough);
            $entry = $run->libraryEntry;
            $game = $entry->game;
            $run->delete();
            $entry->touch();

            return $game;
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Playthrough and its sessions removed.']);

        return to_route('playthroughs.index', $game->slug);
    }
}
