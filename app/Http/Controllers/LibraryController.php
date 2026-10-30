<?php

namespace App\Http\Controllers;

use App\Enums\LibraryStatus;
use App\Http\Requests\LibraryFilterRequest;
use App\Http\Requests\SaveLibraryEntryRequest;
use App\Http\Resources\LibraryEntryResource;
use App\Models\Game;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LibraryController extends Controller
{
    public function index(LibraryFilterRequest $request): Response
    {
        $user = $request->user();
        $search = trim($request->string('q')->value());
        $status = $request->string('status')->value();
        $favorite = $request->boolean('favorite');
        $sort = $request->input('sort') ?: 'updated';
        $query = $user->libraryEntries()->with(['rating', 'game' => fn (BelongsTo $query) => $query
            ->with(['genres', 'platforms'])->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')]);

        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $query->whereHas('game', fn (Builder $query) => $query->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%']));
        }
        if ($status !== '') {
            $query->where('status', $status);
        }
        if ($favorite) {
            $query->where('is_favorite', true);
        }
        if ($sort === 'name') {
            $query->orderBy(Game::select('name')->whereColumn('games.id', 'library_entries.game_id'));
        } else {
            $query->orderByDesc('updated_at');
        }

        return Inertia::render('library/index', [
            'entries' => LibraryEntryResource::collection($query->orderByDesc('library_entries.id')->paginate(24)->withQueryString()),
            'counts' => $this->counts($user),
            'filters' => ['q' => $search, 'status' => $status, 'favorite' => $favorite, 'sort' => $sort],
        ]);
    }

    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        $entries = $user->libraryEntries()->with(['rating', 'game' => fn (BelongsTo $query) => $query
            ->with(['genres', 'platforms'])->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')])
            ->orderByDesc('updated_at')->orderByDesc('id')->limit(6)->get();

        return Inertia::render('dashboard', [
            'playerName' => $user->profile?->display_name ?: ($user->profile?->username ?: $user->name),
            'counts' => $this->counts($user),
            'recentEntries' => LibraryEntryResource::collection($entries)->resolve($request),
        ]);
    }

    public function save(SaveLibraryEntryRequest $request, Game $game): RedirectResponse
    {
        $request->user()->libraryEntries()->updateOrCreate(['game_id' => $game->id], $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your library has been updated.']);

        return to_route('games.show', $game->slug);
    }

    public function destroy(Request $request, Game $game): RedirectResponse
    {
        $request->validate(['confirm' => ['required', 'accepted']]);
        $request->user()->libraryEntries()->where('game_id', $game->id)->firstOrFail()->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Game removed from your library.']);

        return to_route('games.show', $game->slug);
    }

    /** @return array<string, int> */
    private function counts(User $user): array
    {
        $grouped = $user->libraryEntries()->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');
        $counts = [];
        foreach (LibraryStatus::cases() as $status) {
            $counts[$status->value] = (int) ($grouped[$status->value] ?? 0);
        }
        $counts['total'] = (int) $grouped->sum();
        $counts['favorites'] = $user->libraryEntries()->where('is_favorite', true)->count();

        return $counts;
    }
}
