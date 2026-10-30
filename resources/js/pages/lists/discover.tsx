import { Form, Head, Link } from '@inertiajs/react';
import { ListPlus, Search } from 'lucide-react';
import GameListCard from '@/components/game-list-card';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { discover, index } from '@/routes/lists';
import type { GameList, ListPagination } from '@/types/lists';

export default function DiscoverLists({
    lists,
    query,
    sort,
    featuredLists,
}: {
    lists: ListPagination;
    query: string;
    sort: 'recent' | 'largest' | 'name';
    featuredLists: GameList[];
}) {
    const gridClass =
        'grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3';
    return (
        <>
            <Head title="Community lists" />
            <div className="max-w-[1008px]">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">
                            Lists
                        </h1>
                        <p className="mt-1 text-xs leading-5 text-[#bdb6b1]">
                            Game collections from the community.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="ghost">
                            <Link href={index()}>Your lists</Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href={`${index().url}#create-list`}>
                                <ListPlus aria-hidden="true" />
                                Create a list
                            </Link>
                        </Button>
                    </div>
                </header>
                <Form
                    action={discover()}
                    method="get"
                    key={`${query}:${sort}`}
                    role="search"
                    aria-label="Find public lists"
                >
                    {({ processing, errors }) => (
                        <div className="mb-7">
                            <div className="flex flex-wrap items-end gap-2">
                                <div className="min-w-0 flex-1 basis-44">
                                    <Label
                                        htmlFor="list-search"
                                        className="sr-only"
                                    >
                                        Search public lists
                                    </Label>
                                    <Input
                                        id="list-search"
                                        name="q"
                                        defaultValue={query}
                                        maxLength={100}
                                        placeholder="Find a list…"
                                        className="h-9 border-shadow bg-rein/30 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label
                                        htmlFor="list-sort"
                                        className="sr-only"
                                    >
                                        Sort lists
                                    </Label>
                                    <select
                                        id="list-sort"
                                        name="sort"
                                        defaultValue={sort}
                                        className="h-9 max-w-full rounded-md border border-shadow bg-rein px-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
                                    >
                                        <option value="recent">
                                            Recently updated
                                        </option>
                                        <option value="largest">
                                            Most games
                                        </option>
                                        <option value="name">Name A–Z</option>
                                    </select>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    size="sm"
                                    className="h-9"
                                >
                                    <Search
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    {processing ? 'Searching…' : 'Apply'}
                                </Button>
                                {(query || sort !== 'recent') && (
                                    <Link
                                        href={discover()}
                                        className="px-2 py-2 text-xs text-[#bdb6b1] underline underline-offset-4"
                                    >
                                        Reset
                                    </Link>
                                )}
                            </div>
                            {Object.values(errors).length > 0 && (
                                <p
                                    role="alert"
                                    className="mt-2 text-xs text-red-300"
                                >
                                    {Object.values(errors).join(' ')}
                                </p>
                            )}
                        </div>
                    )}
                </Form>
                {featuredLists.length > 0 && (
                    <section aria-labelledby="featured-lists" className="mb-9">
                        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                            <h2
                                id="featured-lists"
                                className="text-xs font-medium tracking-[0.12em] text-[#c5bfba] uppercase"
                            >
                                Featured lists
                            </h2>
                            <span className="text-[11px] text-[#a9a19b]">
                                Public collections with the most games
                            </span>
                        </div>
                        <div className={gridClass}>
                            {featuredLists.map((list) => (
                                <GameListCard key={list.id} list={list} />
                            ))}
                        </div>
                    </section>
                )}
                <section aria-labelledby="browse-lists">
                    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                        <h2
                            id="browse-lists"
                            className="text-xs font-medium tracking-[0.12em] text-[#c5bfba] uppercase"
                        >
                            {query
                                ? 'Search results'
                                : sort === 'largest'
                                  ? 'Largest collections'
                                  : sort === 'name'
                                    ? 'All lists'
                                    : 'Recently updated'}
                        </h2>
                        <span className="text-[11px] text-[#a9a19b]">
                            {lists.meta.total} public{' '}
                            {lists.meta.total === 1 ? 'list' : 'lists'}
                        </span>
                    </div>
                    {lists.data.length ? (
                        <div className={gridClass}>
                            {lists.data.map((list) => (
                                <GameListCard key={list.id} list={list} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border border-dashed border-shadow px-4 py-8">
                            <h3 className="text-sm font-medium">
                                {query
                                    ? 'No lists found.'
                                    : 'No public lists yet.'}
                            </h3>
                            <p className="mt-2 text-xs leading-6 text-[#bdb6b1]">
                                {query
                                    ? 'Try another list name.'
                                    : 'Create a list and choose Public to share it here.'}
                            </p>
                        </div>
                    )}
                    <HistoryPagination
                        pagination={lists}
                        label="Community lists pagination"
                        compact
                    />
                </section>
            </div>
        </>
    );
}
