import { Link } from '@inertiajs/react';
import { Gamepad2 } from 'lucide-react';
import GameCover from '@/components/game-cover';
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
    const games = list.preview_games ?? [];
    return (
        <article className="w-full max-w-[320px] min-w-0">
            <Link
                href={show({ listOwner: list.owner.id, listSlug: list.slug })}
                className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <div
                    className="relative aspect-[5/2] overflow-hidden rounded-md border border-white/15 bg-rein/30"
                    aria-hidden="true"
                >
                    {games.length ? (
                        Array.from({ length: 5 }, (_, index) => {
                            const game = games[index];
                            const style = {
                                left: `${index * 18}%`,
                                zIndex: 5 - index,
                            };
                            return game ? (
                                <div
                                    key={game.id}
                                    className="absolute inset-y-0 w-[28%]"
                                    style={style}
                                >
                                    <GameCover
                                        game={game}
                                        compact
                                        hideFallbackTitle
                                        className="h-full w-full rounded-sm border-white/15 shadow-md group-hover:border-[#807d7d]"
                                    />
                                </div>
                            ) : (
                                <span
                                    key={`empty-${index}`}
                                    className="absolute inset-y-0 w-[28%] border-l border-white/10 bg-gradient-to-br from-rein to-caviar"
                                    style={style}
                                />
                            );
                        })
                    ) : (
                        <span className="flex h-full items-center justify-center gap-2 text-xs text-[#a9a19b]">
                            <Gamepad2 className="size-5" />
                            No games yet
                        </span>
                    )}
                </div>
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
