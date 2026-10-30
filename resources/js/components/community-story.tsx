import { Link } from '@inertiajs/react';
import GameCover from '@/components/game-cover';
import PlayerAvatar from '@/components/player-avatar';
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
        <article className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-md border border-white/10 bg-rein/15 p-3 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-4 sm:p-4">
            <Link
                href={gameDetails(review.game.slug)}
                aria-label={`View ${review.game.name}`}
                className="h-fit rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <GameCover
                    game={review.game}
                    compact
                    hideFallbackTitle
                    className="rounded-md"
                />
            </Link>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[#bdb6b1]">
                    <p className="flex flex-wrap items-center gap-x-1 gap-y-2">
                        <PlayerAvatar
                            name={review.author.name}
                            src={review.author.avatar_url}
                            className="mr-1 size-5"
                        />
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
                <h2 className="mt-2 text-base leading-6 font-medium wrap-break-word sm:text-lg">
                    <Link
                        href={gameDetails(review.game.slug)}
                        className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2"
                    >
                        {review.game.name}
                    </Link>
                </h2>
                {review.rating !== null && (
                    <div className="mt-2">
                        <StarRating value={review.rating} />
                    </div>
                )}
                {review.contains_spoilers ? (
                    <details className="mt-3">
                        <summary className="w-fit cursor-pointer rounded-sm text-xs leading-5 text-[#d5cec7] focus-visible:outline-2 focus-visible:outline-offset-4">
                            Contains spoilers · Show review
                        </summary>
                        <p className="mt-2 text-[13px] leading-6 wrap-break-word whitespace-pre-wrap text-[#c5bfba]">
                            {review.body}
                        </p>
                    </details>
                ) : (
                    <p className="mt-3 text-[13px] leading-6 wrap-break-word whitespace-pre-wrap text-[#c5bfba]">
                        {review.body}
                    </p>
                )}
            </div>
        </article>
    );
}
