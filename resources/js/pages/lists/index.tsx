import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { Globe, Link2, LockKeyhole, Pencil, Search } from 'lucide-react';
import GameListCoverStrip from '@/components/game-list-cover-strip';
import GameListForm from '@/components/game-list-form';
import HistoryPagination from '@/components/history-pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAutoFilters } from '@/hooks/use-auto-filters';
import { discover, index, edit, show } from '@/routes/lists';
import type { ListPagination } from '@/types/lists';

type Filters = { q: string; visibility: string; sort: string };
const selectClass =
    'h-8 min-w-0 rounded border border-white/10 bg-rein/30 px-2 text-xs text-[#c5bfba] focus-visible:outline-2 [&>option]:bg-[#211f1f]';

export default function Lists({
    lists,
    filters,
}: {
    lists: ListPagination;
    filters: Filters;
}) {
    const { url } = usePage();
    const createPanel = useRef<HTMLDetailsElement>(null);
    const { values, change, apply, processing, errors } = useAutoFilters(
        index().url,
        filters,
    );
    const filtered = Boolean(filters.q || filters.visibility);
    useEffect(() => {
        if (window.location.hash === '#create-list' && createPanel.current) {
            createPanel.current.open = true;
            createPanel.current
                .querySelector<HTMLInputElement>('#list-name')
                ?.focus();
        }
    }, [url]);
    return (
        <>
            <Head title="Lists" />
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-sm font-medium tracking-[0.12em] uppercase">
                        Lists
                    </h1>
                    <p
                        className="text-[11px] text-[#bdb6b1]"
                        aria-live="polite"
                    >
                        {lists.meta.total}{' '}
                        {lists.meta.total === 1 ? 'collection' : 'collections'}
                    </p>
                </div>
                <Link
                    href={discover()}
                    className="rounded-sm text-xs text-[#bdb6b1] hover:underline focus-visible:outline-2"
                >
                    Community lists
                </Link>
            </header>
            <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="min-w-0">
                    <form
                        role="search"
                        aria-label="Filter lists"
                        aria-busy={processing}
                        onSubmit={(event) => {
                            event.preventDefault();
                            apply();
                        }}
                        className="mb-4 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3"
                    >
                        <div className="relative min-w-0 flex-1 basis-36">
                            <Label htmlFor="lists-search" className="sr-only">
                                Find a list
                            </Label>
                            <Search
                                className="pointer-events-none absolute top-2.5 left-2.5 size-3 text-[#bdb6b1]"
                                aria-hidden="true"
                            />
                            <Input
                                id="lists-search"
                                type="search"
                                maxLength={100}
                                placeholder="Find a list…"
                                value={values.q}
                                onChange={(event) =>
                                    change({ q: event.target.value }, 350)
                                }
                                className="h-8 border-white/10 bg-rein/30 pl-8 text-xs"
                            />
                        </div>
                        <Label htmlFor="lists-visibility" className="sr-only">
                            Show lists
                        </Label>
                        <select
                            id="lists-visibility"
                            className={selectClass}
                            value={values.visibility}
                            onChange={(event) =>
                                change({ visibility: event.target.value })
                            }
                        >
                            <option value="">Show all</option>
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="unlisted">Unlisted</option>
                        </select>
                        <Label htmlFor="lists-sort" className="sr-only">
                            Sort lists
                        </Label>
                        <select
                            id="lists-sort"
                            className={selectClass}
                            value={values.sort}
                            onChange={(event) =>
                                change({ sort: event.target.value })
                            }
                        >
                            <option value="recent">Recently updated</option>
                            <option value="name">Name A–Z</option>
                            <option value="largest">Most games</option>
                        </select>
                        {filtered && (
                            <button
                                type="button"
                                onClick={() =>
                                    apply({
                                        q: '',
                                        visibility: '',
                                        sort: 'recent',
                                    })
                                }
                                className="rounded-sm text-xs text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2"
                            >
                                Clear filters
                            </button>
                        )}
                        {Object.values(errors).length > 0 && (
                            <p
                                role="alert"
                                className="w-full text-xs text-red-300"
                            >
                                {Object.values(errors).join(' ')}
                            </p>
                        )}
                    </form>
                    <section
                        aria-label="Personal lists"
                        className="divide-y divide-white/10"
                    >
                        {lists.data.map((list) => {
                            const VisibilityIcon = {
                                private: LockKeyhole,
                                public: Globe,
                                unlisted: Link2,
                            }[list.visibility];
                            return (
                                <article
                                    key={list.id}
                                    className="flex min-w-0 items-start gap-4 py-4 first:pt-0 sm:gap-5"
                                    aria-label={list.name}
                                >
                                    <Link
                                        href={show({
                                            listOwner: list.owner.id,
                                            listSlug: list.slug,
                                        })}
                                        aria-label={`Open ${list.name}`}
                                        className="group block w-28 shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 min-[420px]:w-36 sm:w-60"
                                    >
                                        <GameListCoverStrip list={list} />
                                    </Link>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="min-w-0 text-sm leading-5 font-medium wrap-break-word sm:text-base sm:leading-6">
                                                <Link
                                                    href={show({
                                                        listOwner:
                                                            list.owner.id,
                                                        listSlug: list.slug,
                                                    })}
                                                    className="rounded-sm hover:underline focus-visible:outline-2"
                                                >
                                                    {list.name}
                                                </Link>
                                            </h2>
                                            <span
                                                title={list.visibility}
                                                className="inline-flex text-[#bdb6b1]"
                                            >
                                                <VisibilityIcon
                                                    className="size-3"
                                                    role="img"
                                                    aria-label={`${list.visibility} list`}
                                                />
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#bdb6b1]">
                                            <span>
                                                {list.items_count}{' '}
                                                {list.items_count === 1
                                                    ? 'game'
                                                    : 'games'}
                                            </span>
                                            <Link
                                                href={edit(list.id)}
                                                aria-label={`Edit ${list.name}`}
                                                title="Edit list"
                                                className="rounded-sm p-1 hover:text-white focus-visible:outline-2"
                                            >
                                                <Pencil
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                            </Link>
                                        </div>
                                        {list.description && (
                                            <p className="mt-1 line-clamp-2 text-xs leading-5 wrap-break-word text-[#bdb6b1]">
                                                {list.description}
                                            </p>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                    {!lists.data.length && (
                        <p className="py-6 text-xs leading-6 text-[#bdb6b1]">
                            {filtered
                                ? 'No lists match these filters.'
                                : 'No lists yet. Create a list to add games.'}
                        </p>
                    )}
                    <HistoryPagination
                        pagination={lists}
                        label="Lists pagination"
                        compact
                    />
                </div>
                <aside
                    className="order-first min-w-0 lg:order-last"
                    aria-label="Create a list"
                >
                    <details
                        ref={createPanel}
                        id="create-list"
                        open={!filtered && lists.meta.total === 0}
                        className="scroll-mt-6 rounded-md border border-white/15 bg-rein/20"
                    >
                        <summary className="cursor-pointer list-none rounded-md px-4 py-3 text-center text-xs font-medium hover:bg-rein/40 focus-visible:outline-2">
                            New list
                        </summary>
                        <div className="border-t border-white/10 p-3">
                            <GameListForm compact returnToEdit />
                        </div>
                    </details>
                </aside>
            </div>
        </>
    );
}
