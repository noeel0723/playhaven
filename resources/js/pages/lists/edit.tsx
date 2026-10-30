import { Form, Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';
import ConfirmDelete from '@/components/confirm-history-delete';
import GameListItem from '@/components/game-list-item';
import HistoryPagination from '@/components/history-pagination';
import ListAddGame from '@/components/list-add-game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { search as rawg } from '@/routes/catalog';
import { edit, show, update, destroy } from '@/routes/lists';
import { update as updateItem } from '@/routes/list-items';
import { listVisibilities } from '@/types/lists';
import type { GameList, ItemPagination, ListItem } from '@/types/lists';
import type { CatalogGame } from '@/types/catalog';

export default function EditList({
    list,
    items,
    query,
    availableGames,
}: {
    list: GameList;
    items: ItemPagination;
    query: string;
    availableGames: CatalogGame[];
}) {
    const settings = useForm({
        name: list.name,
        description: list.description ?? '',
        visibility: list.visibility,
        return_to_edit: true,
    });
    const reorder = useForm({ position: 1, notes: '', return_to_edit: true });
    const listUrl = show({ listOwner: list.owner.id, listSlug: list.slug });
    function move(item: ListItem, position: number) {
        if (reorder.processing || position < 1 || position > list.items_count)
            return;
        reorder.transform(() => ({
            position,
            notes: item.notes ?? '',
            return_to_edit: true,
        }));
        reorder.put(updateItem({ gameList: list.id, listItem: item.id }).url, {
            preserveScroll: true,
        });
    }
    return (
        <>
            <Head title={`Edit ${list.name}`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <h1 className="text-2xl font-medium tracking-tight">
                    Edit list
                </h1>
                <Link
                    href={listUrl}
                    className="inline-flex items-center gap-1 rounded-sm text-xs text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    View list
                </Link>
            </header>
            <form
                id="list-editor-settings"
                className="grid items-start gap-5 md:grid-cols-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    settings.put(update(list.id).url, { preserveScroll: true });
                }}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="list-edit-name" className="text-xs">
                            List name
                        </Label>
                        <Input
                            id="list-edit-name"
                            required
                            maxLength={150}
                            value={settings.data.name}
                            onChange={(event) =>
                                settings.setData('name', event.target.value)
                            }
                            disabled={settings.processing}
                            className="h-9 border-shadow bg-rein text-sm"
                        />
                        {settings.errors.name && (
                            <p role="alert" className="text-xs text-red-300">
                                {settings.errors.name}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="list-edit-visibility"
                            className="text-xs"
                        >
                            Who can see this list?
                        </Label>
                        <select
                            id="list-edit-visibility"
                            value={settings.data.visibility}
                            onChange={(event) =>
                                settings.setData(
                                    'visibility',
                                    event.target
                                        .value as GameList['visibility'],
                                )
                            }
                            disabled={settings.processing}
                            className="h-9 w-full rounded-md border border-shadow bg-rein px-3 text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            {listVisibilities.map((visibility) => (
                                <option
                                    key={visibility.value}
                                    value={visibility.value}
                                >
                                    {visibility.label}
                                </option>
                            ))}
                        </select>
                        {settings.errors.visibility && (
                            <p role="alert" className="text-xs text-red-300">
                                {settings.errors.visibility}
                            </p>
                        )}
                    </div>
                    <p className="text-[11px] leading-5 text-[#bdb6b1]">
                        {settings.data.visibility === 'private'
                            ? 'Only you can open this list.'
                            : settings.data.visibility === 'unlisted'
                              ? 'Anyone with the link can view the games and notes.'
                              : 'This list and its item notes appear in community discovery.'}
                    </p>
                    <p className="text-[11px] text-[#bdb6b1]">
                        {list.items_count}{' '}
                        {list.items_count === 1 ? 'game' : 'games'} · Saved
                        order determines the position numbers.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="list-edit-description" className="text-xs">
                        Description{' '}
                        <span className="text-[#bdb6b1]">(optional)</span>
                    </Label>
                    <textarea
                        id="list-edit-description"
                        rows={6}
                        maxLength={5000}
                        value={settings.data.description}
                        onChange={(event) =>
                            settings.setData('description', event.target.value)
                        }
                        disabled={settings.processing}
                        className="w-full rounded-md border border-shadow bg-rein px-3 py-2 text-xs leading-6 focus-visible:outline-2 focus-visible:outline-offset-2"
                    />
                    {settings.errors.description && (
                        <p role="alert" className="text-xs text-red-300">
                            {settings.errors.description}
                        </p>
                    )}
                </div>
            </form>
            <div className="my-5 flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-3">
                <p className="text-xs font-medium">Games in this list</p>
                <div className="flex flex-wrap items-center gap-2">
                    <ConfirmDelete
                        url={destroy(list.id).url}
                        title="Delete this list?"
                        description="This deletes the list and its item notes. Catalog games, your library, ratings, and playing history stay."
                        label="Delete list"
                    />
                    <Button asChild size="sm" variant="ghost">
                        <Link href={listUrl}>View list</Link>
                    </Button>
                    <Button
                        type="submit"
                        form="list-editor-settings"
                        size="sm"
                        disabled={settings.processing}
                    >
                        {settings.processing ? 'Saving…' : 'Save list'}
                    </Button>
                </div>
            </div>
            <section aria-labelledby="add-list-games" className="mb-5">
                <h2 id="add-list-games" className="sr-only">
                    Add games
                </h2>
                <Form
                    action={edit(list.id)}
                    method="get"
                    key={query}
                    options={{ preserveScroll: true, preserveState: true }}
                    role="search"
                    aria-label="Find games to add"
                >
                    {({ processing, errors }) => (
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Label
                                    htmlFor="add-game-search"
                                    className="sr-only"
                                >
                                    Search games in the catalog
                                </Label>
                                <Input
                                    id="add-game-search"
                                    name="q"
                                    maxLength={100}
                                    defaultValue={query}
                                    placeholder="Find a game by name…"
                                    className="h-9 min-w-0 flex-1 basis-44 border-shadow bg-rein text-xs"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-9"
                                    disabled={processing}
                                >
                                    <Search
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    {processing ? 'Searching…' : 'Search'}
                                </Button>
                                <Link
                                    href={rawg()}
                                    className="rounded-sm px-2 py-2 text-xs text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2"
                                >
                                    Find with RAWG
                                </Link>
                            </div>
                            {errors.q && (
                                <p
                                    role="alert"
                                    className="mt-2 text-xs text-red-300"
                                >
                                    {errors.q}
                                </p>
                            )}
                        </div>
                    )}
                </Form>
                {query &&
                    (availableGames.length ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {availableGames.map((game) => (
                                <ListAddGame
                                    key={game.id}
                                    game={game}
                                    listId={list.id}
                                    returnToEdit
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="mt-3 text-xs text-[#bdb6b1]">
                            No additional games found for this title.
                        </p>
                    ))}
            </section>
            {Object.values(reorder.errors).length > 0 && (
                <p role="alert" className="mb-3 text-xs text-red-300">
                    {Object.values(reorder.errors).join(' ')}
                </p>
            )}
            <section
                id="list-items"
                aria-label="Edit list games"
                className="scroll-mt-6"
            >
                {items.data.length ? (
                    <div className="overflow-hidden rounded-md border border-white/10 bg-rein/10">
                        {items.data.map((item) => (
                            <GameListItem
                                key={item.id}
                                item={item}
                                listId={list.id}
                                total={list.items_count}
                                busy={reorder.processing}
                                onMove={move}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-md border border-dashed border-shadow px-4 py-8 text-xs text-[#bdb6b1]">
                        No games on this page. Use the search above to add a
                        game.
                    </p>
                )}
                <p className="mt-3 text-[11px] leading-5 text-[#a9a19b]">
                    Use the arrows to reorder games. Add a note to edit its text
                    or set a specific position. Moves and removals save
                    immediately; Save item applies note and position edits.
                </p>
                <HistoryPagination
                    pagination={items}
                    label="Edit list games pagination"
                    compact
                    preserveState
                />
            </section>
        </>
    );
}
