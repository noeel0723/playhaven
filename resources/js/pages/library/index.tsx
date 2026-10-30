import { Head, Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import LibraryGameCard from '@/components/library-game-card';
import HistoryPagination from '@/components/history-pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAutoFilters } from '@/hooks/use-auto-filters';
import { index as games } from '@/routes/games';
import { index } from '@/routes/library';
import { libraryStatuses } from '@/types/library';
import type {
    LibraryCounts,
    LibraryFilters,
    LibraryPagination,
} from '@/types/library';

const selectClass =
    'h-8 min-w-0 rounded border border-white/10 bg-rein/30 px-2 text-xs text-[#c5bfba] focus-visible:outline-2 [&>option]:bg-[#211f1f]';

export default function Library({
    entries,
    counts,
    filters,
}: {
    entries: LibraryPagination;
    counts: LibraryCounts;
    filters: LibraryFilters;
}) {
    const { values, change, apply, processing, errors } = useAutoFilters(
        index().url,
        filters,
    );
    const filtered = Boolean(filters.q || filters.status || filters.favorite);
    return (
        <>
            <Head title="Library" />
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-sm font-medium tracking-[0.12em] uppercase">
                        Library
                    </h1>
                    <p
                        className="text-[11px] text-[#bdb6b1]"
                        aria-live="polite"
                    >
                        {entries.meta.total}{' '}
                        {entries.meta.total === 1 ? 'game' : 'games'}
                    </p>
                </div>
                <Link
                    href={games()}
                    className="rounded-sm text-xs text-[#bdb6b1] hover:underline focus-visible:outline-2"
                >
                    Discover games
                </Link>
            </header>
            <form
                role="search"
                aria-label="Filter your library"
                aria-busy={processing}
                onSubmit={(event) => {
                    event.preventDefault();
                    apply();
                }}
                className="mb-5 flex flex-wrap items-center gap-2"
            >
                <div className="relative min-w-0 flex-1 basis-40 sm:max-w-60">
                    <Label htmlFor="library-search" className="sr-only">
                        Search your library
                    </Label>
                    <Search
                        className="pointer-events-none absolute top-2.5 left-2.5 size-3 text-[#bdb6b1]"
                        aria-hidden="true"
                    />
                    <Input
                        id="library-search"
                        type="search"
                        value={values.q}
                        maxLength={100}
                        onChange={(event) =>
                            change({ q: event.target.value }, 350)
                        }
                        placeholder="Find a game…"
                        className="h-8 border-white/10 bg-rein/30 pl-8 text-xs"
                    />
                </div>
                <Label htmlFor="library-status" className="sr-only">
                    Status
                </Label>
                <select
                    id="library-status"
                    className={selectClass}
                    value={values.status}
                    onChange={(event) =>
                        change({
                            status: event.target
                                .value as LibraryFilters['status'],
                        })
                    }
                >
                    <option value="">All games ({counts.total})</option>
                    {libraryStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                            {status.label} ({counts[status.value]})
                        </option>
                    ))}
                </select>
                <Label htmlFor="library-sort" className="sr-only">
                    Sort by
                </Label>
                <select
                    id="library-sort"
                    value={values.sort}
                    className={selectClass}
                    onChange={(event) =>
                        change({
                            sort: event.target.value as LibraryFilters['sort'],
                        })
                    }
                >
                    <option value="updated">Recently updated</option>
                    <option value="name">Name A–Z</option>
                </select>
                <label className="inline-flex h-8 items-center gap-1.5 px-1 text-xs text-[#bdb6b1]">
                    <input
                        type="checkbox"
                        checked={values.favorite}
                        onChange={(event) =>
                            change({ favorite: event.target.checked })
                        }
                        className="size-3.5 accent-[#c5bfba]"
                    />{' '}
                    Favorites ({counts.favorites})
                </label>
                {filtered && (
                    <button
                        type="button"
                        onClick={() =>
                            apply({
                                q: '',
                                status: '',
                                favorite: false,
                                sort: 'updated',
                            })
                        }
                        className="rounded-sm px-1 text-xs text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2"
                    >
                        Clear filters
                    </button>
                )}
                {Object.values(errors).length > 0 && (
                    <p role="alert" className="w-full text-xs text-red-300">
                        {Object.values(errors).join(' ')}
                    </p>
                )}
            </form>
            {entries.data.length ? (
                <>
                    <section
                        aria-label="Library games"
                        className="grid grid-cols-3 gap-x-2.5 gap-y-4 min-[420px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12"
                    >
                        {entries.data.map((entry) => (
                            <LibraryGameCard
                                key={entry.id}
                                entry={entry}
                                compact
                            />
                        ))}
                    </section>
                    <HistoryPagination
                        pagination={entries}
                        label="Library pagination"
                        compact
                    />
                </>
            ) : (
                <div className="border-y border-white/10 py-10 text-xs leading-6 text-[#bdb6b1]">
                    <p>
                        {counts.total === 0
                            ? 'No games in your library yet.'
                            : 'No games match these filters.'}
                    </p>
                    {counts.total === 0 ? (
                        <Link
                            href={games()}
                            className="underline underline-offset-4"
                        >
                            Discover games
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() =>
                                apply({
                                    q: '',
                                    status: '',
                                    favorite: false,
                                    sort: 'updated',
                                })
                            }
                            className="rounded-sm underline underline-offset-4 focus-visible:outline-2"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
