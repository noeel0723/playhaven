<?php

namespace App\Services;

use App\Enums\ListVisibility;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class PlayerDirectory
{
    public function __construct(private Community $community) {}

    /** @return Builder<User> */
    public function players(?User $viewer, string $search = ''): Builder
    {
        $players = $this->community->players($viewer)->withCount([
            'reviews as public_reviews_count' => fn (Builder $query) => $query->where('is_public', true),
            'gameLists as public_lists_count' => fn (Builder $query) => $query->where('visibility', ListVisibility::Public),
        ]);
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $players->whereHas('profile', fn (Builder $profile) => $profile->where(fn (Builder $query) => $query
                ->whereRaw("LOWER(username) LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])
                ->orWhereRaw("LOWER(display_name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])));
        }

        return $players->orderByDesc('followers_count')->orderBy('users.id');
    }
}
