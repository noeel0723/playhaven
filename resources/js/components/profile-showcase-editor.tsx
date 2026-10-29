import { Form, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Search, X } from 'lucide-react';
import GameCover from '@/components/game-cover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { edit, showcase } from '@/routes/players';
import type { CatalogGame } from '@/types/catalog';

const slotsFrom = (games: CatalogGame[]): (CatalogGame | null)[] =>
    Array.from({ length: 4 }, (_, index) => games[index] ?? null);

export default function ProfileShowcaseEditor({
    topGames,
    shareRecentCompleted,
    availableGames,
    query,
    embedded = false,
}: {
    topGames: CatalogGame[];
    shareRecentCompleted: boolean;
    availableGames: CatalogGame[];
    query: string;
    embedded?: boolean;
}) {
    const form = useForm({
        top_games: slotsFrom(topGames),
        share_recent_completed: shareRecentCompleted,
    });
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [searchText, setSearchText] = useState('');
    const [submittedText, setSubmittedText] = useState('');
    const trigger = useRef<HTMLButtonElement | null>(null);
    function move(index: number, direction: number) {
        const picks = [...form.data.top_games];
        [picks[index], picks[index + direction]] = [
            picks[index + direction],
            picks[index],
        ];
        form.setData('top_games', picks);
    }
    return (
        <section
            id="profile-shelves"
            aria-labelledby="profile-shelves-title"
            className={
                embedded
                    ? 'scroll-mt-8'
                    : 'mt-12 scroll-mt-8 border-t border-white/10 pt-9'
            }
        >
            <h2
                id="profile-shelves-title"
                className="border-b border-shadow pb-3 text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm"
            >
                Top 4 Games
            </h2>
            <div className="mt-6 grid grid-cols-4 items-start gap-2 sm:gap-4">
                {form.data.top_games.map((game, index) => (
                    <div key={index} className="min-w-0">
                        <button
                            type="button"
                            disabled={form.processing}
                            aria-haspopup="dialog"
                            aria-controls="top-four-picker"
                            aria-label={
                                game
                                    ? `Change Top 4 game ${index + 1}: ${game.name}`
                                    : `Add Top 4 game ${index + 1}`
                            }
                            className="group block w-full rounded-md text-[#c5bfba] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                            onClick={(event) => {
                                trigger.current = event.currentTarget;
                                setSearchText('');
                                setSubmittedText('');
                                setActiveSlot(index);
                            }}
                        >
                            {game ? (
                                <GameCover
                                    key={game.id}
                                    game={game}
                                    compact
                                    hideFallbackTitle
                                    className="aspect-[2/3] rounded-md group-hover:border-[#c5bfba]"
                                />
                            ) : (
                                <span className="flex aspect-[2/3] items-center justify-center rounded-md border border-dashed border-shadow bg-rein/40 transition-colors group-hover:border-[#bdb6b1] group-hover:bg-rein/70">
                                    <span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-shadow/60 sm:size-10">
                                        <Plus
                                            className="size-4 sm:size-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                </span>
                            )}
                        </button>
                        {game && (
                            <>
                                <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 wrap-break-word text-[#c5bfba]">
                                    {index + 1}. {game.name}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-7"
                                        disabled={
                                            index === 0 || form.processing
                                        }
                                        aria-label={`Move ${game.name} left`}
                                        onClick={() => move(index, -1)}
                                    >
                                        <ArrowLeft
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-7"
                                        disabled={
                                            index === 3 || form.processing
                                        }
                                        aria-label={`Move ${game.name} right`}
                                        onClick={() => move(index, 1)}
                                    >
                                        <ArrowRight
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-7"
                                        disabled={form.processing}
                                        aria-label={`Remove ${game.name}`}
                                        onClick={() =>
                                            form.setData(
                                                'top_games',
                                                form.data.top_games.map(
                                                    (pick, slot) =>
                                                        slot === index
                                                            ? null
                                                            : pick,
                                                ),
                                            )
                                        }
                                    >
                                        <X
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
            <p className="mt-5 text-xs leading-6 text-[#bdb6b1]">
                Click a card to choose or replace a game. Use the arrows to
                reorder your picks, then save your shelves.
            </p>
            <Dialog
                open={activeSlot !== null}
                onOpenChange={(open) => {
                    if (!open) setActiveSlot(null);
                }}
            >
                <DialogContent
                    id="top-four-picker"
                    className="dark max-h-[85svh] overflow-y-auto border-shadow bg-rein text-[#f4f1ed]"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        trigger.current?.focus();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="pr-6 text-base font-medium tracking-wide">
                            Pick a favorite game
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-6 text-[#bdb6b1]">
                            Choose a game from the local catalog for spot{' '}
                            {(activeSlot ?? 0) + 1}.
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        action={edit()}
                        method="get"
                        options={{
                            preserveScroll: true,
                            preserveState: true,
                            only: ['availableGames', 'query'],
                        }}
                        onBefore={() => setSubmittedText(searchText.trim())}
                    >
                        {({ processing, errors }) => (
                            <>
                                <Label
                                    htmlFor="top-game-search"
                                    className="mb-3"
                                >
                                    Name of game
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="top-game-search"
                                        name="q"
                                        type="search"
                                        value={searchText}
                                        onChange={(event) =>
                                            setSearchText(event.target.value)
                                        }
                                        maxLength={100}
                                        placeholder="Search games…"
                                        className="min-w-0 border-shadow bg-caviar/60 text-[#f4f1ed]"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing || !searchText.trim()
                                        }
                                        aria-label="Search games for Top 4"
                                        className="shrink-0"
                                    >
                                        <Search
                                            className="size-4"
                                            aria-hidden="true"
                                        />
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
                                <div aria-live="polite" className="mt-4">
                                    {processing ? (
                                        <p className="text-sm text-[#bdb6b1]">
                                            Searching…
                                        </p>
                                    ) : submittedText &&
                                      query === submittedText ? (
                                        availableGames.length ? (
                                            <ul className="max-h-72 overflow-y-auto rounded-md border border-shadow">
                                                {availableGames.map(
                                                    (result) => {
                                                        const selected =
                                                            form.data.top_games.some(
                                                                (pick, slot) =>
                                                                    slot !==
                                                                        activeSlot &&
                                                                    pick?.id ===
                                                                        result.id,
                                                            );
                                                        return (
                                                            <li key={result.id}>
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        selected
                                                                    }
                                                                    aria-label={`Choose ${result.name} for Top 4`}
                                                                    className="flex w-full items-center gap-3 border-b border-shadow p-3 text-left last:border-b-0 hover:bg-caviar/30 focus-visible:outline-2 focus-visible:outline-offset-[-2px] disabled:opacity-45"
                                                                    onClick={() => {
                                                                        if (
                                                                            activeSlot !==
                                                                            null
                                                                        )
                                                                            form.setData(
                                                                                'top_games',
                                                                                form.data.top_games.map(
                                                                                    (
                                                                                        pick,
                                                                                        slot,
                                                                                    ) =>
                                                                                        slot ===
                                                                                        activeSlot
                                                                                            ? result
                                                                                            : pick,
                                                                                ),
                                                                            );
                                                                        setActiveSlot(
                                                                            null,
                                                                        );
                                                                    }}
                                                                >
                                                                    <GameCover
                                                                        game={
                                                                            result
                                                                        }
                                                                        compact
                                                                        hideFallbackTitle
                                                                        className="h-14 w-10 shrink-0 rounded-sm"
                                                                    />
                                                                    <span className="min-w-0 flex-1 text-sm leading-6 wrap-break-word">
                                                                        {
                                                                            result.name
                                                                        }
                                                                        {selected && (
                                                                            <span className="block text-xs text-[#a9a19b]">
                                                                                Already
                                                                                selected
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </button>
                                                            </li>
                                                        );
                                                    },
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="text-sm leading-7 text-[#bdb6b1]">
                                                No matching games. Try another
                                                title or add it through Find
                                                more games in the catalog.
                                            </p>
                                        )
                                    ) : (
                                        <p className="text-xs leading-6 text-[#bdb6b1]">
                                            Search by title, then select a game.
                                            Your other unsaved profile changes
                                            will be kept.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
            <form
                className="mt-7"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({
                        top_games: data.top_games
                            .filter(
                                (game): game is CatalogGame => game !== null,
                            )
                            .map((game) => game.id),
                        share_recent_completed: data.share_recent_completed,
                    }));
                    form.put(showcase().url, {
                        preserveScroll: true,
                        onSuccess: (page) =>
                            form.setData(
                                'top_games',
                                slotsFrom(page.props.topGames as CatalogGame[]),
                            ),
                    });
                }}
            >
                <div className="rounded-xl border border-shadow bg-rein/30 p-5">
                    <Label
                        htmlFor="share-recent-completed"
                        className="flex items-start gap-3 leading-6"
                    >
                        <input
                            id="share-recent-completed"
                            type="checkbox"
                            checked={form.data.share_recent_completed}
                            onChange={(event) =>
                                form.setData(
                                    'share_recent_completed',
                                    event.target.checked,
                                )
                            }
                            className="mt-1 size-4 shrink-0 accent-[#807d7d]"
                        />
                        <span>Show my recent completed games</span>
                    </Label>
                    <p className="mt-3 text-sm leading-7 text-[#bdb6b1]">
                        Share your latest four completed library games, their
                        ratings, and completion dates on your public profile.
                        Other library statuses, favorites, diary entries, and
                        private reviews stay private.
                    </p>
                    <p className="mt-3 text-xs leading-6 text-[#bdb6b1]">
                        Completion dates are recorded when you mark a game
                        Completed. Older entries may have no recorded date.
                    </p>
                </div>
                {Object.values(form.errors).length > 0 && (
                    <p role="alert" className="mt-4 text-sm text-red-300">
                        {Object.values(form.errors).join(' ')}
                    </p>
                )}
                <Button
                    type="submit"
                    disabled={form.processing}
                    className="mt-5"
                >
                    {form.processing ? 'Saving…' : 'Save profile shelves'}
                </Button>
            </form>
        </section>
    );
}
