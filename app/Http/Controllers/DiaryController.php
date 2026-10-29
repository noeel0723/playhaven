<?php

namespace App\Http\Controllers;

use App\Http\Requests\HistoryRequest;
use App\Http\Requests\SaveDiaryEntryRequest;
use App\Http\Resources\DiaryEntryResource;
use App\Models\DiaryEntry;
use App\Models\Playthrough;
use App\Services\PlayerHistory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DiaryController extends Controller
{
    public function index(HistoryRequest $request): Response
    {
        $search = trim($request->string('q')->value());
        $from = $request->string('from')->value();
        $to = $request->string('to')->value();
        $query = DiaryEntry::query()->whereHas('playthrough.libraryEntry', fn (Builder $query) => $query->where('user_id', $request->user()->id));
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $query->whereHas('playthrough.libraryEntry.game', fn (Builder $query) => $query->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%']));
        }
        if ($from !== '') {
            $query->where('logged_on', '>=', $from);
        }
        if ($to !== '') {
            $query->where('logged_on', '<=', $to);
        }
        $sessions = (clone $query)->count();
        $minutes = (int) (clone $query)->sum('minutes_played');

        return Inertia::render('diary/index', [
            'sessions' => DiaryEntryResource::collection($query->with('playthrough.libraryEntry.game')->orderByDesc('logged_on')->orderByDesc('id')->paginate(20)->withQueryString()),
            'totals' => ['sessions' => $sessions, 'minutes' => $minutes],
            'filters' => ['q' => $search, 'from' => $from, 'to' => $to],
            'today' => now()->toDateString(),
        ]);
    }

    public function store(SaveDiaryEntryRequest $request, Playthrough $playthrough, PlayerHistory $history): RedirectResponse
    {
        DB::transaction(function () use ($request, $playthrough, $history): void {
            $run = $history->lock($request->user(), $playthrough);
            $history->validateSessionDate($run, $request->string('logged_on')->value());
            $run->diaryEntries()->create($request->validated());
            $run->touch();
            $run->libraryEntry->touch();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Playing session logged.']);

        return to_route('playthroughs.show', $playthrough->id);
    }

    public function update(SaveDiaryEntryRequest $request, Playthrough $playthrough, DiaryEntry $diaryEntry, PlayerHistory $history): RedirectResponse
    {
        DB::transaction(function () use ($request, $playthrough, $diaryEntry, $history): void {
            $run = $history->lock($request->user(), $playthrough);
            $session = $run->diaryEntries()->whereKey($diaryEntry->id)->firstOrFail();
            $history->validateSessionDate($run, $request->string('logged_on')->value());
            $session->update($request->validated());
            $run->touch();
            $run->libraryEntry->touch();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Diary session updated.']);

        return to_route('playthroughs.show', $playthrough->id);
    }

    public function destroy(Request $request, Playthrough $playthrough, DiaryEntry $diaryEntry, PlayerHistory $history): RedirectResponse
    {
        $request->validate(['confirm' => ['required', 'accepted']]);
        DB::transaction(function () use ($request, $playthrough, $diaryEntry, $history): void {
            $run = $history->lock($request->user(), $playthrough);
            $run->diaryEntries()->whereKey($diaryEntry->id)->firstOrFail()->delete();
            $run->touch();
            $run->libraryEntry->touch();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Diary session deleted.']);

        return to_route('playthroughs.show', $playthrough->id);
    }
}
