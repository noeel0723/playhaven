<?php

namespace App\Services;

use App\Models\Game;
use App\Services\Rawg\CatalogImage;
use App\Support\GameCoverUrl;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Facades\DB;

class WeeklyPopularGames
{
    /** @return Collection<int, Game> */
    public function between(CarbonImmutable $from, CarbonImmutable $to, int $limit = 6): Collection
    {
        $dates = [$from, $to];
        $activity = DB::table('library_entries')
            ->join('user_profiles', 'user_profiles.user_id', '=', 'library_entries.user_id')
            ->where('user_profiles.is_public', true)->whereNotNull('user_profiles.username')
            ->where(function (Builder $query) use ($dates): void {
                $query->whereBetween('library_entries.created_at', $dates)
                    ->orWhereBetween('library_entries.status_changed_at', $dates)
                    ->orWhereExists(fn (Builder $rating) => $rating->selectRaw('1')->from('ratings')
                        ->whereColumn('ratings.library_entry_id', 'library_entries.id')->whereBetween('ratings.updated_at', $dates))
                    ->orWhereExists(fn (Builder $review) => $review->selectRaw('1')->from('reviews')
                        ->whereColumn('reviews.library_entry_id', 'library_entries.id')->where('reviews.is_public', true)->whereBetween('reviews.updated_at', $dates));
            })
            ->select('library_entries.game_id')->selectRaw('COUNT(DISTINCT library_entries.user_id) AS weekly_players_count')->groupBy('library_entries.game_id');

        return Game::query()->select('games.*')->selectRaw('COALESCE(weekly_activity.weekly_players_count, 0) AS weekly_players_count')
            ->leftJoinSub($activity, 'weekly_activity', fn (JoinClause $join) => $join->on('weekly_activity.game_id', '=', 'games.id'))
            ->with(['genres', 'platforms'])->withCount(['ratings', 'libraryEntries as players_count'])->withAvg('ratings', 'score')
            ->orderByDesc('weekly_players_count')->orderByDesc('players_count')->orderByDesc('ratings_count')->orderBy('games.id')->limit($limit)->get();
    }

    /** @return array<string, mixed>|null */
    public function hero(?Game $game): ?array
    {
        if ($game === null) {
            return null;
        }
        $game->loadMissing('developers');

        return [
            'name' => $game->name, 'slug' => $game->slug,
            'banner_url' => CatalogImage::url($game->getAttribute('banner_url')),
            'cover_url' => GameCoverUrl::forGame($game),
            'developers' => $game->developers->pluck('name')->all(),
        ];
    }

    /** @return array<string, mixed>|null */
    public function currentHero(): ?array
    {
        $to = CarbonImmutable::now();

        return $this->hero($this->between($to->subDays(7), $to, 1)->first());
    }
}
