import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Search, Users } from 'lucide-react';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as community } from '@/routes/community';
import { index, show, edit } from '@/routes/players';
import type { PlayerPagination } from '@/types/community';

export default function Players({
    players,
    query,
}: {
    players: PlayerPagination;
    query: string;
}) {
    const { auth } = usePage().props;
    return (
        <>
            <Head title="Find players" />
            <Link
                href={community()}
                className="mb-8 inline-block text-sm text-[#bdb6b1] underline underline-offset-4"
            >
                Back to community
            </Link>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
                <div>
                    <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
                        Find your people.
                    </h1>
                    <p className="mt-4 text-sm leading-7 text-[#bdb6b1]">
                        Explore public player profiles, discover their stories,
                        and start following.
                    </p>
                </div>
                {auth.user && (
                    <Button asChild>
                        <Link href={edit()}>Your player profile</Link>
                    </Button>
                )}
            </div>
            <Form key={query} action={index()} method="get" className="mb-9">
                {({ processing, errors }) => (
                    <>
                        <Label htmlFor="player-search" className="mb-3">
                            Search by username or display name
                        </Label>
                        <div className="flex gap-3">
                            <Input
                                id="player-search"
                                name="q"
                                defaultValue={query}
                                maxLength={100}
                                placeholder="Find a player…"
                                className="max-w-xl border-shadow bg-rein"
                            />
                            <Button type="submit" disabled={processing}>
                                <Search aria-hidden="true" />
                                <span className="sr-only">Search players</span>
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
            <div className="mb-6 flex justify-between gap-4 border-b border-white/10 pb-5 text-xs text-[#bdb6b1]">
                <p>
                    {players.meta.total} public{' '}
                    {players.meta.total === 1 ? 'player' : 'players'}
                </p>
                {query && (
                    <Link
                        href={index()}
                        className="underline underline-offset-4"
                    >
                        Clear search
                    </Link>
                )}
            </div>
            {players.data.length ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {players.data.map((player) => (
                        <article
                            key={player.username}
                            className="min-w-0 rounded-xl border border-shadow bg-rein/20 p-6"
                        >
                            <Link
                                href={show(player.username)}
                                className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2"
                            >
                                <h2 className="font-serif text-2xl wrap-break-word">
                                    {player.name}
                                </h2>
                                <p className="mt-2 text-xs text-[#bdb6b1]">
                                    @{player.username}
                                </p>
                            </Link>
                            {player.bio && (
                                <p className="mt-4 line-clamp-3 text-sm leading-7 wrap-break-word text-[#c5bfba]">
                                    {player.bio}
                                </p>
                            )}
                            <p className="mt-5 text-xs text-[#bdb6b1]">
                                {player.followers_count}{' '}
                                {player.followers_count === 1
                                    ? 'follower'
                                    : 'followers'}
                                {player.is_following && (
                                    <span className="ml-3 text-[#e0d9d3]">
                                        · Following
                                    </span>
                                )}
                                {player.is_self && (
                                    <span className="ml-3">· You</span>
                                )}
                            </p>
                        </article>
                    ))}
                </div>
            ) : (
                <section className="rounded-xl border border-dashed border-shadow px-6 py-14 text-center">
                    <Users
                        className="mx-auto mb-5 size-8 text-mustang"
                        aria-hidden="true"
                    />
                    <h2 className="font-serif text-3xl">
                        {query
                            ? 'No players found.'
                            : 'Be part of the first chapter.'}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-[#bdb6b1]">
                        {query
                            ? 'Try another username or display name.'
                            : 'Activate your public player profile to join the community.'}
                    </p>
                </section>
            )}
            <HistoryPagination
                pagination={players}
                label="Player discovery pages"
            />
        </>
    );
}
