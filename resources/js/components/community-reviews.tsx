import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';
import StarRating from '@/components/star-rating';
import PlayerAvatar from '@/components/player-avatar';
import { Button } from '@/components/ui/button';
import type { ReviewPagination } from '@/types/reviews';
import { show as playerProfile } from '@/routes/players';

export default function CommunityReviews({
    reviews,
}: {
    reviews: ReviewPagination;
}) {
    return (
        <section
            id="community-reviews"
            aria-labelledby="community-reviews-title"
            className="mt-12 border-t border-white/10 pt-9"
        >
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                <h2
                    id="community-reviews-title"
                    className="font-serif text-3xl"
                >
                    From the community
                </h2>
                <span className="text-xs text-[#bdb6b1]">
                    {reviews.meta.total} public{' '}
                    {reviews.meta.total === 1 ? 'review' : 'reviews'}
                </span>
            </div>
            {reviews.data.length > 0 ? (
                <div className="space-y-5">
                    {reviews.data.map((review) => (
                        <article
                            key={`${review.id}:${review.updated_at}`}
                            className="rounded-xl border border-shadow bg-rein/20 p-5 sm:p-6"
                        >
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                                <div className="flex min-w-0 items-start gap-3">
                                    <PlayerAvatar
                                        name={review.author.name}
                                        src={review.author.avatar_url}
                                        className="size-9"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-medium break-words">
                                            {review.author.username ? (
                                                <Link
                                                    href={playerProfile(
                                                        review.author.username,
                                                    )}
                                                    className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2"
                                                >
                                                    {review.author.name}
                                                </Link>
                                            ) : (
                                                review.author.name
                                            )}
                                        </h3>
                                        <time
                                            dateTime={review.updated_at}
                                            className="mt-1 block text-xs text-[#bdb6b1]"
                                        >
                                            Updated{' '}
                                            {new Intl.DateTimeFormat('en', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                timeZone: 'UTC',
                                            }).format(
                                                new Date(review.updated_at),
                                            )}
                                        </time>
                                    </div>
                                </div>
                                {review.rating !== null && (
                                    <StarRating value={review.rating} />
                                )}
                            </div>
                            {review.contains_spoilers ? (
                                <details>
                                    <summary className="cursor-pointer rounded-sm text-sm text-[#d5cec7] focus-visible:outline-2 focus-visible:outline-offset-4">
                                        Contains spoilers · Show review
                                    </summary>
                                    <p className="mt-4 text-sm leading-7 break-words whitespace-pre-wrap text-[#c5bfba]">
                                        {review.body}
                                    </p>
                                </details>
                            ) : (
                                <p className="text-sm leading-7 break-words whitespace-pre-wrap text-[#c5bfba]">
                                    {review.body}
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-shadow px-6 py-10 text-center">
                    <MessageSquare
                        className="mx-auto mb-4 size-7 text-mustang"
                        strokeWidth={1}
                        aria-hidden="true"
                    />
                    <p className="font-serif text-2xl">
                        A story waiting to be told.
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#bdb6b1]">
                        {reviews.meta.total > 0
                            ? 'There are no reviews on this page. Return to the previous page to read more.'
                            : 'No public reviews yet. Share the moments that made this game yours.'}
                    </p>
                </div>
            )}
            {(reviews.links.prev || reviews.links.next) && (
                <nav
                    aria-label="Review pagination"
                    className="mt-6 flex flex-wrap items-center justify-between gap-4"
                >
                    <p className="text-xs text-[#bdb6b1]">
                        Page {reviews.meta.current_page} of{' '}
                        {reviews.meta.last_page}
                    </p>
                    <div className="flex gap-3">
                        {reviews.links.prev && (
                            <Button asChild variant="outline">
                                <Link href={reviews.links.prev} preserveScroll>
                                    <ArrowLeft aria-hidden="true" />
                                    Previous
                                </Link>
                            </Button>
                        )}
                        {reviews.links.next && (
                            <Button asChild variant="outline">
                                <Link href={reviews.links.next} preserveScroll>
                                    Next
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </nav>
            )}
        </section>
    );
}
