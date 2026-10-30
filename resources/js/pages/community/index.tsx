import { Head, Link, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';
import CommunityStory from '@/components/community-story';
import FriendGameShelves from '@/components/friend-game-shelves';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/community';
import { index as players, me } from '@/routes/players';
import type {
    CommunityReviewPagination,
    FriendShelves,
} from '@/types/community';

export default function Community({
    reviews,
    feed,
    friendShelves,
}: {
    reviews: CommunityReviewPagination;
    feed: 'everyone' | 'following';
    friendShelves: FriendShelves | null;
}) {
    const { auth } = usePage().props;
    return (
        <div className="mx-auto max-w-4xl">
            <Head title="Community" />
            <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <h1 className="text-xl font-medium tracking-tight">
                    Community
                </h1>
                <div className="flex flex-wrap gap-1.5">
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 border-white/10 bg-rein/20 px-2.5 text-[11px] text-[#e0d9d3] hover:bg-rein hover:text-white [&_svg]:size-3.5"
                    >
                        <Link href={players()}>
                            <Users aria-hidden="true" />
                            Find players
                        </Link>
                    </Button>
                    {auth.user && (
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-[11px] text-[#bdb6b1] hover:bg-rein/40 hover:text-white"
                        >
                            <Link href={me()}>Profile</Link>
                        </Button>
                    )}
                </div>
            </header>
            {friendShelves && <FriendGameShelves shelves={friendShelves} />}
            <section
                aria-labelledby="community-reviews"
                className="mx-auto max-w-2xl"
            >
                <h2
                    className="mb-3 text-xs font-medium tracking-[0.12em] text-[#c5bfba] uppercase"
                    id="community-reviews"
                >
                    Reviews
                </h2>
                <nav
                    aria-label="Community feed"
                    className="mb-3 flex gap-3 border-b border-white/10"
                >
                    {(['everyone', 'following'] as const).map((tab) => (
                        <Link
                            key={tab}
                            href={index({ query: { feed: tab } })}
                            aria-current={feed === tab ? 'page' : undefined}
                            className={`inline-flex min-h-8 items-center border-b-2 px-2 pb-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 ${feed === tab ? 'border-[#e0d9d3] text-white' : 'border-transparent text-[#bdb6b1] hover:text-white'}`}
                        >
                            {tab === 'everyone' ? 'Everyone' : 'Following'}
                        </Link>
                    ))}
                </nav>
                {reviews.data.length ? (
                    <div className="space-y-2">
                        {reviews.data.map((review) => (
                            <CommunityStory
                                key={`${review.id}:${review.updated_at}`}
                                review={review}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed border-shadow px-4 py-7 text-center">
                        <Users
                            className="mx-auto mb-2 size-5 text-mustang"
                            aria-hidden="true"
                        />
                        <h3 className="text-sm font-medium">
                            {feed === 'following'
                                ? 'No reviews from players you follow.'
                                : 'No reviews yet.'}
                        </h3>
                        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#bdb6b1]">
                            {feed === 'following'
                                ? 'Follow players to see their public reviews here. Their private library and diary stay private.'
                                : 'Reviews appear here when their author has a public player profile and chooses to publish them.'}
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="mt-3 h-7 border-white/10 bg-rein/20 px-2.5 text-[11px] text-[#e0d9d3] hover:bg-rein hover:text-white"
                        >
                            <Link href={players()}>Discover players</Link>
                        </Button>
                    </div>
                )}
                <HistoryPagination
                    pagination={reviews}
                    label="Community review pages"
                    compact
                    dense
                />
            </section>
        </div>
    );
}
