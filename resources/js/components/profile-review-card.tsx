import { Link } from '@inertiajs/react';
import GameCover from '@/components/game-cover';
import ReviewBody from '@/components/review-body';
import StarRating from '@/components/star-rating';
import { show } from '@/routes/games';
import type { ProfileReview } from '@/types/community';

export default function ProfileReviewCard({
    review,
}: {
    review: ProfileReview;
}) {
    return (
        <article className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)] gap-2.5 border-b border-white/10 py-3 font-sans first:pt-0 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-3">
            <Link
                href={show(review.game.slug)}
                aria-label={`View ${review.game.name}`}
                className="group block h-fit rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <GameCover
                    game={review.game}
                    compact
                    hideFallbackTitle
                    className="aspect-[2/3] rounded-sm"
                />
            </Link>
            <div className="min-w-0">
                <h3 className="text-sm leading-5 font-medium wrap-break-word">
                    <Link
                        href={show(review.game.slug)}
                        className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                        {review.game.name}
                    </Link>
                    {review.game.released_on && (
                        <span className="ml-1.5 inline-block text-[11px] font-normal text-[#a9a19b]">
                            {review.game.released_on.slice(0, 4)}
                        </span>
                    )}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#bdb6b1]">
                    {review.rating !== null && (
                        <StarRating value={review.rating} compact />
                    )}
                    <time dateTime={review.updated_at}>
                        {new Intl.DateTimeFormat('en', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            timeZone: 'UTC',
                        }).format(new Date(review.updated_at))}
                    </time>
                    {review.is_public === false && (
                        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-[#c5bfba]">
                            Private · only you
                        </span>
                    )}
                </div>
                {review.contains_spoilers ? (
                    <details className="mt-1.5">
                        <summary className="min-h-7 w-fit cursor-pointer rounded-sm py-1.5 text-[11px] leading-4 text-[#c5bfba] focus-visible:outline-2 focus-visible:outline-offset-2">
                            Contains spoilers · Show review
                        </summary>
                        <ReviewBody body={review.body} />
                    </details>
                ) : (
                    <ReviewBody body={review.body} />
                )}
            </div>
        </article>
    );
}
