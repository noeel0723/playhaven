import { Head, Link } from '@inertiajs/react';
import CommunityStory from '@/components/community-story';
import FollowPlayer from '@/components/follow-player';
import GameListCard from '@/components/game-list-card';
import HistoryPagination from '@/components/history-pagination';
import ProfileGameShelves from '@/components/profile-game-shelves';
import PlayerProfileHeader from '@/components/player-profile-header';
import { index } from '@/routes/players';
import type {
    CommunityReviewPagination,
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
    recentCompletedShared,
}: {
    player: PublicPlayer;
    reviews: CommunityReviewPagination;
    lists: ListPagination;
    topGames: CatalogGame[];
    recentCompleted: CompletedGame[];
    recentCompletedShared: boolean;
}) {
    return (
        <>
            <Head title={`${player.name} (@${player.username})`} />
            <PlayerProfileHeader
                name={player.name}
                username={player.username}
                avatarUrl={player.avatar_url}
                bio={player.bio}
                actions={<FollowPlayer player={player} />}
                statistics={[
                    { label: 'Public reviews', value: reviews.meta.total },
                    { label: 'Public lists', value: lists.meta.total },
                    { label: 'Following', value: player.following_count },
                    { label: 'Followers', value: player.followers_count },
                ]}
            />
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
                <div className="min-w-0">
                    <ProfileGameShelves
                        topGames={topGames}
                        recentCompleted={recentCompleted}
                        recentCompletedShared={recentCompletedShared}
                        isOwner={player.is_self}
                    />
                    <section aria-labelledby="player-stories" className="mt-12">
                        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-shadow pb-3">
                            <h2
                                id="player-stories"
                                className="text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm"
                            >
                                Public reviews
                            </h2>
                            <p className="text-xs text-[#bdb6b1]">
                                {reviews.meta.total} public reviews
                            </p>
                        </div>
                        {reviews.data.length ? (
                            <div className="space-y-5">
                                {reviews.data.map((review) => (
                                    <CommunityStory
                                        key={`${review.id}:${review.updated_at}`}
                                        review={review}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-xl border border-dashed border-shadow p-8 text-sm text-[#bdb6b1]">
                                No public reviews to share yet.
                            </p>
                        )}
                        <HistoryPagination
                            pagination={reviews}
                            label="Player review pages"
                        />
                    </section>
                </div>
                <aside className="min-w-0 border-t border-shadow pt-7 lg:border-t-0 lg:pt-0">
                    <section aria-labelledby="player-lists">
                        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-shadow pb-3">
                            <h2
                                id="player-lists"
                                className="text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm"
                            >
                                Curated worlds
                            </h2>
                            <p className="text-xs text-[#bdb6b1]">
                                {lists.meta.total} public lists
                            </p>
                        </div>
                        {lists.data.length ? (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                                {lists.data.map((list) => (
                                    <GameListCard key={list.id} list={list} />
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-xl border border-dashed border-shadow p-8 text-sm text-[#bdb6b1]">
                                No public lists yet.
                            </p>
                        )}
                        <HistoryPagination
                            pagination={lists}
                            label="Player list pages"
                        />
                    </section>
                    <Link
                        href={index()}
                        className="mt-8 inline-block rounded-sm text-xs text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                        All players
                    </Link>
                </aside>
            </div>
        </>
    );
}
