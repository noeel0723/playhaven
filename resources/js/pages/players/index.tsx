import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Search, Users } from 'lucide-react';
import HistoryPagination from '@/components/history-pagination';
import PlayerDiscoveryCard from '@/components/player-discovery-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { register } from '@/routes';
import { index as community } from '@/routes/community';
import { index as games } from '@/routes/games';
import { index, edit, me } from '@/routes/players';
import type { PlayerPagination } from '@/types/community';

export default function Players({
    players,
    query,
    hasDiscoverablePlayers,
}: {
    players: PlayerPagination;
    query: string;
    hasDiscoverablePlayers: boolean;
}) {
    const { auth } = usePage().props;
    const emptyTitle = !hasDiscoverablePlayers
        ? auth.user
            ? 'No other players yet.'
            : 'No players here yet.'
        : query
          ? 'No players found.'
          : 'No players on this page.';
    return (
        <>
            <Head title="Find players">
                <meta
                    name="description"
                    content="Find your people on PlayHaven. Discover public player profiles, explore their favorite games, and follow their stories."
                />
            </Head>
            <section
                aria-labelledby="players-title"
                className="mx-auto mb-12 max-w-4xl pt-2 text-center sm:mb-16 sm:pt-3"
            >
                <h1
                    id="players-title"
                    className="text-2xl leading-snug font-light tracking-tight text-[#d5cec7] sm:text-3xl sm:leading-snug"
                >
                    Players, storytellers, and friends.
                    <br className="sm:hidden" /> Find your people.
                </h1>
                <p className="mt-4 text-sm leading-7 text-[#a9a19b]">
                    Different worlds. Shared stories. A community built around
                    the love of play.
                </p>
            </section>
            <section aria-labelledby="discover-players">
                <div className="mb-8 flex flex-col gap-5 border-b border-white/15 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                    <div>
                        <h2
                            id="discover-players"
                            className="text-sm font-medium tracking-[0.12em] text-[#c5bfba] uppercase"
                        >
                            {query ? 'Player search' : 'Players to discover'}
                        </h2>
                        <p
                            aria-live="polite"
                            className="mt-2 text-xs text-[#a9a19b]"
                        >
                            {players.meta.total.toLocaleString()}{' '}
                            {players.meta.total === 1 ? 'player' : 'players'}
                            {query && (
                                <>
                                    {' '}
                                    matching{' '}
                                    <span className="text-[#d5cec7]">
                                        “{query}”
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                    <Form
                        key={query}
                        action={index()}
                        method="get"
                        role="search"
                        aria-label="Find players"
                        className="w-full sm:w-80"
                    >
                        {({ processing, errors }) => (
                            <>
                                <Label
                                    htmlFor="player-search"
                                    className="sr-only"
                                >
                                    Search by username or display name
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="player-search"
                                        name="q"
                                        type="search"
                                        defaultValue={query}
                                        maxLength={100}
                                        placeholder="Find a player…"
                                        className="h-11 min-w-0 border-white/15 bg-rein/40 placeholder:text-[#a59d97]"
                                    />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={processing}
                                        className="size-11 shrink-0 border-white/15 bg-rein/30 p-0"
                                        aria-label="Search players"
                                    >
                                        <Search
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </div>
                                {errors.q && (
                                    <p
                                        role="alert"
                                        className="mt-3 text-sm text-red-300"
                                    >
                                        {errors.q}
                                    </p>
                                )}
                            </>
                        )}
                    </Form>
                </div>
                {(query || auth.user) && (
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[#bdb6b1]">
                        {query ? (
                            <Link
                                href={index()}
                                className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                            >
                                Clear search
                            </Link>
                        ) : (
                            <p>Discover other public player profiles.</p>
                        )}
                        {auth.user && (
                            <Link
                                href={me()}
                                className="inline-flex items-center gap-2 rounded-sm text-[#d5cec7] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                            >
                                Profile{' '}
                                <ArrowRight
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                            </Link>
                        )}
                    </div>
                )}
                {players.data.length ? (
                    <div
                        className="grid grid-cols-2 gap-x-5 gap-y-12 pb-10 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-5 lg:gap-x-8"
                        data-player-grid
                    >
                        {players.data.map((player) => (
                            <PlayerDiscoveryCard
                                key={player.username}
                                player={player}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-96 flex-col items-center justify-center border-b border-white/10 px-2 pt-8 pb-14 text-center sm:px-8 sm:py-16">
                        <div className="mb-7 flex size-20 items-center justify-center rounded-full border border-white/15 bg-rein/20">
                            <Users
                                className="size-8 text-[#bdb6b1]"
                                strokeWidth={1.25}
                                aria-hidden="true"
                            />
                        </div>
                        <h3 className="font-serif text-3xl text-[#f4f1ed] sm:text-4xl">
                            {emptyTitle}
                        </h3>
                        <p className="mt-5 max-w-lg text-sm leading-7 text-[#bdb6b1]">
                            {!hasDiscoverablePlayers
                                ? 'PlayHaven is just getting started. Other players will appear here when they make their profiles public.'
                                : query
                                  ? 'Try a different username or display name. Only public player profiles appear in discovery.'
                                  : 'There are no more players on this page. Return to the first page to keep exploring.'}
                        </p>
                        <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
                            {!hasDiscoverablePlayers ? (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="border-white/20 bg-rein/30"
                                >
                                    <Link
                                        href={auth.user ? edit() : register()}
                                    >
                                        {auth.user
                                            ? 'Make your profile your own'
                                            : 'Join PlayHaven'}
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild variant="outline">
                                    <Link href={index()}>
                                        {query
                                            ? 'Browse all players'
                                            : 'Back to the first page'}
                                    </Link>
                                </Button>
                            )}
                            <Link
                                href={games()}
                                className="inline-flex items-center gap-2 rounded-sm text-sm text-[#c5bfba] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                            >
                                Explore games{' '}
                                <ArrowRight
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </div>
                )}
                <HistoryPagination
                    pagination={players}
                    label="Player discovery pages"
                />
            </section>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-xs leading-6 text-[#a9a19b]">
                <p>Only profiles made public by their players appear here.</p>
                <Link
                    href={community()}
                    className="rounded-sm underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    Read community stories
                </Link>
            </div>
        </>
    );
}
