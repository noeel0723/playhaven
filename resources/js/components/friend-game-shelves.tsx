import { Link } from '@inertiajs/react';
import { Check, CirclePlay, Pause } from 'lucide-react';
import GameCover from '@/components/game-cover';
import PlayerAvatar from '@/components/player-avatar';
import { show as gameDetails } from '@/routes/games';
import { index as players, show as playerProfile } from '@/routes/players';
import type { FriendShelves, FriendStatusActivity } from '@/types/community';

const gridClass =
    'grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-6';
const statusDetails = {
    playing: { label: 'Playing', Icon: CirclePlay },
    paused: { label: 'Paused', Icon: Pause },
    completed: { label: 'Completed', Icon: Check },
};

function ActivityCard({ activity }: { activity: FriendStatusActivity }) {
    const { label, Icon } = statusDetails[activity.status];
    return (
        <article className="max-w-36 min-w-0">
            <div className="relative mb-3">
                <Link
                    href={gameDetails(activity.game.slug)}
                    aria-label={`View ${activity.game.name}`}
                    className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    <GameCover
                        game={activity.game}
                        compact
                        hideFallbackTitle
                        className="aspect-[2/3] rounded-md group-hover:border-[#bdb6b1]"
                    />
                </Link>
                <Link
                    href={playerProfile(activity.player.username)}
                    aria-label={`View ${activity.player.name}'s profile`}
                    className="absolute -bottom-2 left-1 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <PlayerAvatar
                        name={activity.player.name}
                        src={activity.player.avatar_url}
                        className="size-6 border-2 border-caviar"
                    />
                </Link>
            </div>
            <Link
                href={gameDetails(activity.game.slug)}
                className="line-clamp-2 min-h-8 rounded-sm text-xs leading-4 font-medium text-[#e0d9d3] hover:underline focus-visible:outline-2"
                title={activity.game.name}
            >
                {activity.game.name}
            </Link>
            <Link
                href={playerProfile(activity.player.username)}
                className="mt-1 block truncate rounded-sm text-[11px] text-[#bdb6b1] hover:underline focus-visible:outline-2"
                title={activity.player.name}
            >
                {activity.player.name}
            </Link>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-[#d5cec7]">
                <Icon className="size-3 shrink-0" aria-hidden="true" />
                {label}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#a9a19b]">
                {activity.changed_at ? (
                    <time
                        dateTime={activity.changed_at}
                        title={new Intl.DateTimeFormat('en', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        }).format(new Date(activity.changed_at))}
                    >
                        {new Intl.DateTimeFormat('en', {
                            month: 'short',
                            day: 'numeric',
                        }).format(new Date(activity.changed_at))}
                    </time>
                ) : (
                    'Date not recorded'
                )}
            </p>
        </article>
    );
}

export default function FriendGameShelves({
    shelves,
}: {
    shelves: FriendShelves;
}) {
    return (
        <div className="mb-7 space-y-6">
            <section aria-labelledby="new-from-friends">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                    <h2
                        id="new-from-friends"
                        className="text-xs font-medium tracking-[0.12em] text-[#c5bfba] uppercase"
                    >
                        New from friends
                    </h2>
                    <span className="text-[11px] text-[#a9a19b]">
                        Players you follow · Public profiles
                    </span>
                </div>
                {shelves.recent.length ? (
                    <>
                        <div className={gridClass}>
                            {shelves.recent.slice(0, 6).map((activity) => (
                                <ActivityCard
                                    key={`${activity.player.username}:${activity.game.id}`}
                                    activity={activity}
                                />
                            ))}
                        </div>
                        {shelves.recent.length > 6 && (
                            <details className="mt-4">
                                <summary className="inline-flex h-7 w-fit cursor-pointer items-center rounded border border-white/10 bg-rein/20 px-2 text-[11px] text-[#bdb6b1] hover:bg-rein/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2">
                                    Show more activity
                                </summary>
                                <div className={`mt-4 ${gridClass}`}>
                                    {shelves.recent.slice(6).map((activity) => (
                                        <ActivityCard
                                            key={`${activity.player.username}:${activity.game.id}`}
                                            activity={activity}
                                        />
                                    ))}
                                </div>
                            </details>
                        )}
                    </>
                ) : (
                    <div className="rounded-md border border-dashed border-shadow p-3 text-xs leading-5 text-[#bdb6b1]">
                        No shared game updates yet.{' '}
                        <Link
                            href={players()}
                            className="rounded-sm underline underline-offset-4 focus-visible:outline-2"
                        >
                            Find players to follow
                        </Link>
                        .
                    </div>
                )}
            </section>
            <section aria-labelledby="popular-with-friends">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                    <h2
                        id="popular-with-friends"
                        className="text-xs font-medium tracking-[0.12em] text-[#c5bfba] uppercase"
                    >
                        Popular with friends
                    </h2>
                    <span className="text-[11px] text-[#a9a19b]">
                        Playing, paused, and completed games
                    </span>
                </div>
                {shelves.popular.length ? (
                    <>
                        <div className={gridClass}>
                            {shelves.popular.slice(0, 6).map((item) => (
                                <PopularCard key={item.game.id} item={item} />
                            ))}
                        </div>
                        {shelves.popular.length > 6 && (
                            <details className="mt-4">
                                <summary className="inline-flex h-7 w-fit cursor-pointer items-center rounded border border-white/10 bg-rein/20 px-2 text-[11px] text-[#bdb6b1] hover:bg-rein/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2">
                                    Show more games
                                </summary>
                                <div className={`mt-4 ${gridClass}`}>
                                    {shelves.popular.slice(6).map((item) => (
                                        <PopularCard
                                            key={item.game.id}
                                            item={item}
                                        />
                                    ))}
                                </div>
                            </details>
                        )}
                    </>
                ) : (
                    <p className="rounded-md border border-dashed border-shadow p-3 text-xs leading-5 text-[#bdb6b1]">
                        No shared games from friends yet.
                    </p>
                )}
            </section>
        </div>
    );
}

function PopularCard({ item }: { item: FriendShelves['popular'][number] }) {
    return (
        <article className="max-w-36 min-w-0">
            <Link
                href={gameDetails(item.game.slug)}
                className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <GameCover
                    game={item.game}
                    compact
                    hideFallbackTitle
                    className="aspect-[2/3] rounded-md group-hover:border-[#bdb6b1]"
                />
                <h3
                    className="mt-2 line-clamp-2 min-h-8 text-xs leading-4 font-medium text-[#e0d9d3] group-hover:underline"
                    title={item.game.name}
                >
                    {item.game.name}
                </h3>
            </Link>
            <p className="mt-1 text-[11px] text-[#bdb6b1]">
                {item.friends_count}{' '}
                {item.friends_count === 1 ? 'friend' : 'friends'}
            </p>
        </article>
    );
}
