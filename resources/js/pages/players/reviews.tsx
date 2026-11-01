import { Form, Head, Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import HistoryPagination from '@/components/history-pagination';
import PlayerPageNavigation from '@/components/player-page-navigation';
import ProfileReviewCard from '@/components/profile-review-card';
import { myReviews, reviews as playerReviews } from '@/routes/players';
import type {
    PlayerPageContext,
    ProfileReviewPagination,
} from '@/types/community';

export default function PlayerReviews({
    playerPage,
    reviews,
    query,
}: {
    playerPage: PlayerPageContext;
    reviews: ProfileReviewPagination;
    query: string;
}) {
    const destination = playerPage.isOwnPage
        ? myReviews()
        : playerReviews(playerPage.owner.username!);
    return (
        <div className="mx-auto max-w-3xl font-sans">
            <Head title={`Reviews · ${playerPage.owner.name}`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <PlayerPageNavigation context={playerPage} current="reviews" />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-baseline gap-2">
                    <h1 className="text-base font-medium">Reviews</h1>
                    <span className="text-[11px] text-[#a9a19b]">
                        {reviews.meta.total}
                    </span>
                </div>
                <Form
                    action={destination}
                    method="get"
                    role="search"
                    aria-label="Find player reviews"
                    key={query}
                    className="flex max-w-full items-center gap-1.5"
                >
                    {({ processing }) => (
                        <>
                            <label className="sr-only" htmlFor="review-game">
                                Game name
                            </label>
                            <input
                                id="review-game"
                                type="search"
                                name="q"
                                defaultValue={query}
                                maxLength={100}
                                placeholder="Find a game…"
                                className="h-7 w-40 max-w-full rounded border border-white/10 bg-rein/30 px-2 text-[11px] focus-visible:outline-2"
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                aria-label="Search reviews"
                                className="flex size-7 items-center justify-center rounded border border-white/10 text-[#bdb6b1] hover:bg-rein/40 focus-visible:outline-2 disabled:opacity-50"
                            >
                                <Search className="size-3.5" />
                            </button>
                        </>
                    )}
                </Form>
            </div>
            {reviews.data.length ? (
                <div aria-label="Player reviews" className="min-w-0">
                    {reviews.data.map((review) => (
                        <ProfileReviewCard
                            key={`${review.id}:${review.updated_at}`}
                            review={review}
                        />
                    ))}
                </div>
            ) : (
                <p className="py-8 text-center text-xs text-[#a9a19b]">
                    {query
                        ? 'No reviews match this game.'
                        : 'No reviews to show yet.'}
                </p>
            )}
            {query && (
                <Link
                    href={destination}
                    className="mt-3 inline-flex min-h-7 items-center rounded-sm text-[11px] text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2"
                >
                    All reviews
                </Link>
            )}
            <HistoryPagination
                pagination={reviews}
                label="Player review pages"
                compact
                dense
            />
        </div>
    );
}
