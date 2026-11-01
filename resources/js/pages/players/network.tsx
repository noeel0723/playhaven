import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Users } from 'lucide-react';
import FollowPlayer from '@/components/follow-player';
import HistoryPagination from '@/components/history-pagination';
import PlayerAvatar from '@/components/player-avatar';
import {
    followers,
    following,
    myFollowers,
    myFollowing,
    me,
    show,
} from '@/routes/players';
import type { NetworkPlayer, PublicPlayer } from '@/types/community';
import type { HistoryPagination as Paginated } from '@/types/history';

type Owner = Pick<
    PublicPlayer,
    'name' | 'avatar_url' | 'followers_count' | 'following_count'
> & { username: string | null };
type Direction = 'followers' | 'following';

export default function PlayerNetwork({
    owner,
    players,
    direction,
    isOwnNetwork,
    sort,
}: {
    owner: Owner;
    players: Paginated<NetworkPlayer>;
    direction: Direction;
    isOwnNetwork: boolean;
    sort: 'recent' | 'name';
}) {
    const profile = isOwnNetwork ? me.url() : show.url(owner.username!);
    const destination = (tab: Direction) =>
        isOwnNetwork
            ? tab === 'followers'
                ? myFollowers.url()
                : myFollowing.url()
            : tab === 'followers'
              ? followers.url(owner.username!)
              : following.url(owner.username!);
    const title = direction === 'followers' ? 'Followers' : 'Following';
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title={`${title} · ${owner.name}`} />
            <header className="mb-5 flex items-center justify-between gap-3">
                <Link
                    href={profile}
                    className="flex min-w-0 items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    <PlayerAvatar
                        name={owner.name}
                        src={owner.avatar_url}
                        className="size-9 shrink-0"
                    />
                    <div className="min-w-0">
                        <h1 className="truncate text-sm font-medium text-[#f4f1ed]">
                            {owner.name}
                        </h1>
                        {owner.username && (
                            <p className="truncate text-[11px] text-[#a9a19b]">
                                @{owner.username}
                            </p>
                        )}
                    </div>
                </Link>
                <Link
                    href={profile}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded px-2 text-[11px] text-[#bdb6b1] hover:bg-rein/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <ArrowLeft className="size-3" aria-hidden="true" /> Profile
                </Link>
            </header>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/15">
                <nav aria-label="Player network" className="flex gap-4">
                    {(['following', 'followers'] as const).map((tab) => (
                        <Link
                            key={tab}
                            href={
                                destination(tab) +
                                (sort === 'name' ? '?sort=name' : '')
                            }
                            aria-current={
                                direction === tab ? 'page' : undefined
                            }
                            className={`inline-flex min-h-8 items-center gap-1.5 border-b-2 text-xs font-medium ${direction === tab ? 'border-[#d5cec7] text-[#f4f1ed]' : 'border-transparent text-[#a9a19b] hover:text-white'} focus-visible:outline-2 focus-visible:outline-offset-2`}
                        >
                            {tab === 'following' ? 'Following' : 'Followers'}
                            <span className="text-[10px] font-normal text-[#a9a19b]">
                                {(tab === 'following'
                                    ? owner.following_count
                                    : owner.followers_count
                                ).toLocaleString()}
                            </span>
                        </Link>
                    ))}
                </nav>
                <label className="mb-1 flex items-center gap-1.5 text-[11px] text-[#a9a19b]">
                    Sort by
                    <select
                        aria-label="Sort players"
                        value={sort}
                        onChange={(event) =>
                            router.get(
                                destination(direction),
                                { sort: event.target.value },
                                { preserveScroll: true, replace: true },
                            )
                        }
                        className="h-7 rounded border border-white/10 bg-[#171515] px-2 font-sans text-[11px] text-[#d5cec7] focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <option value="recent">When followed</option>
                        <option value="name">Name</option>
                    </select>
                </label>
            </div>
            {players.data.length ? (
                <table className="w-full table-fixed text-left text-xs">
                    <caption className="sr-only">
                        {title} of {owner.name}. Only public player profiles are
                        listed.
                    </caption>
                    <colgroup>
                        <col />
                        <col className="w-12 sm:w-20" />
                        <col className="w-10 sm:w-20" />
                        <col className="w-10 sm:w-12" />
                    </colgroup>
                    <thead className="border-b border-white/10 bg-rein/15 text-[10px] font-normal text-[#a9a19b]">
                        <tr>
                            <th scope="col" className="py-2 pl-1 font-normal">
                                Name
                            </th>
                            <th scope="col" className="text-center font-normal">
                                Reviews
                            </th>
                            <th scope="col" className="text-center font-normal">
                                Lists
                            </th>
                            <th scope="col">
                                <span className="sr-only">Follow</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.data.map((player) => (
                            <tr
                                key={player.username}
                                className="border-b border-white/10"
                            >
                                <td className="py-3 pr-2">
                                    <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
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
                                                className="block truncate rounded-sm text-[13px] font-medium text-[#f4f1ed] hover:underline focus-visible:outline-2"
                                                title={player.name}
                                            >
                                                {player.name}
                                            </Link>
                                            <p className="truncate text-[10px] leading-4 text-[#a9a19b]">
                                                @{player.username}
                                            </p>
                                            <div className="mt-0.5 flex flex-wrap gap-x-1.5 text-[10px] leading-4 text-[#a9a19b]">
                                                <Link
                                                    href={followers(
                                                        player.username,
                                                    )}
                                                    className="rounded-sm hover:text-white hover:underline focus-visible:outline-2"
                                                >
                                                    {player.followers_count.toLocaleString()}{' '}
                                                    {player.followers_count ===
                                                    1
                                                        ? 'follower'
                                                        : 'followers'}
                                                </Link>
                                                <Link
                                                    href={following(
                                                        player.username,
                                                    )}
                                                    className="rounded-sm hover:text-white hover:underline focus-visible:outline-2"
                                                >
                                                    following{' '}
                                                    {player.following_count.toLocaleString()}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
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
                                            <FollowPlayer
                                                player={player}
                                                compact
                                                returnToNetwork={{
                                                    username: owner.username,
                                                    mine: isOwnNetwork,
                                                    direction,
                                                    sort,
                                                    page: players.meta
                                                        .current_page,
                                                }}
                                            />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="border-b border-white/10 py-10 text-center">
                    <Users
                        className="mx-auto mb-2 size-5 text-[#807d7d]"
                        aria-hidden="true"
                    />
                    <p className="text-xs text-[#bdb6b1]">
                        {direction === 'followers'
                            ? 'No followers to show yet.'
                            : 'No followed players to show yet.'}
                    </p>
                </div>
            )}
            <p className="mt-3 text-[11px] text-[#a9a19b]">
                Only public player profiles, reviews, and lists are shown.
            </p>
            <HistoryPagination
                pagination={players}
                label={`${title} pages`}
                compact
                dense
            />
        </div>
    );
}
