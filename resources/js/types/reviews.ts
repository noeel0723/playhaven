import type { CatalogPagination } from '@/types/catalog';

export type PersonalReview = {
    id: number;
    body: string;
    contains_spoilers: boolean;
    is_public: boolean;
    updated_at: string;
};

export type PublicReview = Omit<PersonalReview, 'is_public'> & {
    author: { name: string };
    rating: number | null;
};

export type ReviewPagination = Omit<CatalogPagination, 'data'> & {
    data: PublicReview[];
};
