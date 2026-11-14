import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';
import HistoryPagination from '@/components/history-pagination';
import PlayerDirectorySidebar from '@/components/player-directory-sidebar';
import PlayerRankingTable from '@/components/player-ranking-table';
import { index, popular } from '@/routes/players';
import type { NetworkPlayer } from '@/types/community';
import type { HistoryPagination as Paginated } from '@/types/history';

export default function PopularPlayers({
    players,
    reviewers,
    query,
}: {
    players: Paginated<NetworkPlayer>;
    reviewers: NetworkPlayer[];
    query: string;
}) {
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title="Popular players" />
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-base font-medium text-[#f4f1ed]">
                        Players
                    </h1>
                    <p className="mt-1 text-[11px] text-[#a9a19b]">
                        {players.meta.total.toLocaleString()} public{' '}
                        {players.meta.total === 1 ? 'player' : 'players'} · Most
                        followers
                    </p>
                </div>
                <Link
                    href={index()}
                    className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] text-[#bdb6b1] hover:bg-rein/30 hover:text-white focus-visible:outline-2"
                >
                    <ArrowLeft className="size-3" aria-hidden="true" />
                    Discover players
                </Link>
            </header>
            <div className="grid min-w-0 gap-7 md:grid-cols-[minmax(0,1fr)_12rem] md:gap-8">
                <section aria-labelledby="all-players" className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <h2
                            id="all-players"
                            className="text-xs font-medium tracking-[0.1em] text-[#c5bfba] uppercase"
                        >
                            {query ? 'Player search' : 'Popular players'}
                        </h2>
                        <Form
                            key={query}
                            action={popular()}
                            method="get"
                            role="search"
                            aria-label="Search all players"
                            className="flex items-center gap-1.5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <input
                                        name="q"
                                        type="search"
                                        aria-label="Find a player"
                                        defaultValue={query}
                                        maxLength={100}
                                        placeholder="Find a player…"
                                        className="h-7 w-36 rounded border border-white/10 bg-rein/20 px-2 text-[11px] text-[#e0d9d3] focus-visible:outline-2 sm:w-40"
                                    />
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        aria-label="Search players"
                                        className="inline-flex size-7 items-center justify-center rounded border border-white/10 bg-rein/20 text-[#d5cec7] hover:bg-rein disabled:opacity-50"
                                    >
                                        <Search
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </button>
                                    {errors.q && (
                                        <span
                                            role="alert"
                                            className="text-[11px] text-red-300"
                                        >
                                            {errors.q}
                                        </span>
                                    )}
                                </>
                            )}
                        </Form>
                    </div>
                    {query && (
                        <Link
                            href={popular()}
                            className="mb-3 inline-flex text-[11px] text-[#bdb6b1] underline underline-offset-4"
                        >
                            Clear search
                        </Link>
                    )}
                    <PlayerRankingTable players={players.data} />
                    <HistoryPagination
                        pagination={players}
                        label="All player pages"
                        compact
                        dense
                    />
                    <p className="mt-3 text-[10px] leading-5 text-[#a9a19b]">
                        Only public profiles, reviews, and lists are shown.
                    </p>
                </section>
                <PlayerDirectorySidebar reviewers={reviewers} />
            </div>
        </div>
    );
}
