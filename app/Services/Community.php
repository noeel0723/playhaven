<?php

namespace App\Services;

use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Community
{
    /** @return Builder<User> */
    public function players(?User $viewer): Builder
    {
        $viewerId = $viewer === null ? 0 : $viewer->id;

        return User::publicPlayer()->with('profile')->withCount(['followers', 'following'])
            ->withExists(['followers as is_following' => fn (Builder $query) => $query->where('follows.follower_id', $viewerId)]);
    }

    /** @return Builder<Review> */
    public function reviews(): Builder
    {
        return Review::where('is_public', true)
            ->whereHas('libraryEntry.user', fn (Builder $query) => $query->publicPlayer())
            ->with(['libraryEntry.user.profile', 'libraryEntry.rating', 'libraryEntry.game' => fn (BelongsTo $query) => $query
                ->with(['genres', 'platforms'])->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')])
            ->orderByDesc('updated_at')->orderByDesc('id');
    }
}
