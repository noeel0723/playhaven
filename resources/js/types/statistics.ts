import type { LibraryStatus } from '@/types/library';

export type ActivityMonth = {
    logs: number;
    month: number;
    sessions: number;
    minutes: number;
    timed_sessions: number;
    active_days: number;
};
export type PlayerStatistics = {
    release_years: {
        year: number;
        games: number;
        ratings_count: number;
        average: number | null;
    }[];
    undated_games: number;
    developers: { id: number; name: string; slug: string; games: number }[];
    developers_count: number;
    highest_rated: {
        id: number;
        name: string;
        slug: string;
        cover_url: string | null;
        rating: number;
    }[];
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
        logs: number;
        sessions: number;
        minutes: number;
        timed_sessions: number;
        active_days: number;
    };
    activity: {
        logs: number;
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
