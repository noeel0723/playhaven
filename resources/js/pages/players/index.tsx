import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Search, Users } from 'lucide-react';
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

const buttonClass =
    'h-7 border-white/10 bg-rein/20 px-2.5 text-[11px] text-[#e0d9d3] hover:bg-rein hover:text-white';
const linkClass =
    'inline-flex h-7 items-center rounded px-2 text-[11px] text-[#bdb6b1] hover:bg-rein/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2';

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
        <div className="mx-auto max-w-4xl font-sans">
            <Head title="Find players">
                <meta
                    name="description"
                    content="Discover public player profiles, favorite games, and reviews on PlayHaven."
                />
            </Head>
            <header className="mx-auto mb-7 max-w-2xl text-center">
                <h1 className="text-lg leading-7 font-light tracking-tight text-[#d5cec7] sm:text-xl">
                    Discover players.
                </h1>
            </header>
            <section aria-labelledby="discover-players">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex flex-wrap items-baseline gap-3">
                        <h2
                            id="discover-players"
                            className="text-xs font-medium tracking-[0.12em] text-[#c5bfba] uppercase"
                        >
                            {query ? 'Player search' : 'Players to discover'}
                        </h2>
                        <p
                            aria-live="polite"
                            className="text-[11px] text-[#a9a19b]"
                        >
                            {players.meta.total.toLocaleString()}{' '}
                            {players.meta.total === 1 ? 'player' : 'players'}
                        </p>
                    </div>
                    <div className="flex w-full items-center gap-1.5 sm:w-auto">
                        <Form
                            key={query}
                            action={index()}
                            method="get"
                            role="search"
                            aria-label="Find players"
                            className="min-w-0 flex-1 sm:w-64 sm:flex-none"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <Label
                                        htmlFor="player-search"
                                        className="sr-only"
                                    >
                                        Search by username or display name
                                    </Label>
                                    <div className="flex gap-1.5">
                                        <Input
                                            id="player-search"
                                            name="q"
                                            type="search"
                                            defaultValue={query}
                                            maxLength={100}
                                            placeholder="Find a player…"
                                            className="h-7 min-w-0 border-white/10 bg-rein/30 px-2 text-xs"
                                        />
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            disabled={processing}
                                            className="size-7 shrink-0 border-white/10 bg-rein/20 p-0 text-[#e0d9d3] hover:bg-rein hover:text-white"
                                            aria-label="Search players"
                                        >
                                            <Search
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                        </Button>
                                    </div>
                                    {errors.q && (
                                        <p
                                            role="alert"
                                            className="mt-1 text-xs text-red-300"
                                        >
                                            {errors.q}
                                        </p>
                                    )}
                                </>
                            )}
                        </Form>
                        {query && (
                            <Link
                                href={index()}
                                className={`${linkClass} shrink-0`}
                            >
                                Clear search
                            </Link>
                        )}
                        {auth.user && (
                            <Link
                                href={me()}
                                className={`${linkClass} shrink-0`}
                            >
                                Profile
                            </Link>
                        )}
                    </div>
                </div>
                {players.data.length ? (
                    <div
                        className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5 lg:gap-x-6"
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
                    <div className="rounded-md border border-dashed border-shadow px-4 py-8 text-center">
                        <Users
                            className="mx-auto mb-2 size-6 text-[#bdb6b1]"
                            strokeWidth={1.25}
                            aria-hidden="true"
                        />
                        <h3 className="text-sm font-medium text-[#f4f1ed]">
                            {emptyTitle}
                        </h3>
                        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#bdb6b1]">
                            {!hasDiscoverablePlayers
                                ? 'Other players will appear here when they make their profiles public.'
                                : query
                                  ? 'Try a different username or display name.'
                                  : 'Return to the first page to browse players.'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className={buttonClass}
                            >
                                <Link
                                    href={
                                        !hasDiscoverablePlayers
                                            ? auth.user
                                                ? edit()
                                                : register()
                                            : index()
                                    }
                                >
                                    {!hasDiscoverablePlayers
                                        ? auth.user
                                            ? 'Edit profile'
                                            : 'Join PlayHaven'
                                        : query
                                          ? 'Browse all players'
                                          : 'Back to the first page'}
                                </Link>
                            </Button>
                            <Link href={games()} className={linkClass}>
                                Explore games
                            </Link>
                        </div>
                    </div>
                )}
                <HistoryPagination
                    pagination={players}
                    label="Player discovery pages"
                    compact
                    dense
                />
            </section>
            <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] leading-5 text-[#a9a19b]">
                <p>Only public profiles appear here.</p>
                <Link href={community()} className={linkClass}>
                    Community reviews
                </Link>
            </footer>
        </div>
    );
}
