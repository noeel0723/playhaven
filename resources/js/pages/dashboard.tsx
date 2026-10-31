import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen } from 'lucide-react';
import LibraryGameCard from '@/components/library-game-card';
import { Button } from '@/components/ui/button';
import { index as games } from '@/routes/games';
import { index as library } from '@/routes/library';
import { index as statistics } from '@/routes/stats';
import { me as profile } from '@/routes/players';
import { libraryStatuses } from '@/types/library';
import type { LibraryCounts, LibraryEntry } from '@/types/library';

export default function Dashboard({
    counts,
    recentEntries,
    playerName,
}: {
    counts: LibraryCounts;
    recentEntries: LibraryEntry[];
    playerName: string;
}) {
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title="Your haven" />
            <h1 className="mx-auto mb-5 max-w-2xl text-center text-base leading-6 font-normal wrap-break-word text-[#bdb6b1] sm:text-lg">
                Welcome back,{' '}
                <Link
                    href={profile()}
                    className="rounded-sm text-[#f4f1ed] underline decoration-white/30 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    {playerName}
                </Link>
                . Here’s your latest gaming activity.
            </h1>
            <section aria-labelledby="library-overview" className="mb-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/10 pb-2.5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h2
                            id="library-overview"
                            className="text-xs font-medium"
                        >
                            Library overview
                        </h2>
                        <p className="text-[11px] text-[#bdb6b1]">
                            {counts.total}{' '}
                            {counts.total === 1 ? 'game' : 'games'}
                        </p>
                    </div>
                    <nav
                        aria-label="Dashboard shortcuts"
                        className="ml-auto flex w-full flex-wrap items-center justify-end gap-1 text-[11px] sm:w-auto"
                    >
                        <Link
                            href={library()}
                            className="inline-flex h-7 items-center rounded border border-white/10 bg-rein/20 px-2 text-[#f4f1ed] hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            Library
                        </Link>
                        <Link
                            href={games()}
                            className="inline-flex h-7 items-center rounded px-2 text-[#bdb6b1] hover:bg-rein/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            Discover games
                        </Link>
                        <Link
                            href={statistics()}
                            className="inline-flex h-7 items-center rounded px-2 text-[#bdb6b1] hover:bg-rein/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            Statistic
                        </Link>
                    </nav>
                </div>
                <nav
                    aria-label="Library status filters"
                    className="flex flex-wrap gap-1.5"
                >
                    {libraryStatuses.map((status) => (
                        <Link
                            key={status.value}
                            href={library({ query: { status: status.value } })}
                            className="inline-flex min-h-8 items-center gap-3 rounded border border-white/10 bg-rein/20 px-2.5 py-1 transition-colors hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <span className="text-[11px] text-[#bdb6b1]">
                                {status.label}
                            </span>
                            <span className="text-xs font-medium tabular-nums">
                                {counts[status.value]}
                            </span>
                        </Link>
                    ))}
                    <Link
                        href={library({ query: { favorite: 1 } })}
                        className="inline-flex min-h-8 items-center gap-3 rounded border border-white/10 bg-rein/20 px-2.5 py-1 transition-colors hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <span className="text-[11px] text-[#bdb6b1]">
                            Favorites
                        </span>
                        <span className="text-xs font-medium tabular-nums">
                            {counts.favorites}
                        </span>
                    </Link>
                </nav>
            </section>
            <section aria-labelledby="recent-games">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <h2 id="recent-games" className="text-xs font-medium">
                        On your shelf
                    </h2>
                    <Link
                        href={library()}
                        className="inline-flex min-h-7 items-center gap-1.5 rounded-sm text-[11px] text-[#c5bfba] underline-offset-4 hover:underline focus-visible:outline-2"
                    >
                        View all games{' '}
                        <ArrowRight className="size-3" aria-hidden="true" />
                    </Link>
                </div>
                {recentEntries.length > 0 ? (
                    <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-6 [&_.font-serif]:font-sans">
                        {recentEntries.map((entry) => (
                            <LibraryGameCard
                                key={entry.id}
                                entry={entry}
                                compact
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed border-shadow px-4 py-6 text-center">
                        <BookOpen
                            className="mb-2 size-5 text-mustang"
                            strokeWidth={1}
                            aria-hidden="true"
                        />
                        <h3 className="text-sm font-medium">
                            No games in your library yet.
                        </h3>
                        <p className="mt-2 max-w-sm text-xs leading-5 text-[#bdb6b1]">
                            Add a game to start tracking your library.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="mt-3 h-7 border-white/10 bg-rein/20 px-2.5 text-[11px] text-[#f4f1ed] hover:bg-rein hover:text-white"
                        >
                            <Link href={games()}>Find your first game</Link>
                        </Button>
                    </div>
                )}
            </section>
        </div>
    );
}
