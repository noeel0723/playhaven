import { Link } from '@inertiajs/react';
import GameCover from '@/components/game-cover';
import StarRating from '@/components/star-rating';
import { show } from '@/routes/games';
import type { ProfileReview } from '@/types/community';

export default function ProfileReviewCard({
    review,
}: {
    review: ProfileReview;
}) {
    return (
        <article className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] gap-4 border-b border-white/10 py-6 first:pt-0 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-6">
            <Link
                href={show(review.game.slug)}
                aria-label={`View ${review.game.name}`}
                className="group block h-fit rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <GameCover
                    game={review.game}
                    compact
                    hideFallbackTitle
                    className="aspect-[2/3] rounded-md"
                />
            </Link>
            <div className="min-w-0">
                <h3 className="font-serif text-xl leading-tight wrap-break-word sm:text-3xl">
                    <Link
                        href={show(review.game.slug)}
                        className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                        {review.game.name}
                    </Link>
                    {review.game.released_on && (
                        <span className="ml-2 inline-block font-sans text-sm text-[#a9a19b] sm:text-lg">
                            {review.game.released_on.slice(0, 4)}
                        </span>
                    )}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#bdb6b1]">
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
                        <span className="rounded border border-shadow px-2 py-0.5 text-[10px] text-[#c5bfba]">
                            Private · only you
                        </span>
                    )}
                </div>
                {review.contains_spoilers ? (
                    <details className="mt-4">
                        <summary className="w-fit cursor-pointer rounded-sm text-xs leading-6 text-[#c5bfba] focus-visible:outline-2 focus-visible:outline-offset-4">
                            Contains spoilers · Show review
                        </summary>
                        <p className="mt-3 text-sm leading-7 wrap-break-word whitespace-pre-wrap text-[#c5bfba]">
                            {review.body}
                        </p>
                    </details>
                ) : (
                    <p className="mt-4 text-sm leading-7 wrap-break-word whitespace-pre-wrap text-[#c5bfba]">
                        {review.body}
                    </p>
                )}
            </div>
        </article>
    );
}
