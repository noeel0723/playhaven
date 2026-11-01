import { Head, Link } from '@inertiajs/react';
import { PlayerPageLinks } from '@/components/player-page-navigation';
import PlayerProfileHeader from '@/components/player-profile-header';
import ProfileGameShelves from '@/components/profile-game-shelves';
import ProfileRecentActivity from '@/components/profile-recent-activity';
import ProfileReviewCard from '@/components/profile-review-card';
import { Button } from '@/components/ui/button';
import {
    edit,
    show,
    myFollowers,
    myFollowing,
    myReviews,
} from '@/routes/players';
import { index as library } from '@/routes/library';
import { index as diary } from '@/routes/diary';
import { index as stats } from '@/routes/stats';
import type { CatalogGame } from '@/types/catalog';
import type {
    OwnPlayer,
    ProfileGameActivity,
    RecentProfileReviews,
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
    reviews: RecentProfileReviews;
}) {
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title="Profile" />
            <PlayerProfileHeader
                name={player.name}
                username={player.username}
                avatarUrl={player.avatar_url}
                bio={player.bio}
                location={player.location}
                statistics={[
                    { label: 'Games', value: player.games_count },
                    {
                        label: 'Reviews',
                        value: reviews.meta.total,
                        href: myReviews.url(),
                    },
                    {
                        label: 'Following',
                        value: player.following_count,
                        href: myFollowing.url(),
                    },
                    {
                        label: 'Followers',
                        value: player.followers_count,
                        href: myFollowers.url(),
                    },
                ]}
                actions={
                    <>
                        <Button
                            asChild
                            variant="outline"
                            className="h-7 border-shadow bg-rein/60 px-2.5 text-[11px] text-[#f4f1ed] hover:bg-rein hover:text-white"
                        >
                            <Link href={edit()}>Edit profile</Link>
                        </Button>
                        <PlayerPageLinks username={player.username} own />
                    </>
                }
            />
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
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
                        className="mt-6"
                    >
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                            <h2
                                id="your-recent-reviews"
                                className="text-xs font-medium tracking-[0.1em] text-[#c5bfba] uppercase"
                            >
                                Recent reviews
                            </h2>
                            <Link
                                href={myReviews()}
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
                            <p className="py-3 text-xs leading-5 text-[#bdb6b1]">
                                Your reviews will appear here when you share
                                your thoughts about a game.
                            </p>
                        )}
                    </section>
                </div>
                <aside className="min-w-0 border-t border-white/10 pt-4 lg:border-t-0 lg:pt-0">
                    <h2 className="border-b border-white/10 pb-2 text-xs font-medium tracking-[0.1em] text-[#c5bfba] uppercase">
                        Your space
                    </h2>
                    <p className="mt-3 text-xs leading-5 text-[#bdb6b1]">
                        Private review text is visible only to you. Your diary
                        and statistics are visible to others when your profile
                        is public.
                    </p>
                    <p className="mt-2 text-[11px] leading-4 text-[#a9a19b]">
                        Public profile:{' '}
                        <span className="text-[#d5cec7]">
                            {player.is_public ? 'Visible' : 'Hidden'}
                        </span>
                    </p>
                    {player.is_public && player.username && (
                        <Link
                            href={show(player.username)}
                            className="mt-2 inline-flex min-h-7 items-center rounded-sm text-[11px] text-[#d5cec7] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            View public profile
                        </Link>
                    )}
                    <div className="mt-3 flex flex-col items-start gap-1 border-t border-white/10 pt-2 text-[11px] text-[#c5bfba] [&_a]:inline-flex [&_a]:min-h-7 [&_a]:items-center">
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
                            Statistic
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}
