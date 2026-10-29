import { Link } from '@inertiajs/react';
import GameCover from '@/components/game-cover';
import StarRating from '@/components/star-rating';
import { show as gameDetails } from '@/routes/games';
import { show as playerProfile } from '@/routes/players';
import type { CommunityReview } from '@/types/community';

export default function CommunityStory({
    review,
}: {
    review: CommunityReview;
}) {
    return (
        <article className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-4 rounded-xl border border-shadow bg-rein/20 p-5 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-6 sm:p-7">
            <Link
                href={gameDetails(review.game.slug)}
                aria-label={`View ${review.game.name}`}
                className="h-fit rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <GameCover game={review.game} />
            </Link>
            <div className="min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#bdb6b1]">
                    <p>
                        <Link
                            href={playerProfile(review.author.username)}
                            className="font-medium text-[#e0d9d3] underline-offset-4 hover:underline focus-visible:outline-2"
                        >
                            {review.author.name}
                        </Link>{' '}
                        shared a review
                    </p>
                    <time dateTime={review.updated_at}>
                        {new Intl.DateTimeFormat('en', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            timeZone: 'UTC',
                        }).format(new Date(review.updated_at))}
                    </time>
                </div>
                <h2 className="mt-3 font-serif text-2xl wrap-break-word sm:text-3xl">
                    <Link
                        href={gameDetails(review.game.slug)}
                        className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2"
                    >
                        {review.game.name}
                    </Link>
                </h2>
                {review.rating !== null && (
                    <div className="mt-3">
                        <StarRating value={review.rating} />
                    </div>
                )}
                {review.contains_spoilers ? (
                    <details className="mt-5">
                        <summary className="w-fit cursor-pointer rounded-sm text-sm text-[#d5cec7] focus-visible:outline-2 focus-visible:outline-offset-4">
                            Contains spoilers · Show review
                        </summary>
                        <p className="mt-4 text-sm leading-7 wrap-break-word whitespace-pre-wrap text-[#c5bfba]">
                            {review.body}
                        </p>
                    </details>
                ) : (
                    <p className="mt-5 text-sm leading-7 wrap-break-word whitespace-pre-wrap text-[#c5bfba]">
                        {review.body}
                    </p>
                )}
            </div>
        </article>
    );
}
