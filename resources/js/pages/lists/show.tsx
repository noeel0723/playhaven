import { Form, Head, Link } from '@inertiajs/react';
import ConfirmDelete from '@/components/confirm-history-delete';
import GameListForm from '@/components/game-list-form';
import GameListItem from '@/components/game-list-item';
import HistoryPagination from '@/components/history-pagination';
import ListAddGame from '@/components/list-add-game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { search as rawg } from '@/routes/catalog';
import { destroy, discover, index, show } from '@/routes/lists';
import type { CatalogGame } from '@/types/catalog';
import type { GameList, ItemPagination } from '@/types/lists';

export default function ListDetails({
    list,
    items,
    isOwner,
    query,
    availableGames,
    shareUrl,
}: {
    list: GameList;
    items: ItemPagination;
    isOwner: boolean;
    query: string;
    availableGames: CatalogGame[];
    shareUrl: string;
}) {
    return (
        <>
            <Head title={list.name}>
                {list.visibility !== 'public' && (
                    <meta name="robots" content="noindex, nofollow" />
                )}
            </Head>
            <Link
                href={isOwner ? index() : discover()}
                className="mb-8 inline-block rounded-sm text-sm text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2"
            >
                {isOwner ? 'Your lists' : 'Community lists'}
            </Link>
            <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                {list.visibility} collection · {list.items_count} games
            </p>
            <h1 className="max-w-4xl font-serif text-4xl leading-tight break-words sm:text-6xl">
                {list.name}
            </h1>
            <p className="mt-4 text-sm text-[#bdb6b1]">
                Curated by {list.owner.name}
            </p>
            {list.description && (
                <p className="mt-6 max-w-3xl text-sm leading-7 break-words whitespace-pre-wrap text-[#c5bfba]">
                    {list.description}
                </p>
            )}
            {isOwner && (
                <>
                    <details className="mt-9 rounded-xl border border-shadow bg-rein/30 p-5 sm:p-7">
                        <summary className="cursor-pointer rounded-sm font-serif text-2xl focus-visible:outline-2">
                            List details & sharing
                        </summary>
                        <div className="mt-6 max-w-2xl">
                            <GameListForm
                                key={`${list.name}:${list.description}:${list.visibility}`}
                                list={list}
                            />
                            <div className="mt-7 border-t border-white/10 pt-6">
                                <Label htmlFor="share-list-link">
                                    List link
                                </Label>
                                <Input
                                    id="share-list-link"
                                    readOnly
                                    value={shareUrl}
                                    onFocus={(event) => event.target.select()}
                                    className="mt-3 h-11 border-shadow bg-rein"
                                />
                                <p className="mt-2 text-xs leading-6 text-[#bdb6b1]">
                                    {list.visibility === 'private'
                                        ? 'Only you can open this link while the list is private.'
                                        : 'Select the link to copy it and share this collection.'}
                                </p>
                                <div className="mt-4">
                                    <ConfirmDelete
                                        url={destroy(list.id).url}
                                        title="Delete this list?"
                                        description="The list and all of its item notes will be permanently deleted. Catalog games, your library, ratings, and playing history will stay."
                                        label="Delete list"
                                    />
                                </div>
                            </div>
                        </div>
                    </details>
                    <section
                        aria-labelledby="add-list-games"
                        className="my-9 rounded-xl border border-shadow bg-rein/30 p-5 sm:p-7"
                    >
                        <h2 id="add-list-games" className="font-serif text-2xl">
                            Find a place for another game
                        </h2>
                        <Form
                            action={show({
                                listOwner: list.owner.id,
                                listSlug: list.slug,
                            })}
                            method="get"
                            key={query}
                            options={{ preserveScroll: true }}
                        >
                            {({ processing, errors }) => (
                                <div className="mt-5">
                                    <Label htmlFor="add-game-search">
                                        Search games in the catalog
                                    </Label>
                                    <div className="mt-3 flex flex-wrap gap-3">
                                        <Input
                                            id="add-game-search"
                                            name="q"
                                            maxLength={100}
                                            defaultValue={query}
                                            placeholder="Search a game title…"
                                            className="h-11 min-w-40 flex-1 border-shadow bg-rein"
                                        />
                                        <Button
                                            className="h-11"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Searching…'
                                                : 'Search'}
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
                        {availableGames.length ? (
                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {availableGames.map((game) => (
                                    <ListAddGame
                                        key={game.id}
                                        game={game}
                                        listId={list.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            query && (
                                <p className="mt-4 text-sm text-[#bdb6b1]">
                                    No additional games found for this title.
                                </p>
                            )
                        )}
                        <p className="mt-5 text-xs text-[#bdb6b1]">
                            Missing a game?{' '}
                            <Link
                                href={rawg()}
                                className="rounded-sm underline underline-offset-4 focus-visible:outline-2"
                            >
                                Find it with RAWG
                            </Link>
                            , then return to this list.
                        </p>
                    </section>
                </>
            )}
            <section aria-label="Games in this list" className="mt-10">
                {items.data.length ? (
                    <div className="space-y-5">
                        {items.data.map((item) => (
                            <GameListItem
                                key={`${item.id}:${item.position}:${item.notes}`}
                                item={item}
                                listId={list.id}
                                total={list.items_count}
                                isOwner={isOwner}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-shadow px-6 py-12 text-center">
                        <h2 className="font-serif text-2xl">
                            A collection waiting to take shape.
                        </h2>
                        <p className="mt-4 text-sm text-[#bdb6b1]">
                            {isOwner
                                ? 'Search for a game above and add it to your list.'
                                : 'There are no games on this page yet.'}
                        </p>
                    </div>
                )}
                <HistoryPagination
                    pagination={items}
                    label="List games pagination"
                />
            </section>
        </>
    );
}
