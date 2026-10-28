export type CatalogTerm = { id: number; name: string; slug: string };

export type CatalogGame = {
    id: number;
    name: string;
    slug: string;
    released_on: string | null;
    cover_url: string | null;
    genres: CatalogTerm[];
    platforms: CatalogTerm[];
    rating: number | null;
    ratings_count: number;
    players_count: number;
    summary?: string | null;
    storyline?: string | null;
};

export type CatalogFilters = {
    q: string;
    genre: string;
    platform: string;
    year: number | null;
    sort: string;
};

export type CatalogPagination = {
    data: CatalogGame[];
    links: { prev: string | null; next: string | null };
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
};
