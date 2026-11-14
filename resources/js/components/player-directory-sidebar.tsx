import { Link } from '@inertiajs/react';
import FollowPlayer from '@/components/follow-player';
import PlayerAvatar from '@/components/player-avatar';
import { myFollowers, myFollowing, show } from '@/routes/players';
import type { NetworkPlayer, PlayerDirectoryNetwork } from '@/types/community';

export default function PlayerDirectorySidebar({
    network,
    reviewers,
}: {
    network?: PlayerDirectoryNetwork;
    reviewers?: NetworkPlayer[];
}) {
    return (
        <aside
            className="min-w-0 space-y-7 font-sans"
            aria-label="Player connections"
        >
            {network &&
                (['following', 'followers'] as const).map((direction) => {
                    const group = network[direction];
                    if (!group) return null;
                    const title =
                        direction === 'following'
                            ? 'You follow'
                            : 'Following you';
                    return (
                        <section key={direction} aria-label={title}>
                            <Link
                                href={
                                    direction === 'following'
                                        ? myFollowing()
                                        : myFollowers()
                                }
                                className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 text-[11px] tracking-[0.08em] text-[#c5bfba] uppercase hover:text-white focus-visible:outline-2"
                            >
                                <span>{title}</span>
                                <span className="text-[10px] tracking-normal text-[#a9a19b]">
                                    {group.total.toLocaleString()}
                                </span>
                            </Link>
                            {group.data.length ? (
                                <ul className="flex flex-wrap gap-2">
                                    {group.data.map((player) => (
                                        <li key={player.username}>
                                            <Link
                                                href={show(player.username)}
                                                aria-label={`View ${player.name}'s profile`}
                                                title={player.name}
                                                className="block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
                                            >
                                                <PlayerAvatar
                                                    name={player.name}
                                                    src={player.avatar_url}
                                                    className="size-8"
                                                />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[11px] leading-5 text-[#a9a19b]">
                                    {direction === 'following'
                                        ? 'You are not following any public players yet.'
                                        : 'No public followers yet.'}
                                </p>
                            )}
                        </section>
                    );
                })}
            {reviewers && (
                <section aria-label="Active reviewers">
                    <h2 className="border-b border-white/10 pb-2 text-[11px] font-medium tracking-[0.08em] text-[#c5bfba] uppercase">
                        Active reviewers
                    </h2>
                    {reviewers.length ? (
                        <ul className="divide-y divide-white/10">
                            {reviewers.map((player) => (
                                <li
                                    key={player.username}
                                    className="flex min-w-0 items-center gap-2 py-3"
                                >
                                    <Link
                                        href={show(player.username)}
                                        className="flex min-w-0 flex-1 items-center gap-2 rounded-sm focus-visible:outline-2"
                                    >
                                        <PlayerAvatar
                                            name={player.name}
                                            src={player.avatar_url}
                                            className="size-8 shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-[#f4f1ed]">
                                                {player.name}
                                            </p>
                                            <p className="text-[10px] text-[#a9a19b]">
                                                {player.public_reviews_count.toLocaleString()}{' '}
                                                public{' '}
                                                {player.public_reviews_count ===
                                                1
                                                    ? 'review'
                                                    : 'reviews'}
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="relative shrink-0">
                                        {player.is_self ? (
                                            <span className="text-[10px] text-[#a9a19b]">
                                                You
                                            </span>
                                        ) : (
                                            <FollowPlayer
                                                player={player}
                                                compact
                                            />
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-3 text-[11px] text-[#a9a19b]">
                            No public reviews yet.
                        </p>
                    )}
                </section>
            )}
        </aside>
    );
}
