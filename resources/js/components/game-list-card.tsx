import { Link } from '@inertiajs/react';
import GameListCoverStrip from '@/components/game-list-cover-strip';

import PlayerAvatar from '@/components/player-avatar';
import { show } from '@/routes/lists';
import { show as playerProfile } from '@/routes/players';
import type { GameList } from '@/types/lists';

export default function GameListCard({
    list,
    showVisibility = false,
}: {
    list: GameList;
    showVisibility?: boolean;
}) {
    return (
        <article className="w-full max-w-[320px] min-w-0">
            <Link
                href={show({ listOwner: list.owner.id, listSlug: list.slug })}
                className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <GameListCoverStrip list={list} />
                <h2
                    className="mt-2 line-clamp-2 text-sm leading-5 font-medium wrap-break-word text-[#f4f1ed] group-hover:underline group-hover:underline-offset-4"
                    title={list.name}
                >
                    {list.name}
                </h2>
            </Link>
            {list.description && (
                <p
                    className="mt-1 line-clamp-1 text-xs leading-5 text-[#bdb6b1]"
                    title={list.description}
                >
                    {list.description}
                </p>
            )}
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-5 text-[#bdb6b1]">
                <span className="flex max-w-full min-w-0 items-center gap-1.5">
                    <PlayerAvatar
                        name={list.owner.name}
                        src={list.owner.avatar_url}
                        className="size-4 shrink-0"
                    />
                    {list.owner.username ? (
                        <Link
                            href={playerProfile(list.owner.username)}
                            className="min-w-0 truncate rounded-sm text-[#d5cec7] hover:underline focus-visible:outline-2"
                            title={list.owner.name}
                        >
                            {list.owner.name}
                        </Link>
                    ) : (
                        <span
                            className="min-w-0 truncate"
                            title={list.owner.name}
                        >
                            {list.owner.name}
                        </span>
                    )}
                </span>
                <span className="shrink-0">
                    {list.items_count}{' '}
                    {list.items_count === 1 ? 'game' : 'games'}
                </span>
                {showVisibility && (
                    <span className="rounded border border-white/10 px-1.5 text-[10px] capitalize">
                        {list.visibility}
                    </span>
                )}
            </div>
        </article>
    );
}
