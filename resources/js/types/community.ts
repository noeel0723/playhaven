import type { CatalogGame } from '@/types/catalog';
import type { HistoryPagination } from '@/types/history';

export type PublicPlayer = {
    username: string;
    name: string;
    bio: string | null;
    location: string | null;
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
export type DiscoveredPlayer = PublicPlayer & {
    public_reviews_count: number;
    top_games: Pick<CatalogGame, 'id' | 'name' | 'slug' | 'cover_url'>[];
};
export type PlayerPagination = HistoryPagination<DiscoveredPlayer>;
export type CommunityReviewPagination = HistoryPagination<CommunityReview>;
export type PlayerProfile = {
    username: string | null;
    display_name: string | null;
    bio: string | null;
    location: string | null;
    is_public: boolean;
    avatar_url: string | null;
};

export type CompletedGame = {
    game: CatalogGame;
    rating: number | null;
    completed_at: string | null;
};

export type ProfileGameActivity = {
    game: CatalogGame;
    status: 'playing' | 'completed' | 'paused' | 'dropped' | null;
    rating: number | null;
    has_review: boolean;
    occurred_at: string;
};
export type ProfileReview = Omit<CommunityReview, 'author'> & {
    is_public?: boolean;
};
export type ProfileReviewPagination = HistoryPagination<ProfileReview>;
export type OwnPlayer = {
    name: string;
    username: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    is_public: boolean;
    followers_count: number;
    following_count: number;
    games_count: number;
};

export type FriendShelfGame = Pick<
    CatalogGame,
    'id' | 'name' | 'slug' | 'cover_url'
>;
export type FriendStatusActivity = {
    game: FriendShelfGame;
    status: 'playing' | 'paused' | 'completed';
    changed_at: string | null;
    player: { username: string; name: string; avatar_url: string | null };
};
export type FriendShelves = {
    recent: FriendStatusActivity[];
    popular: { game: FriendShelfGame; friends_count: number }[];
};
