import type { CatalogGame } from '@/types/catalog';
import type { HistoryPagination } from '@/types/history';

export type PublicPlayer = {
    username: string;
    name: string;
    bio: string | null;
    avatar_url: string | null;
    followers_count: number;
    following_count: number;
    is_following: boolean;
    is_self: boolean;
};
export type CommunityReview = {
    id: number;
    body: string;
    contains_spoilers: boolean;
    updated_at: string;
    author: { username: string; name: string; avatar_url: string | null };
    rating: number | null;
    game: CatalogGame;
};
export type PlayerPagination = HistoryPagination<PublicPlayer>;
export type CommunityReviewPagination = HistoryPagination<CommunityReview>;
export type PlayerProfile = {
    username: string | null;
    display_name: string | null;
    bio: string | null;
    is_public: boolean;
    share_recent_completed: boolean;
    avatar_url: string | null;
};

export type CompletedGame = {
    game: CatalogGame;
    rating: number | null;
    completed_at: string | null;
};
