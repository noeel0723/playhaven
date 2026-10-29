import type { CatalogGame, CatalogPagination } from '@/types/catalog';

export const libraryStatuses = [
    { value: 'playing', label: 'Playing' },
    { value: 'completed', label: 'Completed' },
    { value: 'paused', label: 'Paused' },
    { value: 'dropped', label: 'Dropped' },
    { value: 'backlog', label: 'Backlog' },
] as const;

export type LibraryStatus = (typeof libraryStatuses)[number]['value'];
export type LibraryState = { status: LibraryStatus; is_favorite: boolean };
export type LibraryEntry = LibraryState & {
    id: number;
    updated_at: string;
    game: CatalogGame;
};
export type LibraryCounts = Record<
    LibraryStatus | 'total' | 'favorites',
    number
>;
export type LibraryPagination = Omit<CatalogPagination, 'data'> & {
    data: LibraryEntry[];
};
export type LibraryFilters = {
    q: string;
    status: string;
    favorite: boolean;
    sort: string;
};
