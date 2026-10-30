import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Gamepad2,
    Search,
} from 'lucide-react';
import GameCard from '@/components/game-card';
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
    'h-11 w-full min-w-0 rounded-none border-0 bg-transparent px-3 text-xs text-[#d5cec7] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0d9d3] [&>option]:bg-[#211f1f]';

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
    return (
        <>
            <Head title="Discover games">
                <meta
                    name="description"
                    content="Explore the PlayHaven game catalog. Find your next world by genre, platform, release year, and community ratings."
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
            >
                <div className="mb-9 sm:mb-12">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <p className="shrink-0 text-xs tracking-[0.12em] text-[#bdb6b1] uppercase">
                                Browse by
                            </p>
                            <div className="grid min-w-0 grid-cols-2 divide-x divide-white/10 rounded-md border border-white/15 bg-rein/30 sm:grid-cols-[90px_148px_minmax(118px,1fr)_minmax(125px,1fr)]">
                                <div>
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
                                        onChange={(event) =>
                                            change(
                                                {
                                                    year: event.target.value
                                                        ? Number(
                                                              event.target
                                                                  .value,
                                                          )
                                                        : null,
                                                },
                                                400,
                                                event.target.validity.valid,
                                            )
                                        }
                                        placeholder="Year"
                                        className={selectClass}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="sort" className="sr-only">
                                        Sort by
                                    </Label>
                                    <select
                                        id="sort"
                                        name="sort"
                                        value={values.sort}
                                        onChange={(event) =>
                                            change({ sort: event.target.value })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="recent">
                                            Latest releases
                                        </option>
                                        <option value="name">Name A–Z</option>
                                        <option value="popular">
                                            Most collected
                                        </option>
                                        <option value="rating">
                                            Highest rated
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="genre" className="sr-only">
                                        Genre
                                    </Label>
                                    <select
                                        id="genre"
                                        name="genre"
                                        value={values.genre}
                                        onChange={(event) =>
                                            change({
                                                genre: event.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="">All genres</option>
                                        {genres.map((genre) => (
                                            <option
                                                key={genre.id}
                                                value={genre.slug}
                                            >
                                                {genre.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label
                                        htmlFor="platform"
                                        className="sr-only"
                                    >
                                        Platform
                                    </Label>
                                    <select
                                        id="platform"
                                        name="platform"
                                        value={values.platform}
                                        onChange={(event) =>
                                            change({
                                                platform: event.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="">All platforms</option>
                                        {platforms.map((platform) => (
                                            <option
                                                key={platform.id}
                                                value={platform.slug}
                                            >
                                                {platform.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex min-w-0 items-center gap-3 xl:w-96 xl:shrink-0">
                            <Label htmlFor="game-search" className="sr-only">
                                Find a game
                            </Label>
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    className="pointer-events-none absolute top-3.5 left-3 size-4 text-[#bdb6b1]"
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
                                    className="h-11 border-white/15 bg-rein/50 pl-10 text-sm placeholder:text-[#a59d97]"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-start justify-between gap-4 text-xs text-[#a9a19b]">
                        <details
                            open={Boolean(
                                filters.developer || filters.publisher,
                            )}
                            className="max-w-full min-w-0"
                        >
                            <summary className="w-fit cursor-pointer rounded-sm py-1 focus-visible:outline-2 focus-visible:outline-offset-4">
                                Studio & publisher
                            </summary>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                    <Label
                                        htmlFor="developer"
                                        className="mb-2 text-xs"
                                    >
                                        Developer
                                    </Label>
                                    <select
                                        id="developer"
                                        name="developer"
                                        value={values.developer}
                                        onChange={(event) =>
                                            change({
                                                developer: event.target.value,
                                            })
                                        }
                                        className={`${selectClass} max-w-full rounded-md border border-white/15 bg-rein/30 sm:w-64`}
                                    >
                                        <option value="">All developers</option>
                                        {developers.map((developer) => (
                                            <option
                                                key={developer.id}
                                                value={developer.slug}
                                            >
                                                {developer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label
                                        htmlFor="publisher"
                                        className="mb-2 text-xs"
                                    >
                                        Publisher
                                    </Label>
                                    <select
                                        id="publisher"
                                        name="publisher"
                                        value={values.publisher}
                                        onChange={(event) =>
                                            change({
                                                publisher: event.target.value,
                                            })
                                        }
                                        className={`${selectClass} max-w-full rounded-md border border-white/15 bg-rein/30 sm:w-64`}
                                    >
                                        <option value="">All publishers</option>
                                        {publishers.map((publisher) => (
                                            <option
                                                key={publisher.id}
                                                value={publisher.slug}
                                            >
                                                {publisher.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </details>
                        <Link
                            href={rawgSearch()}
                            className="inline-flex items-center gap-1.5 rounded-sm py-1 text-[#c5bfba] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            Find more games{' '}
                            <ArrowUpRight
                                className="size-3.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </div>
                    {Object.values(errors).length > 0 && (
                        <p role="alert" className="mt-4 text-sm text-red-300">
                            {Object.values(errors).join(' ')}
                        </p>
                    )}
                </div>
            </form>
            <section aria-labelledby="catalog-heading">
                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-white/15 pb-3">
                    <h1
                        id="catalog-heading"
                        className="text-sm font-medium tracking-[0.12em] text-[#c5bfba] uppercase"
                    >
                        {shelfTitle}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4">
                        <p
                            aria-live="polite"
                            className="text-xs text-[#a9a19b]"
                        >
                            {filtered
                                ? `${games.meta.total.toLocaleString()} ${games.meta.total === 1 ? 'result' : 'results'}`
                                : `${catalogCount.toLocaleString()} games to explore`}
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
                                onClick={() =>
                                    apply({
                                        q: '',
                                        genre: '',
                                        platform: '',
                                        developer: '',
                                        publisher: '',
                                        year: null,
                                        sort: 'rating',
                                    })
                                }
                                className="rounded-sm text-xs text-[#c5bfba] underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
                {games.data.length > 0 ? (
                    <>
                        <div
                            className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-6 lg:gap-x-5"
                            data-catalog-grid
                        >
                            {games.data.map((game) => (
                                <GameCard key={game.id} game={game} poster />
                            ))}
                        </div>
                        <nav
                            aria-label="Catalog pagination"
                            className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6"
                        >
                            <p className="text-xs text-[#bdb6b1]">
                                {games.meta.from}–{games.meta.to} of{' '}
                                {games.meta.total} games · Page{' '}
                                {games.meta.current_page} of{' '}
                                {games.meta.last_page}
                            </p>
                            <div className="flex gap-3">
                                {games.links.prev && (
                                    <Button asChild variant="outline">
                                        <Link
                                            href={games.links.prev}
                                            preserveScroll
                                        >
                                            <ArrowLeft aria-hidden="true" />
                                            Previous
                                        </Link>
                                    </Button>
                                )}
                                {games.links.next && (
                                    <Button asChild variant="outline">
                                        <Link
                                            href={games.links.next}
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
                    <section className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-shadow px-6 py-14 text-center">
                        <Gamepad2
                            className="mb-6 size-10 text-mustang"
                            strokeWidth={1}
                            aria-hidden="true"
                        />
                        <h2 className="font-serif text-3xl">
                            {catalogCount === 0
                                ? 'A new world is on the horizon.'
                                : 'No games on this shelf.'}
                        </h2>
                        <p className="mt-4 max-w-md text-sm leading-6 text-[#bdb6b1]">
                            {catalogCount === 0
                                ? 'The first games are on their way. Come back soon to find your next adventure.'
                                : 'Try a different title or loosen a filter. Your next favorite might be one search away.'}
                        </p>
                        {filtered && (
                            <Button asChild variant="outline" className="mt-6">
                                <Link href={index()}>Explore all games</Link>
                            </Button>
                        )}
                        {!filtered && games.meta.current_page > 1 && (
                            <Button asChild variant="outline" className="mt-6">
                                <Link href={index()}>
                                    Back to the first page
                                </Link>
                            </Button>
                        )}
                    </section>
                )}
            </section>
        </>
    );
}
