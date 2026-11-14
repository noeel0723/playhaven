import { Link } from '@inertiajs/react';
import FollowPlayer from '@/components/follow-player';
import PlayerAvatar from '@/components/player-avatar';
import PlayerRelationship from '@/components/player-relationship';
import { followers, show } from '@/routes/players';
import type { NetworkPlayer } from '@/types/community';

export default function PlayerRankingTable({
    players,
}: {
    players: NetworkPlayer[];
}) {
    return players.length ? (
        <table className="w-full table-fixed text-left font-sans text-xs">
            <caption className="sr-only">
                Public players ordered by most followers
            </caption>
            <colgroup>
                <col />
                <col className="w-14 sm:w-20" />
                <col className="w-12 sm:w-16" />
                <col className="w-10 sm:w-14" />
                <col className="w-9 sm:w-11" />
            </colgroup>
            <thead className="border-b border-white/10 bg-rein/15 text-[10px] text-[#a9a19b]">
                <tr>
                    <th scope="col" className="py-2 pl-1 font-normal">
                        Player
                    </th>
                    {['Followers', 'Reviews', 'Lists'].map((label) => (
                        <th
                            key={label}
                            scope="col"
                            className="text-center font-normal"
                        >
                            {label}
                        </th>
                    ))}
                    <th scope="col">
                        <span className="sr-only">Follow</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {players.map((player) => (
                    <tr
                        key={player.username}
                        className="border-b border-white/10"
                    >
                        <td className="py-3 pr-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <Link
                                    href={show(player.username)}
                                    aria-label={`View ${player.name}'s profile`}
                                    className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    <PlayerAvatar
                                        name={player.name}
                                        src={player.avatar_url}
                                        className="size-8 sm:size-10"
                                    />
                                </Link>
                                <div className="min-w-0">
                                    <Link
                                        href={show(player.username)}
                                        title={player.name}
                                        className="block truncate rounded-sm text-xs font-medium text-[#f4f1ed] hover:underline focus-visible:outline-2 sm:text-[13px]"
                                    >
                                        {player.name}
                                    </Link>
                                    <p className="truncate text-[10px] leading-4 text-[#a9a19b]">
                                        @{player.username}
                                    </p>
                                    <PlayerRelationship player={player} />
                                </div>
                            </div>
                        </td>
                        <td className="text-center text-[11px] text-[#d5cec7] tabular-nums">
                            <Link
                                href={followers(player.username)}
                                className="rounded-sm hover:text-white hover:underline focus-visible:outline-2"
                                aria-label={`${player.name}: ${player.followers_count} followers`}
                            >
                                {player.followers_count.toLocaleString()}
                            </Link>
                        </td>
                        <td className="text-center text-[11px] text-[#bdb6b1] tabular-nums">
                            {player.public_reviews_count.toLocaleString()}
                        </td>
                        <td className="text-center text-[11px] text-[#bdb6b1] tabular-nums">
                            {player.public_lists_count.toLocaleString()}
                        </td>
                        <td className="relative text-right">
                            {player.is_self ? (
                                <span className="text-[10px] text-[#a9a19b]">
                                    You
                                </span>
                            ) : (
                                <div className="flex justify-end">
                                    <FollowPlayer player={player} compact />
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    ) : (
        <p className="border-b border-white/10 py-8 text-center text-xs text-[#a9a19b]">
            No players to show yet.
        </p>
    );
}
