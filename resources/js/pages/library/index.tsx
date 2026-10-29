import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BookOpen, Search } from 'lucide-react';
import LibraryGameCard from '@/components/library-game-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as games } from '@/routes/games';
import { index } from '@/routes/library';
import { libraryStatuses } from '@/types/library';
import type {
    LibraryCounts,
    LibraryFilters,
    LibraryPagination,
} from '@/types/library';

const selectClass =
    'h-11 w-full rounded-md border border-shadow bg-rein px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2';

export default function Library({
    entries,
    counts,
    filters,
}: {
    entries: LibraryPagination;
    counts: LibraryCounts;
    filters: LibraryFilters;
}) {
    const filtered = Boolean(filters.q || filters.status || filters.favorite);
    return (
        <>
            <Head title="Your library" />
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                <div>
                    <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                        A collection of your own
                    </p>
                    <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
                        Your game{' '}
                        <span className="font-serif font-normal text-[#c5bfba] italic">
                            shelf.
                        </span>
                    </h1>
                    <p className="mt-5 max-w-xl text-sm leading-6 text-[#bdb6b1]">
                        Every world you’ve visited. Every adventure still
                        waiting. Open a game to update your experience.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href={games()}>
                        Discover games <ArrowRight aria-hidden="true" />
                    </Link>
                </Button>
            </div>
            <nav
                aria-label="Library status"
                className="mb-8 flex flex-wrap gap-2"
            >
                {[
                    { value: '', label: 'All games', count: counts.total },
                    ...libraryStatuses.map((status) => ({
                        ...status,
                        count: counts[status.value],
                    })),
                ].map((status) => (
                    <Link
                        key={status.value}
                        href={index({
                            query: {
                                ...filters,
                                status: status.value,
                                favorite: filters.favorite ? 1 : undefined,
                            },
                        })}
                        preserveScroll
                        aria-current={
                            filters.status === status.value ? 'page' : undefined
                        }
                        className={`rounded-full border px-4 py-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 ${filters.status === status.value ? 'border-[#c5bfba] bg-[#c5bfba] text-caviar' : 'border-shadow text-[#c5bfba] hover:bg-rein'}`}
                    >
                        {status.label}{' '}
                        <span className="ml-1.5 tabular-nums">
                            {status.count}
                        </span>
                    </Link>
                ))}
            </nav>
            <Form
                action={index()}
                method="get"
                key={JSON.stringify(filters)}
                options={{ preserveScroll: true }}
            >
                {({ processing, errors }) => (
                    <div className="mb-8 rounded-xl border border-white/10 bg-rein/40 p-5">
                        <input
                            type="hidden"
                            name="status"
                            value={filters.status}
                        />
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="min-w-48 flex-1 space-y-2">
                                <Label htmlFor="library-search">
                                    Search your library
                                </Label>
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute top-3.5 left-3 size-4 text-[#bdb6b1]"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        id="library-search"
                                        name="q"
                                        defaultValue={filters.q}
                                        maxLength={100}
                                        placeholder="Find a game on your shelf…"
                                        className="h-11 border-shadow bg-rein pl-10"
                                    />
                                </div>
                            </div>
                            <div className="min-w-40 space-y-2">
                                <Label htmlFor="library-sort">Sort by</Label>
                                <select
                                    id="library-sort"
                                    name="sort"
                                    defaultValue={filters.sort}
                                    className={selectClass}
                                >
                                    <option value="updated">
                                        Recently updated
                                    </option>
                                    <option value="name">Name A–Z</option>
                                </select>
                            </div>
                            <label className="flex h-11 items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    name="favorite"
                                    value="1"
                                    defaultChecked={filters.favorite}
                                    className="size-4 accent-[#c5bfba]"
                                />
                                Favorites only ({counts.favorites})
                            </label>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11"
                            >
                                {processing ? 'Searching…' : 'Apply'}
                            </Button>
                        </div>
                        {Object.values(errors).length > 0 && (
                            <p
                                role="alert"
                                className="mt-4 text-sm text-red-300"
                            >
                                {Object.values(errors).join(' ')}
                            </p>
                        )}
                    </div>
                )}
            </Form>
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-5 text-sm text-[#c5bfba]">
                <p aria-live="polite">
                    {entries.meta.total}{' '}
                    {entries.meta.total === 1 ? 'game' : 'games'}
                    {filtered ? ' found' : ' in your library'}
                </p>
                {filtered && (
                    <Link
                        href={index()}
                        className="rounded-sm text-xs underline underline-offset-4 focus-visible:outline-2"
                    >
                        Clear filters
                    </Link>
                )}
            </div>
            {entries.data.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {entries.data.map((entry) => (
                            <LibraryGameCard key={entry.id} entry={entry} />
                        ))}
                    </div>
                    <nav
                        aria-label="Library pagination"
                        className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6"
                    >
                        <p className="text-xs text-[#bdb6b1]">
                            {entries.meta.from}–{entries.meta.to} of{' '}
                            {entries.meta.total} games · Page{' '}
                            {entries.meta.current_page} of{' '}
                            {entries.meta.last_page}
                        </p>
                        <div className="flex gap-3">
                            {entries.links.prev && (
                                <Button asChild variant="outline">
                                    <Link
                                        href={entries.links.prev}
                                        preserveScroll
                                    >
                                        <ArrowLeft aria-hidden="true" />
                                        Previous
                                    </Link>
                                </Button>
                            )}
                            {entries.links.next && (
                                <Button asChild variant="outline">
                                    <Link
                                        href={entries.links.next}
                                        preserveScroll
                                    >
                                        Next
                                        <ArrowRight aria-hidden="true" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </nav>
                </>
            ) : (
                <section className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-shadow px-6 py-14 text-center">
                    <BookOpen
                        className="mb-6 size-10 text-mustang"
                        strokeWidth={1}
                        aria-hidden="true"
                    />
                    <h2 className="font-serif text-3xl">
                        {counts.total === 0
                            ? 'Your story starts with a game.'
                            : 'No games on this shelf.'}
                    </h2>
                    <p className="mt-4 max-w-md text-sm leading-6 text-[#bdb6b1]">
                        {counts.total === 0
                            ? 'Find a game you love, open its page, and add it to your library.'
                            : 'Try another search or status to find your next adventure.'}
                    </p>
                    <Button asChild variant="outline" className="mt-6">
                        <Link href={counts.total === 0 ? games() : index()}>
                            {counts.total === 0
                                ? 'Explore games'
                                : 'View all your games'}
                        </Link>
                    </Button>
                </section>
            )}
        </>
    );
}
