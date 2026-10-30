import { Head, Link } from '@inertiajs/react';
import HistoryPagination from '@/components/history-pagination';
import PlayerProfileHeader from '@/components/player-profile-header';
import ProfileGameShelves from '@/components/profile-game-shelves';
import ProfileRecentActivity from '@/components/profile-recent-activity';
import ProfileReviewCard from '@/components/profile-review-card';
import { Button } from '@/components/ui/button';
import { edit, show } from '@/routes/players';
import { index as library } from '@/routes/library';
import { index as diary } from '@/routes/diary';
import { index as stats } from '@/routes/stats';
import type { CatalogGame } from '@/types/catalog';
import type {
    OwnPlayer,
    ProfileGameActivity,
    ProfileReviewPagination,
} from '@/types/community';

export default function YourProfile({
    player,
    topGames,
    activities,
    reviews,
}: {
    player: OwnPlayer;
    topGames: CatalogGame[];
    activities: ProfileGameActivity[];
    reviews: ProfileReviewPagination;
}) {
    return (
        <>
            <Head title="Profile" />
            <PlayerProfileHeader
                name={player.name}
                username={player.username}
                avatarUrl={player.avatar_url}
                bio={player.bio}
                location={player.location}
                statistics={[
                    { label: 'Games', value: player.games_count },
                    { label: 'Reviews', value: reviews.meta.total },
                    { label: 'Following', value: player.following_count },
                    { label: 'Followers', value: player.followers_count },
                ]}
                actions={
                    <Button
                        asChild
                        variant="outline"
                        className="border-shadow bg-rein/60 text-[#f4f1ed] hover:bg-rein hover:text-white"
                    >
                        <Link href={edit()}>Edit profile</Link>
                    </Button>
                }
            />
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
                <div className="min-w-0">
                    <ProfileGameShelves
                        topGames={topGames}
                        recentCompleted={[]}
                        isOwner={false}
                        showEditLinks={false}
                        showRecentCompleted={false}
                        emptyTopGamesMessage="Your four favorite games will appear here once selected."
                    />
                    <ProfileRecentActivity activities={activities} />
                    <section
                        aria-labelledby="your-recent-reviews"
                        className="mt-10 sm:mt-12"
                    >
                        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-shadow pb-3">
                            <h2
                                id="your-recent-reviews"
                                className="text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm"
                            >
                                Recent reviews
                            </h2>
                            <span className="text-xs text-[#a9a19b]">
                                {reviews.meta.total}{' '}
                                {reviews.meta.total === 1
                                    ? 'review'
                                    : 'reviews'}
                            </span>
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
                            <p className="py-5 text-sm leading-7 text-[#bdb6b1]">
                                Your reviews will appear here when you share
                                your thoughts about a game.
                            </p>
                        )}
                        <HistoryPagination
                            pagination={reviews}
                            label="Your profile review pages"
                        />
                    </section>
                </div>
                <aside className="min-w-0 border-t border-shadow pt-7 lg:border-t-0 lg:pt-0">
                    <h2 className="border-b border-shadow pb-3 text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm">
                        Your space
                    </h2>
                    <p className="mt-5 text-sm leading-7 text-[#bdb6b1]">
                        This overview is just for you, including your private
                        reviews and recent game activity.
                    </p>
                    <p className="mt-4 text-xs leading-6 text-[#a9a19b]">
                        Public profile:{' '}
                        <span className="text-[#d5cec7]">
                            {player.is_public ? 'Visible' : 'Hidden'}
                        </span>
                    </p>
                    {player.is_public && player.username && (
                        <Link
                            href={show(player.username)}
                            className="mt-4 inline-block rounded-sm text-xs text-[#d5cec7] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            View public profile
                        </Link>
                    )}
                    <div className="mt-7 flex flex-col items-start gap-4 border-t border-white/10 pt-6 text-sm text-[#c5bfba]">
                        <Link
                            href={library()}
                            className="rounded-sm hover:underline focus-visible:outline-2"
                        >
                            Library
                        </Link>
                        <Link
                            href={diary()}
                            className="rounded-sm hover:underline focus-visible:outline-2"
                        >
                            Your diary
                        </Link>
                        <Link
                            href={stats()}
                            className="rounded-sm hover:underline focus-visible:outline-2"
                        >
                            Your statistics
                        </Link>
                    </div>
                </aside>
            </div>
        </>
    );
}
