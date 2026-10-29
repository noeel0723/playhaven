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
            <section className="mb-12 border-b border-white/10 pb-10">
                <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                    Welcome back, {auth.user.name}
                </p>
                <h1 className="max-w-3xl text-4xl leading-tight font-medium tracking-tight sm:text-6xl">
                    Your games.
                    <br />
                    <span className="font-serif font-normal text-[#c5bfba] italic">
                        Your next chapter.
                    </span>
                </h1>
                <p className="mt-6 max-w-xl text-sm leading-7 text-[#bdb6b1]">
                    A place for the worlds you’re exploring, the stories you’ve
                    finished, and everything you want to play next.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href={library()}>
                            Your library <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={games()}>Discover games</Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href={statistics()}>
                            Your statistics <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                </div>
            </section>
            <section aria-labelledby="library-overview" className="mb-12">
                <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                    <h2 id="library-overview" className="font-serif text-3xl">
                        At a glance
                    </h2>
                    <p className="text-xs text-[#bdb6b1]">
                        {counts.total} {counts.total === 1 ? 'game' : 'games'}{' '}
                        in your library
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {libraryStatuses.map((status) => (
                        <Link
                            key={status.value}
                            href={library({ query: { status: status.value } })}
                            className="rounded-xl border border-shadow bg-rein/30 px-5 py-5 transition-colors hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <p className="text-3xl tabular-nums">
                                {counts[status.value]}
                            </p>
                            <p className="mt-2 text-xs text-[#bdb6b1]">
                                {status.label}
                            </p>
                        </Link>
                    ))}
                    <Link
                        href={library({ query: { favorite: 1 } })}
                        className="rounded-xl border border-shadow bg-rein/30 px-5 py-5 transition-colors hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <p className="text-3xl tabular-nums">
                            {counts.favorites}
                        </p>
                        <p className="mt-2 text-xs text-[#bdb6b1]">Favorites</p>
                    </Link>
                </div>
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
