import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Gamepad2, Search } from 'lucide-react';
import GameCard from '@/components/game-card';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAutoFilters } from '@/hooks/use-auto-filters';
import { index } from '@/routes/games';
import { search as rawgSearch } from '@/routes/catalog';
import type {
    CatalogFilters,
    CatalogPagination,
    CatalogTerm,
} from '@/types/catalog';

type Props = {
    games: CatalogPagination;
    filters: CatalogFilters;
    genres: CatalogTerm[];
    platforms: CatalogTerm[];
    developers: CatalogTerm[];
    publishers: CatalogTerm[];
    catalogCount: number;
};
const selectClass =
    'h-7 w-full min-w-0 rounded-none border-0 bg-transparent px-2 font-sans text-[11px] text-[#d5cec7] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 [&>option]:bg-[#211f1f]';
const buttonClass =
    'h-7 border-white/10 bg-rein/20 px-2.5 text-[11px] text-[#e0d9d3] hover:bg-rein hover:text-white';
const studioClass = `${selectClass} rounded border border-white/10 bg-rein/30 sm:w-48`;
const optionsFor = (terms: CatalogTerm[], all: string) => [
    { value: '', label: all },
    ...terms.map((term) => ({ value: term.slug, label: term.name })),
];

function CatalogSelect({
    id,
    label,
    value,
    options,
    onChange,
    studio = false,
}: {
    id: string;
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    studio?: boolean;
}) {
    return (
        <div className="min-w-0">
            <Label
                htmlFor={id}
                className={studio ? 'mb-1 text-[11px]' : 'sr-only'}
            >
                {label}
            </Label>
            <select
                id={id}
                name={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={studio ? studioClass : selectClass}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default function Games({
    games,
    filters,
    genres,
    platforms,
    developers,
    publishers,
    catalogCount,
}: Props) {
    const { values, change, apply, processing, errors } = useAutoFilters(
        index().url,
        filters,
        (next) =>
            next.year === null ||
            (Number.isInteger(next.year) &&
                next.year >= 1970 &&
                next.year <= 2100),
    );
    const filtered = Boolean(
        filters.q ||
        filters.genre ||
        filters.platform ||
        filters.year ||
        filters.developer ||
        filters.publisher,
    );
    const shelfTitle = filtered
        ? 'Search results'
        : ({
              recent: 'Recently released',
              name: 'Explore the catalog',
              popular: 'Most collected games',
              rating: 'Highest rated games',
          }[filters.sort] ?? 'Explore the catalog');
    function clearFilters() {
        apply({
            q: '',
            genre: '',
            platform: '',
            developer: '',
            publisher: '',
            year: null,
            sort: 'rating',
        });
    }

    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title="Discover games">
                <meta
                    name="description"
                    content="Browse the PlayHaven game catalog by title, genre, platform, studio, release year, and community rating."
                />
            </Head>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    apply();
                }}
                role="search"
                aria-label="Filter the game catalog"
                aria-busy={processing}
                className="mb-5"
            >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <p className="shrink-0 text-[11px] tracking-[0.12em] text-[#bdb6b1] uppercase">
                            Browse by
                        </p>
                        <div className="grid min-w-0 grid-cols-2 divide-x divide-white/10 rounded border border-white/10 bg-rein/20 sm:grid-cols-[64px_120px_minmax(100px,1fr)_minmax(110px,1fr)]">
                            <div className="min-w-0">
                                <Label htmlFor="year" className="sr-only">
                                    Release year
                                </Label>
                                <input
                                    id="year"
                                    name="year"
                                    type="number"
                                    min={1970}
                                    max={2100}
                                    value={values.year ?? ''}
                                    placeholder="Year"
                                    className={selectClass}
                                    onChange={(event) =>
                                        change(
                                            {
                                                year: event.target.value
                                                    ? Number(event.target.value)
                                                    : null,
                                            },
                                            400,
                                            event.target.validity.valid,
                                        )
                                    }
                                />
                            </div>
                            <CatalogSelect
                                id="sort"
                                label="Sort by"
                                value={values.sort}
                                onChange={(sort) => change({ sort })}
                                options={[
                                    { value: 'rating', label: 'Highest rated' },
                                    {
                                        value: 'popular',
                                        label: 'Most collected',
                                    },
                                    {
                                        value: 'recent',
                                        label: 'Latest releases',
                                    },
                                    { value: 'name', label: 'Name A–Z' },
                                ]}
                            />
                            <CatalogSelect
                                id="genre"
                                label="Genre"
                                value={values.genre}
                                onChange={(genre) => change({ genre })}
                                options={optionsFor(genres, 'All genres')}
                            />
                            <CatalogSelect
                                id="platform"
                                label="Platform"
                                value={values.platform}
                                onChange={(platform) => change({ platform })}
                                options={optionsFor(platforms, 'All platforms')}
                            />
                        </div>
                    </div>
                    <div className="relative w-full min-w-0 sm:max-w-xs lg:w-56 lg:shrink-0">
                        <Label htmlFor="game-search" className="sr-only">
                            Find a game
                        </Label>
                        <Search
                            className="pointer-events-none absolute top-2 left-2.5 size-3 text-[#bdb6b1]"
                            aria-hidden="true"
                        />
                        <Input
                            id="game-search"
                            name="q"
                            type="search"
                            value={values.q}
                            onChange={(event) =>
                                change({ q: event.target.value }, 350)
                            }
                            maxLength={100}
                            placeholder="Find a game…"
                            className="h-7 border-white/10 bg-rein/30 pl-8 text-xs placeholder:text-[#a59d97]"
                        />
                    </div>
                </div>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3 text-[11px] text-[#a9a19b]">
                    <details
                        open={Boolean(filters.developer || filters.publisher)}
                        className="max-w-full min-w-0"
                    >
                        <summary className="h-7 w-fit cursor-pointer rounded px-1.5 py-1 leading-5 hover:bg-rein/30 focus-visible:outline-2 focus-visible:outline-offset-2">
                            Studio & publisher
                        </summary>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <CatalogSelect
                                id="developer"
                                label="Developer"
                                value={values.developer}
                                onChange={(developer) => change({ developer })}
                                options={optionsFor(
                                    developers,
                                    'All developers',
                                )}
                                studio
                            />
                            <CatalogSelect
                                id="publisher"
                                label="Publisher"
                                value={values.publisher}
                                onChange={(publisher) => change({ publisher })}
                                options={optionsFor(
                                    publishers,
                                    'All publishers',
                                )}
                                studio
                            />
                        </div>
                    </details>
                    <Link
                        href={rawgSearch()}
                        className="inline-flex h-7 items-center gap-1 rounded px-1.5 text-[#c5bfba] hover:bg-rein/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        Find more games
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                    </Link>
                </div>
                {Object.values(errors).length > 0 && (
                    <p role="alert" className="mt-2 text-xs text-red-300">
                        {Object.values(errors).join(' ')}
                    </p>
                )}
                <button type="submit" hidden>
                    Search games
                </button>
            </form>
            <section aria-labelledby="catalog-heading">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <h1
                        id="catalog-heading"
                        className="text-xs font-medium tracking-[0.12em] text-[#c5bfba] uppercase"
                    >
                        {shelfTitle}
                    </h1>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p
                            aria-live="polite"
                            className="min-w-0 text-[11px] wrap-break-word text-[#a9a19b]"
                        >
                            {filtered
                                ? `${games.meta.total.toLocaleString()} ${games.meta.total === 1 ? 'result' : 'results'}`
                                : `${catalogCount.toLocaleString()} games`}
                            {filters.q && (
                                <>
                                    {' '}
                                    for{' '}
                                    <span className="text-[#e0d9d3]">
                                        “{filters.q}”
                                    </span>
                                </>
                            )}
                        </p>
                        {filtered && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex h-7 items-center rounded px-1.5 text-[11px] text-[#c5bfba] underline underline-offset-4 hover:bg-rein/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
                {games.data.length ? (
                    <>
                        <div
                            className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6"
                            data-catalog-grid
                        >
                            {games.data.map((game) => (
                                <GameCard key={game.id} game={game} poster />
                            ))}
                        </div>
                        <HistoryPagination
                            pagination={games}
                            label="Catalog pagination"
                            compact
                            dense
                        />
                    </>
                ) : (
                    <div className="rounded-md border border-dashed border-shadow px-4 py-7 text-center">
                        <Gamepad2
                            className="mx-auto mb-2 size-6 text-mustang"
                            strokeWidth={1.25}
                            aria-hidden="true"
                        />
                        <h2 className="text-sm font-medium">
                            {catalogCount === 0
                                ? 'No games in the catalog yet.'
                                : filtered
                                  ? 'No games match these filters.'
                                  : 'No games on this page.'}
                        </h2>
                        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#bdb6b1]">
                            {catalogCount === 0
                                ? 'Imported games will appear here.'
                                : filtered
                                  ? 'Try a different title or clear a filter.'
                                  : 'Return to the first page to browse the catalog.'}
                        </p>
                        {filtered && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={`mt-3 ${buttonClass}`}
                                onClick={clearFilters}
                            >
                                Clear filters
                            </Button>
                        )}
                        {!filtered && games.meta.current_page > 1 && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className={`mt-3 ${buttonClass}`}
                            >
                                <Link href={index()}>
                                    Back to the first page
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
