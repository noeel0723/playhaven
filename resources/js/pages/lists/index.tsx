import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ListPlus } from 'lucide-react';
import GameListCard from '@/components/game-list-card';
import GameListForm from '@/components/game-list-form';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { discover } from '@/routes/lists';
import type { ListPagination } from '@/types/lists';

export default function Lists({ lists }: { lists: ListPagination }) {
    return (
        <>
            <Head title="Your lists" />
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                        A collection with a point of view
                    </p>
                    <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
                        Your games.
                        <br />
                        <span className="font-serif font-normal text-[#c5bfba] italic">
                            Curated your way.
                        </span>
                    </h1>
                    <p className="mt-5 max-w-xl text-sm leading-7 text-[#bdb6b1]">
                        Tiny indie worlds. Rainy-day favorites. Games you want
                        everyone to try. Give them a place together.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href={discover()}>
                        Community lists <ArrowRight aria-hidden="true" />
                    </Link>
                </Button>
            </div>
            <details
                className="mb-10 rounded-xl border border-shadow bg-rein/40 p-5 sm:p-7"
                open={lists.meta.total === 0}
            >
                <summary className="flex cursor-pointer items-center gap-2 rounded-sm font-serif text-2xl focus-visible:outline-2 focus-visible:outline-offset-4">
                    <ListPlus className="size-5" aria-hidden="true" />
                    Create a list
                </summary>
                <div className="mt-6 max-w-2xl">
                    <GameListForm />
                </div>
            </details>
            <p className="mb-5 text-xs text-[#bdb6b1]">
                {lists.meta.total} {lists.meta.total === 1 ? 'list' : 'lists'}{' '}
                of your own
            </p>
            {lists.data.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {lists.data.map((list) => (
                        <GameListCard key={list.id} list={list} />
                    ))}
                </div>
            ) : (
                <p className="py-8 text-sm text-[#bdb6b1]">
                    Your first collection starts above. Add games after creating
                    the list.
                </p>
            )}
            <HistoryPagination
                pagination={lists}
                label="Your lists pagination"
            />
        </>
    );
}
