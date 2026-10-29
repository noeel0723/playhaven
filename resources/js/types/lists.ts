import type { CatalogGame } from '@/types/catalog';
import type { HistoryPagination } from '@/types/history';

export const listVisibilities = [
    { value: 'private', label: 'Private · only you' },
    { value: 'unlisted', label: 'Unlisted · anyone with the link' },
    { value: 'public', label: 'Public · discoverable by everyone' },
] as const;
export type GameList = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    visibility: (typeof listVisibilities)[number]['value'];
    items_count: number;
    owner: { id: number; name: string };
};
export type ListItem = {
    id: number;
    position: number;
    notes: string | null;
    game: CatalogGame;
};
export type ListPagination = HistoryPagination<GameList>;
export type ItemPagination = HistoryPagination<ListItem>;
