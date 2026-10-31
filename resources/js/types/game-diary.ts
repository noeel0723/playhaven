import type { CatalogGame } from '@/types/catalog';
import type { LibraryStatus } from '@/types/library';

export type GameDiaryLog = {
    id: number;
    logged_on: string;
    status: LibraryStatus;
    completed_on: string | null;
    review_body: string | null;
    contains_spoilers: boolean;
    game: CatalogGame;
    rating: number | null;
};
