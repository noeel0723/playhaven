import { Link } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import HistoryPagination from '@/components/history-pagination';
import PlayerAvatar from '@/components/player-avatar';
import ReviewBody from '@/components/review-body';
import StarRating from '@/components/star-rating';
import { show as playerProfile } from '@/routes/players';
import type { ReviewPagination } from '@/types/reviews';

export default function CommunityReviews({
    reviews,
    rating,
    ratingsCount,
}: {
    reviews: ReviewPagination;
    rating: number | null;
    ratingsCount: number;
}) {
    return (
        <section
            id="community-reviews"
            aria-labelledby="community-reviews-title"
            className="border-t border-white/10 pt-4 font-sans"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex flex-wrap items-baseline gap-2">
                    <h2
                        id="community-reviews-title"
                        className="text-xs font-medium tracking-[0.1em] uppercase"
                    >
                        Reviews
                    </h2>
                    <span className="text-[11px] text-[#bdb6b1]">
                        {reviews.meta.total} public{' '}
                        {reviews.meta.total === 1 ? 'review' : 'reviews'}
                    </span>
                </div>
                <div
                    aria-label="Community rating"
                    className="flex flex-wrap items-center gap-2 text-[11px] text-[#bdb6b1]"
                >
                    {rating !== null && ratingsCount > 0 ? (
                        <>
                            <StarRating value={rating} compact />
                            <span className="font-medium text-[#e0d9d3]">
                                {rating.toFixed(1)}
                            </span>
                            <span>
                                {ratingsCount}{' '}
                                {ratingsCount === 1 ? 'rating' : 'ratings'}
                            </span>
                        </>
                    ) : (
                        <span>No ratings yet</span>
                    )}
                </div>
            </div>
            {reviews.data.length > 0 ? (
                <div>
                    {reviews.data.map((review) => (
                        <article
                            key={`${review.id}:${review.updated_at}`}
                            aria-label={`Review by ${review.author.name}`}
                            className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)] gap-2.5 border-b border-white/10 py-3 sm:grid-cols-[32px_minmax(0,1fr)] sm:gap-3 sm:py-4"
                        >
                            <PlayerAvatar
                                name={review.author.name}
                                src={review.author.avatar_url}
                                className="size-7 shrink-0 sm:size-8"
                            />
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <h3 className="min-w-0 text-xs leading-5 font-medium wrap-break-word">
                                        <span className="font-normal text-[#bdb6b1]">
                                            Review by{' '}
                                        </span>
                                        {review.author.username ? (
                                            <Link
                                                href={playerProfile(
                                                    review.author.username,
                                                )}
                                                className="rounded-sm text-[#e0d9d3] underline-offset-4 hover:underline focus-visible:outline-2"
                                            >
                                                {review.author.name}
                                            </Link>
                                        ) : (
                                            review.author.name
                                        )}
                                    </h3>
                                    {review.rating !== null && (
                                        <StarRating
                                            value={review.rating}
                                            compact
                                        />
                                    )}
                                    <time
                                        dateTime={review.updated_at}
                                        className="text-[11px] leading-4 text-[#bdb6b1]"
                                    >
                                        Updated{' '}
                                        {new Intl.DateTimeFormat('en', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            timeZone: 'UTC',
                                        }).format(new Date(review.updated_at))}
                                    </time>
                                </div>
                                {review.contains_spoilers ? (
                                    <details className="mt-1.5">
                                        <summary className="min-h-7 w-fit cursor-pointer rounded-sm py-1.5 text-[11px] leading-4 text-[#d5cec7] focus-visible:outline-2 focus-visible:outline-offset-2">
                                            Contains spoilers · Show review
                                        </summary>
                                        <ReviewBody body={review.body} />
                                    </details>
                                ) : (
                                    <ReviewBody body={review.body} />
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="py-6 text-center">
                    <MessageSquare
                        className="mx-auto mb-2 size-5 text-mustang"
                        strokeWidth={1.5}
                        aria-hidden="true"
                    />
                    <h3 className="text-sm font-medium">
                        {reviews.meta.total > 0
                            ? 'No reviews on this page.'
                            : 'No public reviews yet.'}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-[#bdb6b1]">
                        {reviews.meta.total > 0
                            ? 'Use pagination to read other reviews.'
                            : 'Publish a review to share your experience.'}
                    </p>
                </div>
            )}
            <HistoryPagination
                pagination={reviews}
                label="Review pagination"
                dense
                preserveState
            />
        </section>
    );
}
