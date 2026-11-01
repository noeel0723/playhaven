import { Head, Link } from '@inertiajs/react';
import ProfileReviewCard from '@/components/profile-review-card';
import FollowPlayer from '@/components/follow-player';
import GameListCard from '@/components/game-list-card';
import HistoryPagination from '@/components/history-pagination';
import ProfileGameShelves from '@/components/profile-game-shelves';
import PlayerProfileHeader from '@/components/player-profile-header';
import PlayerRelationship from '@/components/player-relationship';
import { PlayerPageLinks } from '@/components/player-page-navigation';
import {
    index,
    followers,
    following,
    reviews as playerReviews,
} from '@/routes/players';
import type {
    RecentProfileReviews,
    PublicPlayer,
    CompletedGame,
} from '@/types/community';
import type { ListPagination } from '@/types/lists';
import type { CatalogGame } from '@/types/catalog';

export default function Player({
    player,
    reviews,
    lists,
    topGames,
    recentCompleted,
}: {
    player: PublicPlayer;
    reviews: RecentProfileReviews;
    lists: ListPagination;
    topGames: CatalogGame[];
    recentCompleted: CompletedGame[];
}) {
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title={`${player.name} (@${player.username})`} />
            <PlayerProfileHeader
                name={player.name}
                username={player.username}
                avatarUrl={player.avatar_url}
                bio={player.bio}
                location={player.location}
                relationship={<PlayerRelationship player={player} />}
                actions={
                    <>
                        <FollowPlayer player={player} />
                        <PlayerPageLinks username={player.username} />
                    </>
                }
                statistics={[
                    {
                        label: 'Public reviews',
                        value: reviews.meta.total,
                        href: playerReviews.url(player.username),
                    },
                    { label: 'Public lists', value: lists.meta.total },
                    {
                        label: 'Following',
                        value: player.following_count,
                        href: following.url(player.username),
                    },
                    {
                        label: 'Followers',
                        value: player.followers_count,
                        href: followers.url(player.username),
                    },
                ]}
            />
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div className="min-w-0">
                    <ProfileGameShelves
                        topGames={topGames}
                        recentCompleted={recentCompleted}
                        isOwner={player.is_self}
                        showEditLinks={false}
                        emptyTopGamesMessage={
                            player.is_self
                                ? 'Your four favorite games will appear here once selected.'
                                : undefined
                        }
                    />
                    <section aria-labelledby="player-stories" className="mt-6">
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                            <h2
                                id="player-stories"
                                className="text-xs font-medium tracking-[0.1em] text-[#c5bfba] uppercase"
                            >
                                Recent reviews
                            </h2>
                            <Link
                                href={playerReviews(player.username)}
                                className="inline-flex min-h-7 items-center rounded-sm text-[11px] text-[#bdb6b1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                More
                            </Link>
                        </div>
                        {reviews.data.length ? (
                            <div>
                                {reviews.data.map((review) => (
                                    <ProfileReviewCard
                                        key={`${review.id}:${review.updated_at}`}
                                        review={review}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-md border border-dashed border-shadow p-3 text-xs leading-5 text-[#bdb6b1]">
                                No public reviews to share yet.
                            </p>
                        )}
                    </section>
                </div>
                <aside className="min-w-0 border-t border-white/10 pt-4 lg:border-t-0 lg:pt-0">
                    <section aria-labelledby="player-lists">
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                            <h2
                                id="player-lists"
                                className="text-xs font-medium tracking-[0.1em] text-[#c5bfba] uppercase"
                            >
                                Curated worlds
                            </h2>
                            <p className="text-[11px] text-[#bdb6b1]">
                                {lists.meta.total} public lists
                            </p>
                        </div>
                        {lists.data.length ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                                {lists.data.map((list) => (
                                    <GameListCard
                                        key={list.id}
                                        list={list}
                                        compact
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-md border border-dashed border-shadow p-3 text-xs leading-5 text-[#bdb6b1]">
                                No public lists yet.
                            </p>
                        )}
                        <HistoryPagination
                            pagination={lists}
                            label="Player list pages"
                            dense
                            preserveState
                        />
                    </section>
                    <Link
                        href={index()}
                        className="mt-3 inline-flex min-h-7 items-center rounded-sm text-[11px] text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                        All players
                    </Link>
                </aside>
            </div>
        </div>
    );
}
