<?php

namespace App\Http\Controllers;

use App\Enums\LibraryStatus;
use App\Http\Requests\GameDiaryFilterRequest;
use App\Http\Requests\LogGameDiaryRequest;
use App\Http\Resources\GameDiaryLogResource;
use App\Models\Game;
use App\Models\GameDiaryLog;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class GameDiaryController extends Controller
{
    public function index(GameDiaryFilterRequest $request): Response
    {
        $query = GameDiaryLog::query()->whereHas('libraryEntry', fn (Builder $entry) => $entry->where('user_id', $request->user()->id));
        $search = trim($request->string('q')->value());
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $query->whereHas('libraryEntry.game', fn (Builder $game) => $game->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%']));
        }
        foreach (['from' => '>=', 'to' => '<='] as $field => $operator) {
            if ($request->filled($field)) {
                $query->whereDate('logged_on', $operator, $request->string($field)->value());
            }
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->value());
        }

        $response = Inertia::render('diary/index', [
            'logs' => GameDiaryLogResource::collection($query->with(['libraryEntry.game.genres', 'libraryEntry.game.platforms', 'libraryEntry.rating'])
                ->orderByDesc('logged_on')->orderByDesc('id')->paginate(20)->withQueryString()),
            'filters' => ['q' => $search, 'status' => $request->string('status')->value(), 'from' => $request->string('from')->value(), 'to' => $request->string('to')->value()],
            'today' => now()->toDateString(),
        ])->toResponse($request);
        $response->headers->set('Cache-Control', 'private, no-store');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }

    public function options(Request $request, Game $game): JsonResponse
    {
        $entry = $request->user()->libraryEntries()->with(['review', 'rating'])->where('game_id', $game->id)->first();

        return response()->json([
            'today' => now()->toDateString(),
            'status' => $entry?->status?->value,
            'completed_on' => $entry?->completed_at?->format('Y-m-d'),
            'stars' => $entry?->rating?->stars,
            'review' => $entry?->review ? [
                'body' => $entry->review->getAttribute('body'),
                'contains_spoilers' => (bool) $entry->review->contains_spoilers,
                'is_public' => (bool) $entry->review->is_public,
            ] : null,
        ])->header('Cache-Control', 'private, no-store');
    }

    public function store(LogGameDiaryRequest $request, Game $game): RedirectResponse
    {
        DB::transaction(function () use ($request, $game): void {
            $entry = $request->user()->libraryEntries()->firstOrCreate(['game_id' => $game->id], ['status' => null, 'is_favorite' => false]);
            $entry = $request->user()->libraryEntries()->whereKey($entry->id)->lockForUpdate()->firstOrFail();
            $entry->status = LibraryStatus::from($request->string('status')->value());
            $entry->completed_at = $entry->status === LibraryStatus::Completed
                ? CarbonImmutable::parse($request->validated('completed_on'), 'UTC')->startOfDay() : null;
            $entry->save();
            if (array_key_exists('stars', $request->validated())) {
                $stars = $request->validated('stars');
                if ($stars === null) {
                    $entry->rating()->delete();
                } else {
                    $entry->rating()->updateOrCreate([], ['score' => (int) ((float) $stars * 2)]);
                }
            }
            $body = $request->validated('review_body');
            if (is_string($body) && $body !== '') {
                $entry->review()->updateOrCreate([], [
                    'body' => $body,
                    'contains_spoilers' => $request->boolean('contains_spoilers'),
                    'is_public' => $request->boolean('is_public'),
                ]);
            }
            GameDiaryLog::create([
                'library_entry_id' => $entry->id,
                'status' => $request->validated('status'),
                'logged_on' => $request->validated('logged_on'),
                'completed_on' => $request->validated('completed_on'),
                'review_body' => $body === '' ? null : $body,
                'contains_spoilers' => is_string($body) && $body !== '' && $request->boolean('contains_spoilers'),
            ]);
            $entry->touch();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Game logged. Your library has been updated.']);

        return $request->boolean('return_to_diary') ? to_route('diary.index') : to_route('games.show', $game->slug);
    }

    public function destroy(Request $request, GameDiaryLog $gameDiaryLog): RedirectResponse
    {
        $request->validate(['confirm' => ['required', 'accepted']]);
        DB::transaction(function () use ($request, $gameDiaryLog): void {
            $request->user()->libraryEntries()->whereKey($gameDiaryLog->library_entry_id)->lockForUpdate()->firstOrFail();
            GameDiaryLog::whereKey($gameDiaryLog->id)->lockForUpdate()->firstOrFail()->delete();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Diary log deleted. Your library and review are unchanged.']);

        return to_route('diary.index');
    }
}
