import { Link } from '@inertiajs/react';
import { useId, useState } from 'react';
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
        <article
            aria-label={`Review of ${review.game.name} by ${review.author.name}`}
            className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-2.5 rounded-md border border-white/10 bg-rein/10 p-3 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-3"
        >
            <Link
                href={gameDetails(review.game.slug)}
                aria-label={`View ${review.game.name}`}
                className="h-fit rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <GameCover
                    game={review.game}
                    compact
                    hideFallbackTitle
                    className="aspect-[2/3] rounded-sm"
                />
            </Link>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[#bdb6b1]">
                    <p className="flex min-w-0 items-center gap-1.5">
                        <PlayerAvatar
                            name={review.author.name}
                            src={review.author.avatar_url}
                            className="size-4 shrink-0"
                        />
                        <Link
                            href={playerProfile(review.author.username)}
                            className="min-w-0 truncate rounded-sm font-medium text-[#e0d9d3] underline-offset-4 hover:underline focus-visible:outline-2"
                            title={review.author.name}
                        >
                            {review.author.name}
                        </Link>
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
                <h3 className="mt-1 text-sm leading-5 font-medium wrap-break-word">
                    <Link
                        href={gameDetails(review.game.slug)}
                        className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2"
                    >
                        {review.game.name}
                    </Link>
                </h3>
                {review.rating !== null && (
                    <div className="mt-1">
                        <StarRating value={review.rating} compact />
                    </div>
                )}
                {review.contains_spoilers ? (
                    <details className="mt-2">
                        <summary className="w-fit cursor-pointer rounded border border-white/10 bg-rein/20 px-2 py-1 text-[11px] leading-5 text-[#d5cec7] hover:bg-rein/40 focus-visible:outline-2 focus-visible:outline-offset-2">
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

function ReviewBody({ body }: { body: string }) {
    const id = useId();
    const [expanded, setExpanded] = useState(false);
    const expandable = body.length > 180 || body.split(/\r?\n/).length > 3;
    return (
        <div className="mt-2">
            <p
                id={id}
                className={`text-xs leading-5 wrap-break-word whitespace-pre-wrap text-[#c5bfba] ${expandable && !expanded ? 'line-clamp-3' : ''}`}
            >
                {body}
            </p>
            {expandable && (
                <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={id}
                    onClick={() => setExpanded(!expanded)}
                    className="mt-1 inline-flex h-7 items-center rounded px-1.5 text-[11px] text-[#bdb6b1] underline underline-offset-4 hover:bg-rein/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    {expanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </div>
    );
}
