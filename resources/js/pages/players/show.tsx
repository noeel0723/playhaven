import { Head, Link } from '@inertiajs/react';
import CommunityStory from '@/components/community-story';
import FollowPlayer from '@/components/follow-player';
import GameListCard from '@/components/game-list-card';
import HistoryPagination from '@/components/history-pagination';
import ProfileGameShelves from '@/components/profile-game-shelves';
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
            <Link
                href={index()}
                className="mb-8 inline-block text-sm text-[#bdb6b1] underline underline-offset-4"
            >
                All players
            </Link>
            <header className="mb-12 flex flex-wrap items-start justify-between gap-6 border-b border-white/10 pb-10">
                <div className="max-w-3xl min-w-0">
                    <p className="mb-3 text-xs tracking-[0.16em] text-[#bdb6b1]">
                        @{player.username}
                    </p>
                    <h1 className="font-serif text-4xl wrap-break-word sm:text-6xl">
                        {player.name}
                    </h1>
                    {player.bio && (
                        <p className="mt-5 text-sm leading-7 wrap-break-word whitespace-pre-wrap text-[#c5bfba]">
                            {player.bio}
                        </p>
                    )}
                    <div className="mt-6 flex flex-wrap gap-6 text-sm text-[#bdb6b1]">
                        <p>
                            <strong className="text-[#f4f1ed]">
                                {player.followers_count}
                            </strong>{' '}
                            {player.followers_count === 1
                                ? 'follower'
                                : 'followers'}
                        </p>
                        <p>
                            <strong className="text-[#f4f1ed]">
                                {player.following_count}
                            </strong>{' '}
                            following
                        </p>
                    </div>
                </div>
                <FollowPlayer player={player} />
            </header>
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10 xl:gap-14">
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
                    <section
                        aria-labelledby="player-profile-overview"
                        className="mb-10"
                    >
                        <h2
                            id="player-profile-overview"
                            className="border-b border-shadow pb-3 text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm"
                        >
                            A little perspective
                        </h2>
                        <div className="mt-5 grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-serif text-3xl">
                                    {reviews.meta.total}
                                </p>
                                <p className="mt-1 text-xs text-[#bdb6b1]">
                                    Public reviews
                                </p>
                            </div>
                            <div>
                                <p className="font-serif text-3xl">
                                    {lists.meta.total}
                                </p>
                                <p className="mt-1 text-xs text-[#bdb6b1]">
                                    Public lists
                                </p>
                            </div>
                        </div>
                        <p className="mt-5 text-xs leading-6 text-[#bdb6b1]">
                            Four favorites. New worlds finished. The stories
                            this player chooses to share.
                        </p>
                    </section>
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
                </aside>
            </div>
        </>
    );
}
