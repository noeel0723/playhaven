import { Head, Link } from '@inertiajs/react';
import { Globe, Link2, LockKeyhole, Pencil } from 'lucide-react';
import GameCover from '@/components/game-cover';
import HistoryPagination from '@/components/history-pagination';
import PlayerAvatar from '@/components/player-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { show as gameDetails } from '@/routes/games';
import { show as playerProfile } from '@/routes/players';
import { discover, index, edit } from '@/routes/lists';
import type { GameList, ItemPagination, ListProgress } from '@/types/lists';

export default function ListDetails({
    list,
    items,
    isOwner,
    shareUrl,
    progress,
}: {
    list: GameList;
    items: ItemPagination;
    isOwner: boolean;
    shareUrl: string;
    progress: ListProgress | null;
}) {
    const VisibilityIcon =
        list.visibility === 'private'
            ? LockKeyhole
            : list.visibility === 'unlisted'
              ? Link2
              : Globe;
    return (
        <>
            <Head title={list.name}>
                {list.visibility !== 'public' && (
                    <meta name="robots" content="noindex, nofollow" />
                )}
            </Head>
            <Link
                href={isOwner ? index() : discover()}
                className="mb-5 inline-block rounded-sm text-xs text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2"
            >
                {isOwner ? 'Lists' : 'Community lists'}
            </Link>
            <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2 text-xs text-[#bdb6b1]">
                        <PlayerAvatar
                            name={list.owner.name}
                            src={list.owner.avatar_url}
                            className="size-5"
                        />
                        {list.owner.username ? (
                            <Link
                                href={playerProfile(list.owner.username)}
                                className="rounded-sm hover:underline focus-visible:outline-2"
                            >
                                {list.owner.name}
                            </Link>
                        ) : (
                            <span>{list.owner.name}</span>
                        )}
                        <span>
                            · {list.items_count}{' '}
                            {list.items_count === 1 ? 'game' : 'games'}
                        </span>
                    </div>
                    <header className="mb-5 border-t border-white/10 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="max-w-full min-w-0 text-2xl leading-8 font-medium wrap-break-word">
                                {list.name}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] text-[#bdb6b1] capitalize">
                                <VisibilityIcon
                                    className="size-3"
                                    aria-hidden="true"
                                />
                                {list.visibility}
                            </span>
                        </div>
                        {list.description && (
                            <p className="mt-3 max-w-2xl text-[13px] leading-6 wrap-break-word whitespace-pre-wrap text-[#c5bfba]">
                                {list.description}
                            </p>
                        )}
                        {isOwner && (
                            <Button
                                asChild
                                size="sm"
                                className="mt-3 lg:hidden"
                            >
                                <Link href={edit(list.id)}>
                                    <Pencil aria-hidden="true" />
                                    Edit list
                                </Link>
                            </Button>
                        )}
                    </header>
                    <section aria-label="Games in this list">
                        {items.data.length ? (
                            <ol className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
                                {items.data.map((item) => (
                                    <li
                                        key={item.id}
                                        className="max-w-36 min-w-0"
                                    >
                                        <Link
                                            href={gameDetails(item.game.slug)}
                                            aria-label={`${item.position}. ${item.game.name}`}
                                            title={item.game.name}
                                            className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
                                        >
                                            <GameCover
                                                game={item.game}
                                                compact
                                                className="aspect-[2/3] rounded-md group-hover:border-[#bdb6b1]"
                                            />
                                            <span className="mt-1 block text-center text-xs text-[#d5cec7] tabular-nums">
                                                {item.position}
                                            </span>
                                            <span className="mt-1 block truncate text-center text-[10px] text-[#bdb6b1]">
                                                {item.game.name}
                                            </span>
                                        </Link>
                                        {item.notes && (
                                            <details className="mt-1 text-[11px] text-[#bdb6b1]">
                                                <summary className="mx-auto w-fit cursor-pointer rounded-sm underline underline-offset-4 focus-visible:outline-2">
                                                    Note
                                                </summary>
                                                <p className="mt-2 leading-5 wrap-break-word whitespace-pre-wrap">
                                                    {item.notes}
                                                </p>
                                            </details>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div className="rounded-md border border-dashed border-shadow p-5 text-xs leading-6 text-[#bdb6b1]">
                                No games on this page yet.{' '}
                                {isOwner && (
                                    <Link
                                        href={edit(list.id)}
                                        className="underline underline-offset-4"
                                    >
                                        Edit this list to add games
                                    </Link>
                                )}
                            </div>
                        )}
                        <HistoryPagination
                            pagination={items}
                            label="List games pagination"
                            compact
                        />
                    </section>
                </div>
                <aside
                    className="min-w-0 space-y-4 lg:sticky lg:top-6"
                    aria-label="List actions and progress"
                >
                    <div className="overflow-hidden rounded-md border border-white/10 bg-rein/20">
                        {isOwner && (
                            <Link
                                href={edit(list.id)}
                                className="flex min-h-10 items-center justify-center gap-2 border-b border-white/10 px-3 py-3 text-xs text-[#e0d9d3] hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
                            >
                                <Pencil
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Edit list
                            </Link>
                        )}
                        <div className="p-3">
                            <Label
                                htmlFor="share-list-link"
                                className="text-xs"
                            >
                                List link
                            </Label>
                            <Input
                                id="share-list-link"
                                readOnly
                                value={shareUrl}
                                onFocus={(event) => event.target.select()}
                                className="mt-2 h-8 border-shadow bg-caviar/30 text-xs"
                            />
                            <p className="mt-2 text-[11px] leading-5 text-[#bdb6b1]">
                                {list.visibility === 'private'
                                    ? 'Only you can open this private list.'
                                    : list.visibility === 'unlisted'
                                      ? 'Anyone with this link can open the list.'
                                      : 'Share this public list with other players.'}
                            </p>
                        </div>
                    </div>
                    {progress ? (
                        <section
                            className="rounded-md border border-white/10 p-3"
                            aria-labelledby="list-progress-title"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2
                                        id="list-progress-title"
                                        className="text-xs font-medium"
                                    >
                                        You’ve completed
                                    </h2>
                                    <p className="mt-1 text-[11px] text-[#bdb6b1]">
                                        {progress.completed} of {progress.total}{' '}
                                        games
                                    </p>
                                </div>
                                <span className="text-2xl font-light tabular-nums">
                                    {progress.percentage}
                                    <span className="text-xs">%</span>
                                </span>
                            </div>
                            <progress
                                aria-label="Your completion progress"
                                value={progress.completed}
                                max={Math.max(progress.total, 1)}
                                className="mt-3 block h-1.5 w-full accent-[#bdb6b1]"
                            />
                        </section>
                    ) : (
                        <div className="rounded-md border border-white/10 p-3">
                            <p className="text-xs leading-6 text-[#bdb6b1]">
                                Log in to see your completion progress.
                            </p>
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="mt-1"
                            >
                                <Link href={login()}>Log in</Link>
                            </Button>
                        </div>
                    )}
                </aside>
            </div>
        </>
    );
}
