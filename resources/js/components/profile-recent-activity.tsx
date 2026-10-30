import { Link } from '@inertiajs/react';
import { MessageSquareText } from 'lucide-react';
import GameCover from '@/components/game-cover';
import StarRating from '@/components/star-rating';
import { show } from '@/routes/games';
import type { ProfileGameActivity } from '@/types/community';

const statusLabels = {
    playing: 'Playing',
    completed: 'Completed',
    paused: 'Paused',
    dropped: 'Dropped',
};

export default function ProfileRecentActivity({
    activities,
}: {
    activities: ProfileGameActivity[];
}) {
    return (
        <section
            aria-labelledby="recent-game-activity"
            className="mt-10 sm:mt-12"
        >
            <h2
                id="recent-game-activity"
                className="mb-4 border-b border-shadow pb-3 text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm"
            >
                Recent activity
            </h2>
            {activities.length ? (
                <div className="grid grid-cols-4 items-start gap-2 sm:gap-4">
                    {activities.map((activity) => (
                        <article key={activity.game.id} className="min-w-0">
                            <Link
                                href={show(activity.game.slug)}
                                aria-label={`View ${activity.game.name}`}
                                className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
                            >
                                <GameCover
                                    game={activity.game}
                                    compact
                                    hideFallbackTitle
                                    className="aspect-[2/3] rounded-md group-hover:border-[#c5bfba]"
                                />
                            </Link>
                            <div className="mt-2 flex min-h-4 flex-wrap items-center gap-x-1 gap-y-1">
                                {activity.rating !== null ? (
                                    <StarRating
                                        value={activity.rating}
                                        compact
                                    />
                                ) : (
                                    <span className="text-[10px] text-[#9e9690]">
                                        Unrated
                                    </span>
                                )}
                                {activity.has_review && (
                                    <MessageSquareText
                                        className="size-3 text-[#bdb6b1]"
                                        aria-label="Has a review"
                                    />
                                )}
                            </div>
                            <p className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-4 text-[#d5cec7] sm:text-xs">
                                {activity.game.name}
                            </p>
                            <p className="mt-1 text-[10px] text-[#bdb6b1] sm:text-xs">
                                {activity.status === null
                                    ? 'In library'
                                    : statusLabels[activity.status]}
                            </p>
                            <time
                                dateTime={activity.occurred_at}
                                className="mt-1 block text-[10px] leading-4 text-[#9e9690] sm:text-xs"
                            >
                                {new Intl.DateTimeFormat('en', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    timeZone: 'UTC',
                                }).format(new Date(activity.occurred_at))}
                            </time>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="border-b border-white/10 py-7 text-sm leading-7 text-[#bdb6b1]">
                    Your latest game activity will appear here as you update
                    your library, rate, review, or log a play session.
                </p>
            )}
            {activities.length > 0 && (
                <p className="mt-4 text-xs leading-6 text-[#9e9690]">
                    Your four most recently active games across library,
                    ratings, reviews, playthroughs, and diary updates.
                </p>
            )}
        </section>
    );
}
