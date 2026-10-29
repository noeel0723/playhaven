import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import RawgResult from '@/components/rawg-game-card';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { search } from '@/routes/catalog';
import { index } from '@/routes/games';

type Result = {
    id: number;
    name: string;
    released_on: string | null;
    cover_url: string | null;
    local_slug: string | null;
};

export default function FindGames({
    results,
    query,
    page,
    hasNext,
    error,
}: {
    results: Result[];
    query: string;
    page: number;
    hasNext: boolean;
    error: string | null;
}) {
    return (
        <>
            <Head title="Find more games">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <Link
                href={index()}
                className="mb-8 inline-flex items-center gap-2 rounded-sm text-sm text-[#bdb6b1] focus-visible:outline-2"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to the catalog
            </Link>
            <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                Discover with RAWG
            </p>
            <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
                More worlds.
                <br />
                <span className="font-serif font-normal text-[#c5bfba] italic">
                    More possibilities.
                </span>
            </h1>
            <p className="mt-5 mb-9 max-w-xl text-sm leading-7 text-[#bdb6b1]">
                Find a game beyond the current PlayHaven catalog. Open a result
                to save it automatically, then track it in your library or
                lists.
            </p>
            <Form action={search()} method="get" key={`${query}:${page}`}>
                {({ processing, errors }) => (
                    <div className="mb-8 rounded-xl border border-shadow bg-rein/40 p-5 sm:p-6">
                        <Label htmlFor="rawg-query">
                            Search game titles on RAWG
                        </Label>
                        <div className="mt-3 flex flex-wrap gap-3">
                            <Input
                                id="rawg-query"
                                name="q"
                                defaultValue={query}
                                required
                                minLength={2}
                                maxLength={100}
                                placeholder="Elden Ring, Balatro, Stardew Valley…"
                                className="h-11 min-w-40 flex-1 border-shadow bg-rein"
                            />
                            <Button className="h-11" disabled={processing}>
                                <Search aria-hidden="true" />
                                {processing ? 'Searching…' : 'Search RAWG'}
                            </Button>
                        </div>
                        <InputError
                            message={errors.q || errors.page}
                            role="alert"
                            className="mt-3"
                        />
                    </div>
                )}
            </Form>
            {error && (
                <p
                    role="alert"
                    className="mb-8 rounded-lg border border-shadow p-5 text-sm leading-6 text-[#e3c5bb]"
                >
                    {error}
                </p>
            )}
            {results.length > 0 ? (
                <>
                    <p className="mb-6 text-xs text-[#bdb6b1]">
                        Results for “{query}” · Page {page}
                    </p>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {results.map((game) => (
                            <RawgResult key={game.id} game={game} />
                        ))}
                    </div>
                </>
            ) : (
                !error && (
                    <div className="rounded-xl border border-dashed border-shadow px-6 py-12 text-center">
                        <h2 className="font-serif text-2xl">
                            {query
                                ? 'No games found on this page.'
                                : 'A whole world is a search away.'}
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-[#bdb6b1]">
                            {query
                                ? 'Try another title or browse a different page.'
                                : 'Enter at least two characters and select Search RAWG.'}
                        </p>
                    </div>
                )
            )}
            {query && (
                <nav
                    aria-label="RAWG search pagination"
                    className="mt-10 flex justify-between gap-4 border-t border-white/10 pt-6"
                >
                    {page > 1 ? (
                        <Button asChild variant="outline">
                            <Link
                                href={search({
                                    query: { q: query, page: page - 1 },
                                })}
                            >
                                <ArrowLeft aria-hidden="true" />
                                Previous
                            </Link>
                        </Button>
                    ) : (
                        <span />
                    )}
                    {hasNext && (
                        <Button asChild variant="outline">
                            <Link
                                href={search({
                                    query: { q: query, page: page + 1 },
                                })}
                            >
                                Next
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </Button>
                    )}
                </nav>
            )}
        </>
    );
}
