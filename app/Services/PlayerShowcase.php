<?php

namespace App\Services;

use App\Enums\LibraryStatus;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerShowcase
{
    /** @return Collection<int, Game> */
    public function topGames(UserProfile $profile): Collection
    {
        return $profile->topGames()->with(['genres', 'platforms'])
            ->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')->get();
    }

    /** @return Collection<int, LibraryEntry> */
    public function completed(User $user): Collection
    {
        return $user->libraryEntries()->where('status', LibraryStatus::Completed)
            ->with(['rating', 'game' => fn (BelongsTo $query) => $query->with(['genres', 'platforms'])
                ->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')])
            ->orderByRaw('completed_at DESC NULLS LAST')->orderByDesc('id')->limit(4)->get();
    }

    /** @return Collection<int, Game> */
    public function search(string $search): Collection
    {
        $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));

        return Game::with(['genres', 'platforms'])->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')
            ->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])->orderBy('name')->orderBy('id')->limit(12)->get();
    }
}
