import type { CatalogPagination } from '@/types/catalog';

export type HistoryGame = { id: number; name: string; slug: string };
export type HistoryPlatform = { id: number; name: string };
export const playthroughStatuses = [
    { value: 'playing', label: 'Playing' },
    { value: 'completed', label: 'Completed' },
    { value: 'paused', label: 'Paused' },
    { value: 'dropped', label: 'Dropped' },
] as const;
export type Playthrough = {
    id: number;
    label: string | null;
    status: (typeof playthroughStatuses)[number]['value'];
    platform_id: number | null;
    platform: HistoryPlatform | null;
    started_on: string | null;
    finished_on: string | null;
    sessions_count: number;
    minutes_played: number;
    updated_at: string;
};
export type DiarySession = {
    id: number;
    logged_on: string;
    minutes_played: number | null;
    notes: string | null;
    updated_at: string;
    playthrough?: { id: number; label: string | null; game: HistoryGame };
};
export type DiaryIndexSession = DiarySession & {
    catalog_game: {
        id: number;
        name: string;
        slug: string;
        cover_url: string | null;
        released_on: string | null;
    };
    rating: number | null;
    is_favorite: boolean;
    has_review: boolean;
    is_replay: boolean;
    session_page: number;
};
export type HistoryPagination<T> = Omit<CatalogPagination, 'data'> & {
    data: T[];
};

export function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return hours
        ? `${hours}h${remainder ? ` ${remainder}m` : ''}`
        : `${remainder}m`;
}

export function formatHistoryDate(date: string): string {
    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}
