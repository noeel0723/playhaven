import type { LibraryStatus } from '@/types/library';

export type ActivityMonth = {
    month: number;
    sessions: number;
    minutes: number;
    timed_sessions: number;
    active_days: number;
};
export type PlayerStatistics = {
    library: {
        total: number;
        statuses: Record<LibraryStatus, number>;
        favorites: number;
        completed_percent: number;
    };
    ratings: {
        total: number;
        average: number | null;
        distribution: { stars: number; count: number }[];
    };
    diary: {
        sessions: number;
        minutes: number;
        timed_sessions: number;
        active_days: number;
    };
    activity: {
        year: number;
        available_years: number[];
        months: ActivityMonth[];
        sessions: number;
        minutes: number;
        timed_sessions: number;
        active_days: number;
    };
    most_played: {
        id: number;
        name: string;
        slug: string;
        minutes: number;
        sessions: number;
    }[];
    genres: { id: number; name: string; slug: string; games: number }[];
    platforms: {
        id: number;
        name: string;
        playthroughs: number;
        games: number;
    }[];
    playthroughs: number;
    unspecified_platform_runs: number;
};
