import { Form, Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowDown,
    ArrowUp,
    Check,
    LayoutGrid,
    List,
    Plus,
    Search,
    X,
} from 'lucide-react';
import GameCover from '@/components/game-cover';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { create, index, store } from '@/routes/lists';
import { listVisibilities } from '@/types/lists';
import type { GameList } from '@/types/lists';
import type { CatalogGame } from '@/types/catalog';

const buttonClass = 'h-7 gap-1 px-2.5 text-[11px] [&_svg]:size-3';
const fieldClass = 'h-8 border-white/15 bg-rein/30 text-xs';

export default function CreateList({
    availableGames,
    query,
}: {
    availableGames: CatalogGame[];
    query: string;
}) {
    const form = useForm({
        name: '',
        description: '',
        visibility: 'private' as GameList['visibility'],
        games: [] as CatalogGame[],
    });
    const [view, setView] = useState<'list' | 'grid'>('list');
    const selected = new Set(form.data.games.map((game) => game.id));
    function move(position: number, direction: number) {
        const games = [...form.data.games];
        [games[position], games[position + direction]] = [
            games[position + direction],
            games[position],
        ];
        form.setData('games', games);
    }
    function save() {
        form.transform((data) => ({
            ...data,
            games: data.games.map((game) => game.id),
        }));
        form.post(store().url);
    }
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title="New list">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <header className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <h1 className="text-xl font-medium tracking-tight">New list</h1>
                <Link
                    href={index()}
                    className="rounded-sm text-[11px] text-[#bdb6b1] hover:underline focus-visible:outline-2"
                >
                    Back to lists
                </Link>
            </header>
            <form
                id="new-list"
                onSubmit={(event) => {
                    event.preventDefault();
                    save();
                }}
                className="grid items-start gap-5 md:grid-cols-2"
            >
                <fieldset
                    disabled={form.processing}
                    className="min-w-0 space-y-4"
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="list-name" className="text-xs">
                            Name{' '}
                            <span className="text-[#9e9690]">(required)</span>
                        </Label>
                        <Input
                            id="list-name"
                            required
                            maxLength={150}
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            className={fieldClass}
                        />
                        <InputError message={form.errors.name} role="alert" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="list-visibility" className="text-xs">
                            Who can view
                        </Label>
                        <select
                            id="list-visibility"
                            value={form.data.visibility}
                            onChange={(event) =>
                                form.setData(
                                    'visibility',
                                    event.target
                                        .value as GameList['visibility'],
                                )
                            }
                            className="h-8 w-full rounded border border-white/15 bg-rein/30 px-2 text-xs focus-visible:outline-2 [&>option]:bg-[#211f1f]"
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
                        <InputError
                            message={form.errors.visibility}
                            role="alert"
                        />
                        <p className="text-[11px] leading-4 text-[#9e9690]">
                            {form.data.visibility === 'private'
                                ? 'Only you can open this list.'
                                : form.data.visibility === 'unlisted'
                                  ? 'Anyone with the link can open this list.'
                                  : 'Visible in community lists.'}
                        </p>
                    </div>
                    <p className="text-[11px] leading-4 text-[#9e9690]">
                        Games appear in the order you arrange below.
                    </p>
                </fieldset>
                <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="list-description" className="text-xs">
                        Description{' '}
                        <span className="text-[#9e9690]">(optional)</span>
                    </Label>
                    <textarea
                        id="list-description"
                        disabled={form.processing}
                        maxLength={5000}
                        rows={7}
                        value={form.data.description}
                        onChange={(event) =>
                            form.setData('description', event.target.value)
                        }
                        className="w-full rounded border border-white/15 bg-rein/30 px-2.5 py-2 text-xs leading-5 focus-visible:outline-2 focus-visible:outline-offset-2"
                    />
                    <InputError
                        message={form.errors.description}
                        role="alert"
                    />
                </div>
            </form>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-3">
                <Form
                    action={create()}
                    method="get"
                    options={{
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        only: ['availableGames', 'query'],
                    }}
                    role="search"
                    aria-label="Find games for your new list"
                    className="min-w-0 flex-1 basis-64"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="list-game-search"
                                    className="sr-only"
                                >
                                    Find a game by name
                                </Label>
                                <Input
                                    id="list-game-search"
                                    name="q"
                                    type="search"
                                    maxLength={100}
                                    defaultValue={query}
                                    placeholder="Find a game by name…"
                                    className={`${fieldClass} min-w-0 flex-1`}
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant="outline"
                                    className={`${buttonClass} border-white/15 bg-rein/30 text-[#e0d9d3] hover:bg-rein hover:text-white`}
                                    disabled={processing || form.processing}
                                >
                                    <Search aria-hidden="true" />
                                    {processing ? 'Searching…' : 'Find'}
                                </Button>
                            </div>
                            <InputError message={errors.q} role="alert" />
                        </>
                    )}
                </Form>
                <div className="flex items-center gap-2">
                    <div
                        role="group"
                        aria-label="List display"
                        className="flex rounded border border-white/10"
                    >
                        {(['list', 'grid'] as const).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                aria-label={`${mode === 'list' ? 'Row' : 'Grid'} view`}
                                aria-pressed={view === mode}
                                onClick={() => setView(mode)}
                                className={`flex size-7 items-center justify-center rounded-sm focus-visible:outline-2 ${view === mode ? 'bg-white/10 text-white' : 'text-[#9e9690] hover:text-white'}`}
                            >
                                {mode === 'list' ? (
                                    <List className="size-3.5" />
                                ) : (
                                    <LayoutGrid className="size-3.5" />
                                )}
                            </button>
                        ))}
                    </div>
                    <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className={`${buttonClass} text-[#bdb6b1] hover:bg-rein/40 hover:text-white`}
                    >
                        <Link href={index()}>Cancel</Link>
                    </Button>
                    <Button
                        type="submit"
                        form="new-list"
                        size="sm"
                        className={`${buttonClass} bg-[#e0d9d3] text-caviar hover:bg-white`}
                        disabled={form.processing}
                    >
                        {form.processing ? 'Saving…' : 'Save list'}
                    </Button>
                </div>
            </div>
            {query && (
                <section
                    aria-label="Game search results"
                    className="border-b border-white/10 py-3"
                >
                    <p className="mb-2 text-[11px] text-[#9e9690]">
                        Results for “{query}”
                    </p>
                    {availableGames.length ? (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {availableGames.map((game) => (
                                <button
                                    key={game.id}
                                    type="button"
                                    disabled={
                                        selected.has(game.id) ||
                                        form.processing ||
                                        form.data.games.length >= 100
                                    }
                                    onClick={() =>
                                        form.setData('games', [
                                            ...form.data.games,
                                            game,
                                        ])
                                    }
                                    className="flex min-w-0 items-center gap-2 rounded border border-white/10 bg-rein/10 p-2 text-left hover:bg-rein/30 focus-visible:outline-2 disabled:opacity-50"
                                >
                                    <GameCover
                                        game={game}
                                        compact
                                        hideFallbackTitle
                                        className="w-7 shrink-0 rounded-sm"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="line-clamp-2 text-xs leading-4">
                                            {game.name}
                                        </span>
                                        <span className="text-[10px] text-[#9e9690]">
                                            {selected.has(game.id)
                                                ? 'Added'
                                                : (game.released_on?.slice(
                                                      0,
                                                      4,
                                                  ) ?? 'Release unknown')}
                                        </span>
                                    </span>
                                    {selected.has(game.id) ? (
                                        <Check
                                            className="size-3.5 shrink-0"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Plus
                                            className="size-3.5 shrink-0"
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-[#bdb6b1]">
                            No games found in the catalog.
                        </p>
                    )}
                </section>
            )}
            <section aria-labelledby="new-list-games" className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 id="new-list-games" className="text-xs font-medium">
                        Games
                    </h2>
                    <span
                        aria-live="polite"
                        className="text-[11px] text-[#9e9690]"
                    >
                        {form.data.games.length} / 100
                    </span>
                </div>
                {Object.entries(form.errors)
                    .filter(
                        ([key]) => key === 'games' || key.startsWith('games.'),
                    )
                    .map(([key, message]) => (
                        <InputError key={key} message={message} role="alert" />
                    ))}
                {form.data.games.length ? (
                    <ol
                        className={
                            view === 'grid'
                                ? 'grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-5 md:grid-cols-6'
                                : 'divide-y divide-white/10 overflow-hidden rounded border border-white/10'
                        }
                    >
                        {form.data.games.map((game, position) => (
                            <li
                                key={game.id}
                                className={
                                    view === 'list'
                                        ? 'flex min-w-0 items-center gap-3 p-2.5'
                                        : 'min-w-0'
                                }
                            >
                                <span
                                    className={
                                        view === 'list'
                                            ? 'w-5 shrink-0 text-center text-xs text-[#9e9690]'
                                            : 'sr-only'
                                    }
                                >
                                    {position + 1}
                                </span>
                                <GameCover
                                    game={game}
                                    compact
                                    hideFallbackTitle
                                    className={
                                        view === 'list'
                                            ? 'w-8 shrink-0 rounded-sm'
                                            : 'aspect-[2/3] rounded-sm'
                                    }
                                />
                                <div
                                    className={
                                        view === 'list'
                                            ? 'min-w-0 flex-1'
                                            : 'mt-1 min-w-0'
                                    }
                                >
                                    <p className="line-clamp-2 text-xs leading-4">
                                        {view === 'grid' && `${position + 1}. `}
                                        {game.name}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-[#9e9690]">
                                        {game.released_on?.slice(0, 4)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-0.5">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-7 [&_svg]:size-3"
                                        disabled={!position || form.processing}
                                        aria-label={`Move ${game.name} earlier`}
                                        onClick={() => move(position, -1)}
                                    >
                                        <ArrowUp />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-7 [&_svg]:size-3"
                                        disabled={
                                            position ===
                                                form.data.games.length - 1 ||
                                            form.processing
                                        }
                                        aria-label={`Move ${game.name} later`}
                                        onClick={() => move(position, 1)}
                                    >
                                        <ArrowDown />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-7 [&_svg]:size-3"
                                        disabled={form.processing}
                                        aria-label={`Remove ${game.name}`}
                                        onClick={() =>
                                            form.setData(
                                                'games',
                                                form.data.games.filter(
                                                    (pick) =>
                                                        pick.id !== game.id,
                                                ),
                                            )
                                        }
                                    >
                                        <X />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <div className="rounded border border-dashed border-white/15 px-4 py-8 text-center">
                        <p className="text-sm font-medium">
                            Your list is empty
                        </p>
                        <p className="mt-1 text-xs text-[#9e9690]">
                            Find games above to add them.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
