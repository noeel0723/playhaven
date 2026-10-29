<?php

namespace App\Http\Controllers;

use App\Http\Requests\HistoryRequest;
use App\Http\Requests\SaveDiaryEntryRequest;
use App\Http\Resources\DiaryEntryResource;
use App\Models\DiaryEntry;
use App\Models\Playthrough;
use App\Services\PlayerHistory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        $query = DiaryEntry::query()->select('diary_entries.*')
            ->selectSub(DB::table('diary_entries as newer')->selectRaw('COUNT(*)')
                ->whereColumn('newer.playthrough_id', 'diary_entries.playthrough_id')
                ->where(fn ($newer) => $newer->whereColumn('newer.logged_on', '>', 'diary_entries.logged_on')
                    ->orWhere(fn ($sameDay) => $sameDay->whereColumn('newer.logged_on', 'diary_entries.logged_on')->whereColumn('newer.id', '>', 'diary_entries.id'))), 'newer_session_count')
            ->whereHas('playthrough.libraryEntry', fn (Builder $query) => $query->where('user_id', $request->user()->id));
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $query->whereHas('playthrough.libraryEntry.game', fn (Builder $query) => $query->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%']));
        }
        if ($from !== '') {
            $query->whereDate('logged_on', '>=', $from);
        }
        if ($to !== '') {
            $query->whereDate('logged_on', '<=', $to);
        }
        $sessions = (clone $query)->count();
        $minutes = (int) (clone $query)->sum('minutes_played');

        return Inertia::render('diary/index', [
            'sessions' => DiaryEntryResource::collection($query->with(['playthrough' => fn (BelongsTo $run) => $run->select('playthroughs.*')
                ->selectSub(DB::table('playthroughs as earlier')->selectRaw('1')->whereColumn('earlier.library_entry_id', 'playthroughs.library_entry_id')->whereColumn('earlier.id', '<', 'playthroughs.id')->limit(1), 'is_replay')
                ->with(['libraryEntry.rating', 'libraryEntry.review:id,library_entry_id,is_public', 'libraryEntry.game.genres', 'libraryEntry.game.platforms'])])
                ->orderByDesc('logged_on')->orderByDesc('id')->paginate(20)->withQueryString()),
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
