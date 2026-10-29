import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Gamepad2,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import GameCard from '@/components/game-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    catalogCount: number;
};
const selectClass =
    'h-10 w-full rounded-md border border-shadow bg-rein px-3 text-sm text-[#f4f1ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0d9d3]';

export default function Games({
    games,
    filters,
    genres,
    platforms,
    catalogCount,
}: Props) {
    const filtered = Boolean(
        filters.q || filters.genre || filters.platform || filters.year,
    );
    return (
        <>
            <Head title="Discover games">
                <meta
                    name="description"
                    content="Explore the PlayHaven game catalog. Find your next world by genre, platform, release year, and community ratings."
                />
            </Head>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="mb-4 text-xs tracking-[0.22em] text-[#bdb6b1] uppercase">
                        Find your next world
                    </p>
                    <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
                        The game{' '}
                        <span className="font-serif font-normal text-[#c5bfba] italic">
                            shelf.
                        </span>
                    </h1>
                    <p className="mt-5 max-w-xl text-sm leading-6 text-[#bdb6b1]">
                        The worlds you know. The ones waiting to be discovered.
                    </p>
                </div>
                <div className="space-y-3 text-right">
                    <Button asChild variant="outline">
                        <Link href={rawgSearch()}>Find more games</Link>
                    </Button>
                    <p className="text-xs text-[#bdb6b1]">
                        {catalogCount.toLocaleString()}{' '}
                        {catalogCount === 1 ? 'game' : 'games'} to explore
                    </p>
                </div>
            </div>
            <Form
                action={index()}
                method="get"
                options={{ preserveScroll: true }}
                key={JSON.stringify(filters)}
            >
                {({ processing, errors }) => (
                    <div className="mb-10 rounded-xl border border-white/10 bg-rein/40 p-5 sm:p-6">
                        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_0.8fr_1fr_auto]">
                            <div className="space-y-2">
                                <Label htmlFor="game-search">
                                    Search games
                                </Label>
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute top-3 left-3 size-4 text-[#bdb6b1]"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        id="game-search"
                                        name="q"
                                        defaultValue={filters.q}
                                        maxLength={100}
                                        placeholder="A game you can’t stop thinking about…"
                                        className="h-10 border-shadow bg-rein pl-10 placeholder:text-[#a59d97]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="genre">Genre</Label>
                                <select
                                    id="genre"
                                    name="genre"
                                    defaultValue={filters.genre}
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
                            <div className="space-y-2">
                                <Label htmlFor="platform">Platform</Label>
                                <select
                                    id="platform"
                                    name="platform"
                                    defaultValue={filters.platform}
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
                            <div className="space-y-2">
                                <Label htmlFor="year">Release year</Label>
                                <Input
                                    id="year"
                                    name="year"
                                    type="number"
                                    min={1970}
                                    max={2100}
                                    defaultValue={filters.year ?? ''}
                                    placeholder="Any year"
                                    className="h-10 border-shadow bg-rein"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sort">Sort by</Label>
                                <select
                                    id="sort"
                                    name="sort"
                                    defaultValue={filters.sort}
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
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-10"
                            >
                                <SlidersHorizontal aria-hidden="true" />
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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                <p aria-live="polite" className="text-sm text-[#c5bfba]">
                    {filtered
                        ? `${games.meta.total.toLocaleString()} ${games.meta.total === 1 ? 'result' : 'results'}`
                        : 'Explore the catalog'}
                    {filters.q && (
                        <>
                            {' '}
                            for{' '}
                            <span className="font-medium text-[#f4f1ed]">
                                “{filters.q}”
                            </span>
                        </>
                    )}
                </p>
                {filtered && (
                    <Link
                        href={index()}
                        className="rounded-sm text-xs underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                        Clear filters
                    </Link>
                )}
            </div>
            {games.data.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {games.data.map((game) => (
                            <GameCard key={game.id} game={game} />
                        ))}
                    </div>
                    <nav
                        aria-label="Catalog pagination"
                        className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6"
                    >
                        <p className="text-xs text-[#bdb6b1]">
                            {games.meta.from}–{games.meta.to} of{' '}
                            {games.meta.total} games · Page{' '}
                            {games.meta.current_page} of {games.meta.last_page}
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
                            <Link href={index()}>Back to the first page</Link>
                        </Button>
                    )}
                </section>
            )}
        </>
    );
}
