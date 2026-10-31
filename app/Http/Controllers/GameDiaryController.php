<?php

namespace App\Http\Controllers;

use App\Http\Requests\LogGameDiaryRequest;
use App\Models\Game;
use App\Services\PlayerHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GameDiaryController extends Controller
{
    public function options(Request $request, Game $game): JsonResponse
    {
        $entry = $request->user()->libraryEntries()->where('game_id', $game->id)->first();

        return response()->json([
            'today' => now()->toDateString(),
            'playthroughs' => $entry?->playthroughs()->with('platform:id,name')->orderByDesc('updated_at')->orderByDesc('id')->get()
                ->map(fn ($run) => [
                    'id' => $run->id, 'label' => $run->label, 'status' => $run->status->value,
                    'platform' => $run->platform?->getAttribute('name'),
                    'started_on' => $run->started_on?->format('Y-m-d'), 'finished_on' => $run->finished_on?->format('Y-m-d'),
                ]) ?? [],
        ])->header('Cache-Control', 'private, no-store');
    }

    public function store(LogGameDiaryRequest $request, Game $game, PlayerHistory $history): RedirectResponse
    {
        DB::transaction(function () use ($request, $game, $history): void {
            // Match the lock order used by the existing history editors.
            $entry = $request->user()->libraryEntries()->firstOrCreate(['game_id' => $game->id], ['status' => null, 'is_favorite' => false]);
            $entry = $request->user()->libraryEntries()->whereKey($entry->id)->lockForUpdate()->firstOrFail();
            if ($request->filled('playthrough_id')) {
                $run = $entry->playthroughs()->whereKey($request->integer('playthrough_id'))->lockForUpdate()->firstOrFail();
            } else {
                $run = $entry->playthroughs()->create([
                    'label' => $request->validated('label'), 'platform_id' => $request->validated('platform_id'),
                    'status' => $request->validated('status'), 'started_on' => null, 'finished_on' => null,
                ]);
            }
            $history->validateSessionDate($run, $request->string('logged_on')->value());
            $run->diaryEntries()->create($request->safe()->only(['logged_on', 'minutes_played', 'notes']));
            $run->touch();
            $entry->touch();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Playing session logged.']);

        return to_route('games.show', $game->slug);
    }
}
