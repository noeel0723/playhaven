import { Head, Link, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';
import CommunityStory from '@/components/community-story';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/community';
import { index as players, edit } from '@/routes/players';
import type { CommunityReviewPagination } from '@/types/community';

export default function Community({
    reviews,
    feed,
}: {
    reviews: CommunityReviewPagination;
    feed: 'everyone' | 'following';
}) {
    const { auth } = usePage().props;
    return (
        <>
            <Head title="Community" />
            <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
                <div>
                    <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                        More worlds. More perspectives.
                    </p>
                    <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
                        Stories from{' '}
                        <span className="font-serif font-normal text-[#c5bfba] italic">
                            the community.
                        </span>
                    </h1>
                    <p className="mt-5 max-w-xl text-sm leading-7 text-[#bdb6b1]">
                        Public reviews from players who share your curiosity.
                        Find a voice you connect with, and follow their next
                        chapter.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href={players()}>
                            <Users aria-hidden="true" />
                            Find players
                        </Link>
                    </Button>
                    {auth.user && (
                        <Button asChild variant="ghost">
                            <Link href={edit()}>Your player profile</Link>
                        </Button>
                    )}
                </div>
            </header>
            <nav
                aria-label="Community feed"
                className="mb-8 flex gap-7 border-b border-white/10"
            >
                {(['everyone', 'following'] as const).map((tab) => (
                    <Link
                        key={tab}
                        href={index({ query: { feed: tab } })}
                        aria-current={feed === tab ? 'page' : undefined}
                        className={`border-b-2 px-1 pb-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 ${feed === tab ? 'border-[#e0d9d3] text-white' : 'border-transparent text-[#bdb6b1] hover:text-white'}`}
                    >
                        {tab === 'everyone' ? 'Everyone' : 'Following'}
                    </Link>
                ))}
            </nav>
            {reviews.data.length ? (
                <div className="mx-auto max-w-4xl space-y-5">
                    {reviews.data.map((review) => (
                        <CommunityStory
                            key={`${review.id}:${review.updated_at}`}
                            review={review}
                        />
                    ))}
                </div>
            ) : (
                <section className="rounded-xl border border-dashed border-shadow px-6 py-16 text-center">
                    <Users
                        className="mx-auto mb-5 size-9 text-mustang"
                        aria-hidden="true"
                    />
                    <h2 className="font-serif text-3xl">
                        {feed === 'following'
                            ? 'Your circle starts here.'
                            : 'A new story is waiting.'}
                    </h2>
                    <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#bdb6b1]">
                        {feed === 'following'
                            ? 'Follow players to see their public reviews here. Their private library and diary stay private.'
                            : 'Reviews appear here when their author has a public player profile and chooses to publish them.'}
                    </p>
                    <Button asChild className="mt-6">
                        <Link href={players()}>Discover players</Link>
                    </Button>
                </section>
            )}
            <HistoryPagination
                pagination={reviews}
                label="Community review pages"
            />
        </>
    );
}
