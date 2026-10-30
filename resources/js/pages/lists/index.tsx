import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { ArrowRight, ListPlus } from 'lucide-react';
import GameListCard from '@/components/game-list-card';
import GameListForm from '@/components/game-list-form';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { discover } from '@/routes/lists';
import type { ListPagination } from '@/types/lists';

export default function Lists({ lists }: { lists: ListPagination }) {
    const { url } = usePage();
    const createPanel = useRef<HTMLDetailsElement>(null);
    function openCreate() {
        if (createPanel.current) {
            createPanel.current.open = true;
            createPanel.current
                .querySelector<HTMLInputElement>('#list-name')
                ?.focus();
        }
    }
    useEffect(() => {
        if (window.location.hash === '#create-list') openCreate();
    }, [url]);
    return (
        <>
            <Head title="Your lists" />
            <div className="max-w-[1008px]">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">
                            Your lists
                        </h1>
                        <p className="mt-1 text-xs text-[#bdb6b1]">
                            {lists.meta.total}{' '}
                            {lists.meta.total === 1
                                ? 'collection'
                                : 'collections'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={discover()}>
                                Community lists
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </Button>
                        <Button type="button" size="sm" onClick={openCreate}>
                            <ListPlus aria-hidden="true" />
                            New list
                        </Button>
                    </div>
                </header>
                <details
                    ref={createPanel}
                    id="create-list"
                    className="mb-7 scroll-mt-6 rounded-md border border-white/10 bg-rein/15 p-4"
                    open={lists.meta.total === 0}
                >
                    <summary className="flex cursor-pointer items-center gap-2 rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4">
                        <ListPlus className="size-4" aria-hidden="true" />
                        Create a list
                    </summary>
                    <div className="mt-4 max-w-lg">
                        <GameListForm compact returnToEdit />
                    </div>
                </details>
                {lists.data.length ? (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                        {lists.data.map((list) => (
                            <GameListCard
                                key={list.id}
                                list={list}
                                showVisibility
                            />
                        ))}
                    </div>
                ) : (
                    <p className="py-5 text-xs leading-6 text-[#bdb6b1]">
                        No lists yet. Create one, then add games in its editor
                        page.
                    </p>
                )}
                <HistoryPagination
                    pagination={lists}
                    label="Your lists pagination"
                    compact
                />
            </div>
        </>
    );
}
