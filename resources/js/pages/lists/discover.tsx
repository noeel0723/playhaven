import { Form, Head, Link } from '@inertiajs/react';
import GameListCard from '@/components/game-list-card';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { discover, index } from '@/routes/lists';
import type { ListPagination } from '@/types/lists';

export default function DiscoverLists({
    lists,
    query,
}: {
    lists: ListPagination;
    query: string;
}) {
    return (
        <>
            <Head title="Community lists" />
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                        Through another player’s eyes
                    </p>
                    <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
                        Good games.
                        <br />
                        <span className="font-serif font-normal text-[#c5bfba] italic">
                            Better together.
                        </span>
                    </h1>
                    <p className="mt-5 text-sm leading-7 text-[#bdb6b1]">
                        Discover public collections curated by the PlayHaven
                        community.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href={index()}>Your lists</Link>
                </Button>
            </div>
            <Form
                action={discover()}
                method="get"
                key={query}
                options={{ preserveScroll: true }}
            >
                {({ processing, errors }) => (
                    <div className="mb-8 rounded-xl border border-shadow bg-rein/40 p-5">
                        <Label htmlFor="list-search">Search public lists</Label>
                        <div className="mt-3 flex flex-wrap gap-3">
                            <Input
                                id="list-search"
                                name="q"
                                defaultValue={query}
                                maxLength={100}
                                placeholder="A theme, a genre, a feeling…"
                                className="h-11 min-w-40 flex-1 border-shadow bg-rein"
                            />
                            <Button disabled={processing} className="h-11">
                                {processing ? 'Searching…' : 'Search'}
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
                    </div>
                )}
            </Form>
            <p className="mb-5 text-xs text-[#bdb6b1]">
                {lists.meta.total} public{' '}
                {lists.meta.total === 1 ? 'list' : 'lists'}
            </p>
            {lists.data.length ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {lists.data.map((list) => (
                        <GameListCard key={list.id} list={list} />
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-shadow px-6 py-12 text-center">
                    <h2 className="font-serif text-2xl">
                        {query
                            ? 'No collections found.'
                            : 'A new perspective is on its way.'}
                    </h2>
                    <p className="mt-4 text-sm text-[#bdb6b1]">
                        {query
                            ? 'Try another title or theme.'
                            : 'Create a public list to share a corner of your gaming world.'}
                    </p>
                </div>
            )}
            <HistoryPagination
                pagination={lists}
                label="Community lists pagination"
            />
        </>
    );
}
