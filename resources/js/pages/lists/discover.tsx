import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ListPlus, Search } from 'lucide-react';
import GameListCard from '@/components/game-list-card';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { discover, index } from '@/routes/lists';
import type { GameList, ListPagination } from '@/types/lists';

const gridClass =
    'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3';
const headingClass =
    'text-xs font-medium tracking-[0.12em] text-[#c5bfba] uppercase';
const buttonClass =
    'h-7 gap-1.5 border-white/10 bg-rein/20 px-2.5 text-[11px] text-[#e0d9d3] hover:bg-rein hover:text-white [&_svg]:size-3';

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
    const { auth } = usePage().props;
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title="Community lists" />
            <header className="mx-auto mb-7 max-w-2xl text-center">
                <h1 className="text-lg leading-7 font-light tracking-tight text-[#d5cec7] sm:text-xl">
                    Discover game collections.
                </h1>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className={buttonClass}
                    >
                        <Link href={`${index().url}#create-list`}>
                            <ListPlus aria-hidden="true" />
                            Create a list
                        </Link>
                    </Button>
                    {auth.user && (
                        <Link
                            href={index()}
                            className="inline-flex h-7 items-center rounded px-2 text-[11px] text-[#bdb6b1] hover:bg-rein/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            Manage lists
                        </Link>
                    )}
                </div>
            </header>
            {featuredLists.length > 0 && (
                <section aria-labelledby="featured-lists" className="mb-7">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                        <h2 id="featured-lists" className={headingClass}>
                            Featured lists
                        </h2>
                        <span
                            className="text-[11px] text-[#a9a19b]"
                            title="Public collections with the most games"
                        >
                            Most games
                        </span>
                    </div>
                    <div className={gridClass}>
                        {featuredLists.map((list) => (
                            <GameListCard key={list.id} list={list} compact />
                        ))}
                    </div>
                </section>
            )}
            <section aria-labelledby="browse-lists">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                    <h2 id="browse-lists" className={headingClass}>
                        {query
                            ? 'Search results'
                            : sort === 'largest'
                              ? 'Largest collections'
                              : sort === 'name'
                                ? 'All lists'
                                : 'Recently updated'}
                    </h2>
                    <span
                        className="text-[11px] text-[#a9a19b]"
                        aria-live="polite"
                    >
                        {lists.meta.total} public{' '}
                        {lists.meta.total === 1 ? 'list' : 'lists'}
                    </span>
                </div>
                <Form
                    action={discover()}
                    method="get"
                    key={`${query}:${sort}`}
                    role="search"
                    aria-label="Find public lists"
                >
                    {({ processing, errors }) => (
                        <div className="mb-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="min-w-0 flex-1 basis-40 sm:max-w-xs">
                                    <Label
                                        htmlFor="list-search"
                                        className="sr-only"
                                    >
                                        Search public lists
                                    </Label>
                                    <Input
                                        id="list-search"
                                        name="q"
                                        type="search"
                                        defaultValue={query}
                                        maxLength={100}
                                        placeholder="Find a list…"
                                        className="h-7 border-white/10 bg-rein/30 px-2 text-xs"
                                    />
                                </div>
                                <div className="min-w-0">
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
                                        className="h-7 max-w-full rounded border border-white/10 bg-rein/30 px-2 text-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 [&>option]:bg-[#211f1f]"
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
                                    variant="outline"
                                    size="sm"
                                    className={buttonClass}
                                >
                                    <Search aria-hidden="true" />
                                    {processing ? 'Searching…' : 'Search'}
                                </Button>
                                {(query || sort !== 'recent') && (
                                    <Link
                                        href={discover()}
                                        className="inline-flex h-7 items-center rounded px-2 text-[11px] text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
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
                {lists.data.length ? (
                    <div className={gridClass}>
                        {lists.data.map((list) => (
                            <GameListCard key={list.id} list={list} compact />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed border-shadow px-4 py-6 text-center">
                        <h3 className="text-sm font-medium">
                            {query ? 'No lists found.' : 'No public lists yet.'}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#bdb6b1]">
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
                    dense
                />
            </section>
        </div>
    );
}
