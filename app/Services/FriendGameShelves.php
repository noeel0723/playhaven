<?php

namespace App\Services;

use App\Enums\LibraryStatus;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\User;
use App\Support\GameCoverUrl;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class FriendGameShelves
{
    /** @return array{recent: list<array<string, mixed>>, popular: list<array<string, mixed>>} */
    public function forUser(User $viewer): array
    {
        $eligible = LibraryEntry::query()->where('user_id', '<>', $viewer->id)
            ->whereIn('status', [LibraryStatus::Playing, LibraryStatus::Paused, LibraryStatus::Completed])
            ->whereHas('user', fn (Builder $query) => $query->publicPlayer()
                ->whereHas('followers', fn (Builder $follow) => $follow->where('follows.follower_id', $viewer->id)));
        // Metadata edits do not become playing activity. Legacy completion dates
        // are known; other legacy status dates remain unknown.
        $activityDate = "COALESCE(library_entries.status_changed_at, CASE WHEN library_entries.status = 'completed' THEN library_entries.completed_at ELSE NULL END)";
        $recent = (clone $eligible)->select('library_entries.*')->selectRaw("$activityDate AS activity_at")
            ->with(['user.profile', 'game'])->orderByRaw('activity_at DESC NULLS LAST')->orderByDesc('library_entries.id')->limit(12)->get();
        $popular = (clone $eligible)->select('game_id')->selectRaw('COUNT(DISTINCT user_id) AS friends_count')
            ->selectRaw("MAX($activityDate) AS latest_activity_at")->with('game')->groupBy('game_id')
            ->orderByDesc('friends_count')->orderByRaw('latest_activity_at DESC NULLS LAST')->orderBy('game_id')->limit(12)->get();

        return [
            'recent' => array_values($recent->filter(fn (LibraryEntry $entry) => $entry->user->profile?->is_public && $entry->user->profile->username)
                ->map(function (LibraryEntry $entry): array {
                    $profile = $entry->user->profile;

                    return ['game' => $this->game($entry->game), 'status' => $entry->status?->value,
                        'changed_at' => $entry->getAttribute('activity_at') ? CarbonImmutable::parse($entry->getAttribute('activity_at'))->toISOString() : null,
                        'player' => ['username' => $profile->username, 'name' => $profile->display_name ?: $profile->username, 'avatar_url' => ProfilePhotos::url($profile)]];
                })->all()),
            'popular' => array_values($popular->map(fn (LibraryEntry $entry) => ['game' => $this->game($entry->game), 'friends_count' => (int) $entry->getAttribute('friends_count')])->all()),
        ];
    }

    /** @return array{id: int, name: string, slug: string, cover_url: string|null} */
    private function game(Game $game): array
    {
        return ['id' => $game->id, 'name' => $game->name, 'slug' => $game->slug, 'cover_url' => GameCoverUrl::forGame($game)];
    }
}
