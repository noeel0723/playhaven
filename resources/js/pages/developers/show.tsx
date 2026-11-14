import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import GameCard from '@/components/game-card';
import HistoryPagination from '@/components/history-pagination';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAutoFilters } from '@/hooks/use-auto-filters';
import { refresh, show } from '@/routes/developers';
import { index } from '@/routes/games';
import type { CatalogPagination, CatalogTerm } from '@/types/catalog';

type Developer = {
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    image_source: 'developer' | 'game' | null;
    games_count: number;
    first_release: string | null;
    latest_release: string | null;
    details_synced_at: string | null;
};

const buttonClass =
    'h-7 gap-1.5 border-white/10 bg-rein/20 px-2.5 text-[11px] text-[#e0d9d3] hover:bg-rein hover:text-white [&_svg]:size-3';

export default function DeveloperDetails({
    developer,
    games,
    genres,
    platforms,
    filters,
    canRefresh,
}: {
    developer: Developer;
    games: CatalogPagination;
    genres: CatalogTerm[];
    platforms: CatalogTerm[];
    filters: { q: string; sort: string };
    canRefresh: boolean;
}) {
    const { values, change, processing, errors } = useAutoFilters(
        show(developer.slug).url,
        filters,
    );
    const info = useForm<{ developer?: string }>({});
    const [expanded, setExpanded] = useState(false);
    const first = developer.first_release?.slice(0, 4);
    const latest = developer.latest_release?.slice(0, 4);
    const facts = [
        { label: 'Genres', terms: genres },
        { label: 'Platforms', terms: platforms },
    ];
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title={`${developer.name} · Developer`}>
                <meta
                    name="description"
                    content={`Explore games developed by ${developer.name}, studio information, and community ratings on PlayHaven.`}
                />
            </Head>
            <Link
                href={index()}
                className="mb-5 inline-flex items-center gap-1.5 rounded-sm text-[11px] text-[#d5cec7] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <ArrowLeft className="size-3" aria-hidden="true" />
                All games
            </Link>
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
                <div className="min-w-0">
                    <p className="mb-1 text-[10px] tracking-widest text-[#bdb6b1] uppercase">
                        Developer
                    </p>
                    <h1 className="max-w-2xl text-3xl leading-tight font-medium tracking-tight wrap-break-word text-white sm:text-4xl lg:text-[2.75rem]">
                        {developer.name}
                    </h1>
                    <p className="mt-2 text-xs text-[#bdb6b1]">
                        {developer.games_count}{' '}
                        {developer.games_count === 1 ? 'game' : 'games'} in
                        PlayHaven
                        {first &&
                            ` · Releases ${first}${latest !== first ? `–${latest}` : ''}`}
                    </p>
                    {developer.image_url &&
                        developer.image_source === 'game' && (
                            <p className="mt-2 text-[10px] text-[#9e9690]">
                                Artwork from the studio’s games
                            </p>
                        )}
                </div>
                {canRefresh && (
                    <Button
                        type="button"
                        variant="outline"
                        className={`${buttonClass} shrink-0 backdrop-blur-sm`}
                        disabled={info.processing}
                        onClick={() =>
                            info.post(refresh(developer.slug).url, {
                                preserveScroll: true,
                            })
                        }
                    >
                        <RefreshCw
                            aria-hidden="true"
                            className={info.processing ? 'animate-spin' : ''}
                        />
                        {info.processing ? 'Updating…' : 'Update info'}
                    </Button>
                )}
            </header>
            <InputError
                message={info.errors.developer}
                role="alert"
                className="mb-4 text-xs"
            />
            <section
                aria-labelledby="about-developer"
                className="mb-7 grid items-start gap-5 border-b border-white/10 pb-6 sm:grid-cols-[minmax(0,1fr)_260px] sm:gap-8"
            >
                <div className="min-w-0">
                    <h2
                        id="about-developer"
                        className="mb-2 text-xs font-medium tracking-wider uppercase"
                    >
                        About the developer
                    </h2>
                    {developer.description ? (
                        <>
                            <p
                                className={`text-xs leading-6 whitespace-pre-line text-[#bdb6b1] ${expanded ? '' : 'line-clamp-6'}`}
                            >
                                {developer.description}
                            </p>
                            {(developer.description.length > 240 ||
                                developer.description.split('\n').length >
                                    5) && (
                                <button
                                    type="button"
                                    className="mt-2 rounded-sm text-[11px] underline underline-offset-4 focus-visible:outline-2"
                                    aria-expanded={expanded}
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    {expanded ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </>
                    ) : (
                        <p className="text-xs leading-6 text-[#bdb6b1]">
                            {developer.details_synced_at
                                ? 'No biography is available for this developer yet.'
                                : 'Developer information has not been updated yet.'}
                            {!developer.details_synced_at && canRefresh && (
                                <>
                                    {' '}
                                    Select Update info to check for a biography.
                                </>
                            )}
                        </p>
                    )}
                </div>
                <aside
                    aria-label="Developer information"
                    className="min-w-0 self-start rounded-lg border border-white/10 bg-[#151313]/90 p-4 backdrop-blur-sm"
                >
                    <dl className="divide-y divide-white/10 text-[11px] leading-5">
                        {facts.map(({ label, terms }) => (
                            <div
                                key={label}
                                className="min-w-0 py-3 first:pt-0 last:pb-0"
                            >
                                <dt className="mb-2 font-medium text-[#e0d9d3]">
                                    {label}
                                </dt>
                                <dd>
                                    {terms.length ? (
                                        <ul
                                            className="flex min-w-0 flex-wrap gap-1.5"
                                            aria-label={label}
                                        >
                                            {terms.map((term) => (
                                                <li
                                                    key={term.id}
                                                    className="max-w-full rounded-md border border-white/10 bg-white/[0.035] px-2 py-0.5 wrap-break-word text-[#c5bfba]"
                                                >
                                                    {term.name}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-[#9e9690]">
                                            Not listed
                                        </p>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </aside>
            </section>
            <section aria-labelledby="developer-games" aria-busy={processing}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <h2
                        id="developer-games"
                        className="text-xs font-medium tracking-wider uppercase"
                    >
                        Games{' '}
                        <span className="ml-1 text-[11px] font-normal tracking-normal text-[#bdb6b1]">
                            {games.meta.total}
                        </span>
                    </h2>
                    <div className="flex w-full gap-2 sm:w-auto">
                        <div className="relative min-w-0 flex-1 sm:w-44">
                            <label
                                htmlFor="developer-game-search"
                                className="sr-only"
                            >
                                Search this developer’s games
                            </label>
                            <Search
                                className="pointer-events-none absolute top-2 left-2 size-3 text-[#bdb6b1]"
                                aria-hidden="true"
                            />
                            <Input
                                id="developer-game-search"
                                type="search"
                                value={values.q}
                                maxLength={100}
                                placeholder="Find a game…"
                                onChange={(event) =>
                                    change({ q: event.target.value }, 250)
                                }
                                className="h-7 border-white/10 bg-rein/25 pl-7 text-xs"
                            />
                        </div>
                        <label
                            className="sr-only"
                            htmlFor="developer-game-sort"
                        >
                            Sort games
                        </label>
                        <select
                            id="developer-game-sort"
                            value={values.sort}
                            onChange={(event) =>
                                change({ sort: event.target.value })
                            }
                            className="h-7 max-w-36 rounded-md border border-white/10 bg-[#211f1f] px-2 text-[11px]"
                        >
                            <option value="rating">Highest rated</option>
                            <option value="recent">Latest release</option>
                            <option value="popular">Most collected</option>
                            <option value="name">Name</option>
                        </select>
                    </div>
                </div>
                <InputError
                    message={errors.q || errors.sort}
                    role="alert"
                    className="mb-3 text-xs"
                />
                {games.data.length ? (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
                        {games.data.map((game) => (
                            <GameCard key={game.id} game={game} poster />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed border-white/10 px-4 py-8 text-center text-xs text-[#bdb6b1]">
                        {filters.q
                            ? 'No games match your search.'
                            : 'No games from this developer are in the catalog yet.'}
                    </div>
                )}
                <HistoryPagination
                    pagination={games}
                    label="Developer games pagination"
                    compact
                    dense
                />
            </section>
        </div>
    );
}
