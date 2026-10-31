import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import RawgResult from '@/components/rawg-game-card';
import type { RawgGamePreview } from '@/components/rawg-game-card';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { search } from '@/routes/catalog';
import { index } from '@/routes/games';

const buttonClass =
    'h-7 gap-1.5 border-white/10 bg-rein/20 px-2.5 text-[11px] text-[#e0d9d3] hover:bg-rein hover:text-white [&_svg]:size-3';

export default function FindGames({
    results,
    query,
    page,
    hasNext,
    error,
}: {
    results: RawgGamePreview[];
    query: string;
    page: number;
    hasNext: boolean;
    error: string | null;
}) {
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title="Find more games">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <Link
                href={index()}
                className="mb-4 inline-flex min-h-7 items-center gap-1.5 rounded-sm text-[11px] text-[#bdb6b1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <ArrowLeft className="size-3" aria-hidden="true" />
                Back to the catalog
            </Link>
            <header className="mb-4 border-b border-white/10 pb-3">
                <h1 className="text-xl font-medium tracking-tight">
                    Find more games
                </h1>
            </header>
            <Form
                action={search()}
                method="get"
                key={`${query}:${page}`}
                options={{ preserveState: 'errors' }}
                role="search"
                aria-label="Search RAWG games"
            >
                {({ processing, errors }) => (
                    <div className="mb-5">
                        <Label htmlFor="rawg-query" className="text-xs">
                            Search game titles on RAWG
                        </Label>
                        <div className="mt-1.5 flex items-center gap-2">
                            <Input
                                id="rawg-query"
                                name="q"
                                defaultValue={query}
                                required
                                minLength={2}
                                maxLength={100}
                                placeholder="Find a game…"
                                className="h-7 min-w-0 flex-1 border-white/10 bg-rein/30 px-2 text-xs"
                            />
                            <Button
                                type="submit"
                                className={`shrink-0 ${buttonClass}`}
                                disabled={processing}
                            >
                                <Search aria-hidden="true" />
                                {processing ? 'Searching…' : 'Search RAWG'}
                            </Button>
                        </div>
                        <InputError
                            message={errors.q || errors.page}
                            role="alert"
                            className="mt-1.5 text-[11px] leading-4"
                        />
                    </div>
                )}
            </Form>
            {error && (
                <p
                    role="alert"
                    className="mb-4 rounded-md border border-shadow p-3 text-xs leading-5 text-[#e3c5bb]"
                >
                    {error}
                </p>
            )}
            {results.length > 0 ? (
                <>
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                        <h2 className="min-w-0 text-xs font-medium wrap-break-word">
                            Results for “{query}”
                        </h2>
                        <p className="text-[11px] text-[#bdb6b1]">
                            {results.length} results · Page {page}
                        </p>
                    </div>
                    <div
                        className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6"
                        data-rawg-results
                    >
                        {results.map((game) => (
                            <RawgResult
                                key={game.id}
                                game={game}
                                compact
                                dense
                            />
                        ))}
                    </div>
                </>
            ) : (
                !error && (
                    <div className="rounded-md border border-dashed border-shadow px-4 py-7 text-center">
                        <h2 className="text-sm font-medium">
                            {query
                                ? 'No games found on this page.'
                                : 'Search for a game'}
                        </h2>
                        <p className="mt-2 text-xs leading-5 text-[#bdb6b1]">
                            {query
                                ? 'Try another title or browse a different page.'
                                : 'Enter at least two characters to search RAWG.'}
                        </p>
                    </div>
                )
            )}
            {query && (
                <nav
                    aria-label="RAWG search pagination"
                    className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3"
                >
                    <p className="text-[11px] text-[#bdb6b1]">Page {page}</p>
                    <div className="ml-auto flex gap-2">
                        {page > 1 && (
                            <Button
                                asChild
                                variant="outline"
                                className={buttonClass}
                            >
                                <Link
                                    href={search({
                                        query: { q: query, page: page - 1 },
                                    })}
                                >
                                    <ArrowLeft aria-hidden="true" />
                                    Previous
                                </Link>
                            </Button>
                        )}
                        {hasNext && (
                            <Button
                                asChild
                                variant="outline"
                                className={buttonClass}
                            >
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
                    </div>
                </nav>
            )}
        </div>
    );
}
