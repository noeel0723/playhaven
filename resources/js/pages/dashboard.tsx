import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen } from 'lucide-react';
import LibraryGameCard from '@/components/library-game-card';
import { Button } from '@/components/ui/button';
import { index as games } from '@/routes/games';
import { index as library } from '@/routes/library';
import { index as statistics } from '@/routes/stats';
import { libraryStatuses } from '@/types/library';
import type { LibraryCounts, LibraryEntry } from '@/types/library';

export default function Dashboard({
    counts,
    recentEntries,
}: {
    counts: LibraryCounts;
    recentEntries: LibraryEntry[];
}) {
    const { auth } = usePage().props;
    return (
        <>
            <Head title="Your haven" />
            <section className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight">
                        Your haven
                    </h1>
                    <p className="mt-1 text-xs text-[#bdb6b1]">
                        Welcome back, {auth.user.name}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                        <Link href={library()}>
                            Your library <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-shadow bg-rein/30 text-[#f4f1ed] hover:bg-rein hover:text-white"
                    >
                        <Link href={games()}>Discover games</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                        <Link href={statistics()}>
                            Your statistics <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                </div>
            </section>
            <section aria-labelledby="library-overview" className="mb-8">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="library-overview" className="text-sm font-medium">
                        Library overview
                    </h2>
                    <p className="text-xs text-[#bdb6b1]">
                        {counts.total} {counts.total === 1 ? 'game' : 'games'}{' '}
                        in your library
                    </p>
                </div>
                <nav
                    aria-label="Library status filters"
                    className="grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-5"
                >
                    {libraryStatuses.map((status) => (
                        <Link
                            key={status.value}
                            href={library({ query: { status: status.value } })}
                            className="flex min-h-10 items-center justify-between gap-2 rounded-md border border-white/10 bg-rein/15 px-3 py-2 transition-colors hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <span className="text-xs text-[#bdb6b1]">
                                {status.label}
                            </span>
                            <span className="text-sm font-medium tabular-nums">
                                {counts[status.value]}
                            </span>
                        </Link>
                    ))}
                    <Link
                        href={library({ query: { favorite: 1 } })}
                        className="flex min-h-10 items-center justify-between gap-2 rounded-md border border-white/10 bg-rein/15 px-3 py-2 transition-colors hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <span className="text-xs text-[#bdb6b1]">
                            Favorites
                        </span>
                        <span className="text-sm font-medium tabular-nums">
                            {counts.favorites}
                        </span>
                    </Link>
                </nav>
            </section>
            <section aria-labelledby="recent-games">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <h2 id="recent-games" className="font-serif text-3xl">
                        On your shelf
                    </h2>
                    <Link
                        href={library()}
                        className="inline-flex items-center gap-2 rounded-sm text-xs text-[#c5bfba] underline underline-offset-4 focus-visible:outline-2"
                    >
                        View all games{' '}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                </div>
                {recentEntries.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
                        {recentEntries.map((entry) => (
                            <LibraryGameCard key={entry.id} entry={entry} />
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-shadow px-6 py-12 text-center">
                        <BookOpen
                            className="mb-5 size-9 text-mustang"
                            strokeWidth={1}
                            aria-hidden="true"
                        />
                        <h3 className="font-serif text-2xl">
                            Make this haven yours.
                        </h3>
                        <p className="mt-3 max-w-md text-sm leading-6 text-[#bdb6b1]">
                            Start with a favorite, a game you’re playing, or
                            something on your wishlist.
                        </p>
                        <Button asChild variant="outline" className="mt-6">
                            <Link href={games()}>Find your first game</Link>
                        </Button>
                    </div>
                )}
            </section>
        </>
    );
}
