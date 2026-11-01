<?php

namespace App\Services;

use App\Enums\LibraryStatus;
use App\Models\Game;
use App\Models\User;
use App\Support\GameCoverUrl;
use Illuminate\Support\Facades\DB;

class PlayerStatistics
{
    /** @return array<string, mixed> */
    public function forUser(User $user, int $year): array
    {
        $statusRows = $user->libraryEntries()->selectRaw('status, COUNT(*) AS games')->groupBy('status')->pluck('games', 'status');
        $statuses = [];
        foreach (LibraryStatus::cases() as $status) {
            $statuses[$status->value] = (int) ($statusRows[$status->value] ?? 0);
        }
        $total = (int) $statusRows->sum();
        $ratingRows = $user->ratings()->selectRaw('score, COUNT(*) AS votes')->groupBy('score')->pluck('votes', 'score');
        $ratings = [];
        $ratingCount = 0;
        $scoreSum = 0;
        foreach (range(1, 10) as $score) {
            $count = (int) ($ratingRows[$score] ?? 0);
            $ratings[] = ['stars' => $score / 2, 'count' => $count];
            $ratingCount += $count;
            $scoreSum += $score * $count;
        }

        $sessions = DB::table('diary_entries')->join('playthroughs', 'playthroughs.id', '=', 'diary_entries.playthrough_id')
            ->join('library_entries', 'library_entries.id', '=', 'playthroughs.library_entry_id')->where('library_entries.user_id', $user->id);
        $dayExpression = 'SUBSTR(CAST(diary_entries.logged_on AS TEXT), 1, 10)';
        $totals = (clone $sessions)->selectRaw('COUNT(*) AS sessions, COALESCE(SUM(minutes_played), 0) AS minutes, COUNT(minutes_played) AS timed_sessions, COUNT(DISTINCT '.$dayExpression.') AS active_days')->first();
        $yearExpression = 'SUBSTR(CAST(diary_entries.logged_on AS TEXT), 1, 4)';
        $gameLogs = DB::table('game_diary_logs')->join('library_entries', 'library_entries.id', '=', 'game_diary_logs.library_entry_id')->where('library_entries.user_id', $user->id);
        $logYearExpression = 'SUBSTR(CAST(game_diary_logs.logged_on AS TEXT), 1, 4)';
        $logYears = (clone $gameLogs)->selectRaw($logYearExpression.' AS year')->groupByRaw($logYearExpression)->pluck('year');
        $years = (clone $sessions)->selectRaw($yearExpression.' AS year')->groupByRaw($yearExpression)->pluck('year')
            ->merge($logYears)
            ->map(fn ($value): int => (int) $value)->push(now()->year, $year)
            ->filter(fn (int $value): bool => $value >= 1 && $value <= now()->year)->unique()->sortDesc()->values()->all();
        $monthExpression = 'SUBSTR(CAST(diary_entries.logged_on AS TEXT), 6, 2)';
        $calendarYear = str_pad((string) $year, 4, '0', STR_PAD_LEFT);
        $nextYear = str_pad((string) ($year + 1), 4, '0', STR_PAD_LEFT);
        $monthlyRows = (clone $sessions)->where('diary_entries.logged_on', '>=', $calendarYear.'-01-01')->where('diary_entries.logged_on', '<', $nextYear.'-01-01')
            ->selectRaw($monthExpression.' AS month, COUNT(*) AS sessions, COALESCE(SUM(minutes_played), 0) AS minutes, COUNT(minutes_played) AS timed_sessions, COUNT(DISTINCT '.$dayExpression.') AS active_days')
            ->groupByRaw($monthExpression)->get()->keyBy(fn (object $row): int => (int) $row->month);
        $months = [];
        $logMonthExpression = 'SUBSTR(CAST(game_diary_logs.logged_on AS TEXT), 6, 2)';
        $monthlyLogs = (clone $gameLogs)->where('game_diary_logs.logged_on', '>=', $calendarYear.'-01-01')->where('game_diary_logs.logged_on', '<', $nextYear.'-01-01')
            ->selectRaw($logMonthExpression.' AS month, COUNT(*) AS logs')->groupByRaw($logMonthExpression)->pluck('logs', 'month');
        foreach (range(1, 12) as $month) {
            $row = $monthlyRows->get($month);
            $months[] = ['month' => $month, 'sessions' => (int) ($row->sessions ?? 0), 'minutes' => (int) ($row->minutes ?? 0),
                'timed_sessions' => (int) ($row->timed_sessions ?? 0), 'active_days' => (int) ($row->active_days ?? 0),
                'logs' => (int) ($monthlyLogs->get(str_pad((string) $month, 2, '0', STR_PAD_LEFT)) ?? 0)];
        }

        $topGames = (clone $sessions)->join('games', 'games.id', '=', 'library_entries.game_id')
            ->select(['games.id', 'games.name', 'games.slug'])->selectRaw('SUM(minutes_played) AS minutes, COUNT(*) AS sessions')
            ->groupBy('games.id', 'games.name', 'games.slug')->havingRaw('SUM(minutes_played) > 0')
            ->orderByDesc('minutes')->orderBy('games.id')->limit(5)->get()
            ->map(fn (object $row): array => ['id' => (int) $row->id, 'name' => $row->name, 'slug' => $row->slug, 'minutes' => (int) $row->minutes, 'sessions' => (int) $row->sessions])->all();
        $genres = DB::table('genres')->join('game_genre', 'game_genre.genre_id', '=', 'genres.id')
            ->join('library_entries', 'library_entries.game_id', '=', 'game_genre.game_id')
            ->where('library_entries.user_id', $user->id)->whereNotNull('library_entries.status')
            ->select(['genres.id', 'genres.name', 'genres.slug'])->selectRaw('COUNT(DISTINCT library_entries.game_id) AS games')
            ->groupBy('genres.id', 'genres.name', 'genres.slug')->orderByDesc('games')->orderBy('genres.name')->orderBy('genres.id')->limit(8)->get()
            ->map(fn (object $row): array => ['id' => (int) $row->id, 'name' => $row->name, 'slug' => $row->slug, 'games' => (int) $row->games])->all();
        $platformRows = DB::table('playthroughs')->join('library_entries', 'library_entries.id', '=', 'playthroughs.library_entry_id')
            ->leftJoin('platforms', 'platforms.id', '=', 'playthroughs.platform_id')->where('library_entries.user_id', $user->id)
            ->select(['platforms.id', 'platforms.name'])->selectRaw('COUNT(*) AS runs, COUNT(DISTINCT library_entries.game_id) AS games')
            ->groupBy('platforms.id', 'platforms.name')->orderByDesc('runs')->orderBy('platforms.id')->get();
        $platforms = $platformRows->filter(fn (object $row): bool => $row->id !== null)->take(8)
            ->map(fn (object $row): array => ['id' => (int) $row->id, 'name' => $row->name, 'playthroughs' => (int) $row->runs, 'games' => (int) $row->games])->values()->all();
        $unknownPlatform = $platformRows->first(fn (object $row): bool => $row->id === null);

        $releaseYearExpression = 'SUBSTR(CAST(games.released_on AS TEXT), 1, 4)';
        $releaseYears = DB::table('library_entries')->join('games', 'games.id', '=', 'library_entries.game_id')
            ->leftJoin('ratings', 'ratings.library_entry_id', '=', 'library_entries.id')
            ->where('library_entries.user_id', $user->id)->whereNotNull('games.released_on')
            ->selectRaw($releaseYearExpression.' AS year, COUNT(DISTINCT games.id) AS games, COUNT(ratings.id) AS ratings_count, AVG(ratings.score) AS average_score')
            ->groupByRaw($releaseYearExpression)->orderBy('year')->get()
            ->map(fn (object $row): array => ['year' => (int) $row->year, 'games' => (int) $row->games, 'ratings_count' => (int) $row->ratings_count,
                'average' => $row->average_score === null ? null : round((float) $row->average_score / 2, 1)])->all();
        $developersQuery = DB::table('developers')->join('developer_game', 'developer_game.developer_id', '=', 'developers.id')
            ->join('library_entries', 'library_entries.game_id', '=', 'developer_game.game_id')
            ->where('library_entries.user_id', $user->id)->whereNotNull('library_entries.status');
        $developerCount = (clone $developersQuery)->distinct()->count('developers.id');
        $developers = $developersQuery->select(['developers.id', 'developers.name', 'developers.slug'])->selectRaw('COUNT(DISTINCT library_entries.game_id) AS games')
            ->groupBy('developers.id', 'developers.name', 'developers.slug')->orderByDesc('games')->orderBy('developers.name')->orderBy('developers.id')->limit(8)->get()
            ->map(fn (object $row): array => ['id' => (int) $row->id, 'name' => $row->name, 'slug' => $row->slug, 'games' => (int) $row->games])->all();
        $highestRated = Game::query()->join('library_entries', 'library_entries.game_id', '=', 'games.id')
            ->join('ratings', 'ratings.library_entry_id', '=', 'library_entries.id')->where('library_entries.user_id', $user->id)
            ->select('games.*')->selectRaw('ratings.score AS personal_score')->orderByDesc('ratings.score')->orderBy('games.id')->limit(6)->get()
            ->map(fn (Game $game): array => ['id' => $game->id, 'name' => $game->name, 'slug' => $game->slug,
                'cover_url' => GameCoverUrl::forGame($game), 'rating' => (int) $game->getAttribute('personal_score') / 2])->all();

        return [
            'library' => ['total' => $total, 'statuses' => $statuses, 'favorites' => $user->libraryEntries()->where('is_favorite', true)->count(),
                'completed_percent' => $total > 0 ? round($statuses['completed'] / $total * 100, 1) : 0],
            'ratings' => ['total' => $ratingCount, 'average' => $ratingCount > 0 ? round($scoreSum / $ratingCount / 2, 1) : null, 'distribution' => $ratings],
            'diary' => ['logs' => (clone $gameLogs)->count(), 'sessions' => (int) ($totals->sessions ?? 0), 'minutes' => (int) ($totals->minutes ?? 0),
                'timed_sessions' => (int) ($totals->timed_sessions ?? 0), 'active_days' => (int) ($totals->active_days ?? 0)],
            'activity' => ['year' => $year, 'available_years' => $years, 'months' => $months,
                'logs' => array_sum(array_column($months, 'logs')),
                'sessions' => array_sum(array_column($months, 'sessions')), 'minutes' => array_sum(array_column($months, 'minutes')),
                'timed_sessions' => array_sum(array_column($months, 'timed_sessions')), 'active_days' => array_sum(array_column($months, 'active_days'))],
            'most_played' => $topGames,
            'genres' => $genres,
            'platforms' => $platforms,
            'playthroughs' => (int) $platformRows->sum('runs'),
            'unspecified_platform_runs' => (int) ($unknownPlatform->runs ?? 0),
            'release_years' => $releaseYears,
            'undated_games' => $total - array_sum(array_column($releaseYears, 'games')),
            'developers' => $developers,
            'developers_count' => $developerCount,
            'highest_rated' => $highestRated,
        ];
    }
}
