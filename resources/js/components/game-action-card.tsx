import { Link, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import {
    BookOpen,
    Check,
    Heart,
    Library,
    ListPlus,
    MessageSquareText,
    Trash2,
} from 'lucide-react';
import RatingEditor from '@/components/rating-editor';
import ReviewEditor from '@/components/review-editor';
import GameDiaryForm from '@/components/game-diary-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { save, destroy } from '@/routes/library';
import { index as lists } from '@/routes/lists';
import { store as addToList } from '@/routes/list-items';
import { update as rate } from '@/routes/ratings';
import { libraryStatuses } from '@/types/library';
import type { LibraryState, LibraryStatus } from '@/types/library';
import type { PersonalReview } from '@/types/reviews';
import type { CatalogGame } from '@/types/catalog';

export type GameActionList = {
    id: number;
    name: string;
    visibility: string;
    contains_game: boolean;
};
type Props = {
    game: CatalogGame;
    entry: LibraryState | null;
    rating: number | null;
    review: PersonalReview | null;
    availableLists: GameActionList[];
};

export default function GameActionCard({
    game,
    entry,
    rating,
    review,
    availableLists,
}: Props) {
    const { id: gameId, slug: gameSlug, name: gameName } = game;
    const { auth } = usePage().props;
    const [panel, setPanel] = useState<
        'review' | 'list' | 'library' | 'diary' | null
    >(null);
    const [diaryBusy, setDiaryBusy] = useState(false);
    const [selectedList, setSelectedList] = useState('');
    const actionTrigger = useRef<HTMLButtonElement | null>(null);
    const libraryForm = useForm<LibraryState>({
        status: entry?.status ?? null,
        is_favorite: entry?.is_favorite ?? false,
    });
    const listForm = useForm({ game_id: gameId, return_to_game: true });
    const removal = useForm({ confirm: false });
    const ratingForm = useForm<{ stars: number | null }>({ stars: rating });
    const busy = libraryForm.processing || ratingForm.processing;
    const activeList = availableLists.find(
        (list) => String(list.id) === selectedList,
    );
    function updateLibrary(
        status: LibraryStatus | null,
        favorite: boolean,
        onSuccess?: () => void,
    ) {
        libraryForm.clearErrors();
        libraryForm.transform(() => ({ status, is_favorite: favorite }));
        libraryForm.put(save(gameSlug).url, {
            preserveScroll: true,
            onSuccess,
        });
    }
    function openReview() {
        if (entry) setPanel('review');
        else updateLibrary(null, false, () => setPanel('review'));
    }
    function saveRating(stars: number | null) {
        if (busy || stars === rating) return;
        ratingForm.clearErrors();
        ratingForm.transform(() => ({ stars }));
        const submit = () =>
            ratingForm.put(rate(gameSlug).url, { preserveScroll: true });
        if (entry) submit();
        else updateLibrary(null, false, submit);
    }
    const rowClass =
        'flex min-h-12 w-full items-center justify-center gap-2 border-t border-white/10 px-4 py-3 text-center text-sm text-[#d5cec7] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] disabled:opacity-50';
    return (
        <section
            aria-labelledby="game-actions-title"
            className="overflow-hidden rounded-lg border border-shadow bg-rein/55"
            onClickCapture={(event) => {
                const button = (event.target as HTMLElement).closest('button');
                if (button && event.currentTarget.contains(button)) {
                    actionTrigger.current = button;
                }
            }}
        >
            <h2 id="game-actions-title" className="sr-only">
                Your game actions
            </h2>
            {auth.user ? (
                <>
                    <div className="grid grid-cols-3 divide-x divide-white/10 px-2 py-4">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                                entry
                                    ? setPanel('library')
                                    : updateLibrary(null, false)
                            }
                            className="flex min-h-16 flex-col items-center justify-center gap-2 rounded-sm px-1 text-[10px] text-[#d5cec7] hover:text-white focus-visible:outline-2"
                        >
                            {entry ? (
                                <Check className="size-6" aria-hidden="true" />
                            ) : (
                                <Library
                                    className="size-6"
                                    aria-hidden="true"
                                />
                            )}
                            {entry ? 'In library' : 'Add to library'}
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            aria-pressed={entry?.is_favorite ?? false}
                            aria-label={
                                entry?.is_favorite
                                    ? 'Remove favorite'
                                    : 'Mark as favorite'
                            }
                            onClick={() =>
                                updateLibrary(
                                    entry?.status ?? null,
                                    !entry?.is_favorite,
                                )
                            }
                            className="flex min-h-16 flex-col items-center justify-center gap-2 rounded-sm px-1 text-[10px] text-[#d5cec7] hover:text-white focus-visible:outline-2"
                        >
                            <Heart
                                className={`size-6 ${entry?.is_favorite ? 'fill-current' : ''}`}
                                aria-hidden="true"
                            />
                            Favorite
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => setPanel('diary')}
                            className="flex min-h-16 flex-col items-center justify-center gap-2 rounded-sm px-1 text-[10px] text-[#d5cec7] hover:text-white focus-visible:outline-2"
                        >
                            <BookOpen className="size-6" aria-hidden="true" />
                            Diary
                        </button>
                    </div>
                    <div className="border-t border-white/10 p-4">
                        <Label
                            htmlFor="action-playing-status"
                            className="mb-2 text-xs text-[#bdb6b1]"
                        >
                            Playing status
                        </Label>
                        <select
                            id="action-playing-status"
                            value={entry?.status ?? ''}
                            disabled={busy}
                            onChange={(event) =>
                                updateLibrary(
                                    event.target.value as LibraryStatus,
                                    entry?.is_favorite ?? false,
                                )
                            }
                            className="h-10 w-full rounded-md border border-shadow bg-caviar/40 px-3 text-sm text-[#f4f1ed] focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <option value="" disabled>
                                Set a playing status
                            </option>
                            {libraryStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <RatingEditor
                        rating={rating}
                        onChange={saveRating}
                        disabled={busy}
                    />
                    {ratingForm.errors.stars && (
                        <p
                            role="alert"
                            className="px-4 pb-3 text-xs text-red-300"
                        >
                            {ratingForm.errors.stars}
                        </p>
                    )}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={openReview}
                        className={rowClass}
                    >
                        <MessageSquareText
                            className="size-4"
                            aria-hidden="true"
                        />
                        {review ? 'Edit your review' : 'Write a review'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setPanel('list')}
                        className={rowClass}
                    >
                        <ListPlus className="size-4" aria-hidden="true" />
                        Add to a list
                    </button>
                    {!entry && (
                        <p className="border-t border-white/10 px-4 py-3 text-center text-[10px] leading-5 text-[#a9a19b]">
                            Rating, reviewing, or favoriting also adds this game
                            to your library. A playing status is optional.
                        </p>
                    )}
                    {Object.values(libraryForm.errors).length > 0 && (
                        <p
                            role="alert"
                            className="px-4 pb-4 text-xs leading-6 text-red-300"
                        >
                            {Object.values(libraryForm.errors).join(' ')}
                        </p>
                    )}
                </>
            ) : (
                <div className="p-6 text-center">
                    <Library
                        className="mx-auto mb-4 size-8 text-[#bdb6b1]"
                        aria-hidden="true"
                    />
                    <p className="text-sm leading-7 text-[#c5bfba]">
                        Keep this game in your library, rate it, and tell your
                        story.
                    </p>
                    <Button asChild className="mt-5 w-full">
                        <Link href={login()}>Log in to track this game</Link>
                    </Button>
                </div>
            )}
            <Dialog
                open={panel !== null}
                onOpenChange={(open) => {
                    if (!open && !diaryBusy) {
                        setPanel(null);
                        removal.reset();
                        removal.clearErrors();
                    }
                }}
            >
                <DialogContent
                    className={`dark max-h-[85svh] overflow-y-auto border-shadow bg-caviar text-[#f4f1ed] sm:max-w-xl ${panel === 'diary' ? 'gap-4 p-4 font-sans sm:max-w-xl sm:p-5' : ''}`}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        actionTrigger.current?.focus();
                    }}
                >
                    <DialogHeader
                        className={
                            panel === 'diary' ? 'gap-1 text-left' : undefined
                        }
                    >
                        <DialogTitle
                            className={`pr-6 ${panel === 'diary' ? 'text-sm font-medium' : ''}`}
                        >
                            {panel === 'diary'
                                ? 'Log a playing session'
                                : panel === 'review'
                                  ? 'Your game review'
                                  : panel === 'list'
                                    ? 'Add to a list'
                                    : 'Manage library'}
                        </DialogTitle>
                        <DialogDescription
                            className={`text-[#bdb6b1] ${panel === 'diary' ? 'text-[11px]' : ''}`}
                        >
                            {panel === 'diary'
                                ? 'Add to your private game diary.'
                                : gameName}
                        </DialogDescription>
                    </DialogHeader>
                    {panel === 'diary' && (
                        <GameDiaryForm
                            game={game}
                            onSaved={() => setPanel(null)}
                            onCancel={() => setPanel(null)}
                            onProcessing={setDiaryBusy}
                        />
                    )}
                    {panel === 'review' && entry && (
                        <ReviewEditor
                            key={`${review?.id}:${review?.updated_at}`}
                            gameSlug={gameSlug}
                            review={review}
                            onSaved={() => setPanel(null)}
                        />
                    )}
                    {panel === 'list' &&
                        (availableLists.length ? (
                            <form
                                className="space-y-5"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (activeList)
                                        listForm.post(
                                            addToList(activeList.id).url,
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => setPanel(null),
                                            },
                                        );
                                }}
                            >
                                <div>
                                    <Label
                                        htmlFor="game-action-list"
                                        className="mb-2"
                                    >
                                        Choose one of your lists
                                    </Label>
                                    <select
                                        id="game-action-list"
                                        value={selectedList}
                                        onChange={(event) =>
                                            setSelectedList(event.target.value)
                                        }
                                        required
                                        className="h-11 w-full rounded-md border border-shadow bg-rein px-3 text-sm"
                                    >
                                        <option value="" disabled>
                                            Select a list
                                        </option>
                                        {availableLists.map((list) => (
                                            <option
                                                key={list.id}
                                                value={list.id}
                                            >
                                                {list.name}
                                                {list.contains_game
                                                    ? ' · Already added'
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {activeList && (
                                    <p className="text-xs text-[#bdb6b1]">
                                        Visibility: {activeList.visibility}
                                        {activeList.contains_game
                                            ? ' · This game is already in this list.'
                                            : ''}
                                    </p>
                                )}
                                {Object.values(listForm.errors).length > 0 && (
                                    <p
                                        role="alert"
                                        className="text-sm text-red-300"
                                    >
                                        {Object.values(listForm.errors).join(
                                            ' ',
                                        )}
                                    </p>
                                )}
                                <Button
                                    type="submit"
                                    disabled={
                                        !activeList ||
                                        activeList.contains_game ||
                                        listForm.processing
                                    }
                                >
                                    {listForm.processing
                                        ? 'Adding…'
                                        : 'Add game to list'}
                                </Button>
                            </form>
                        ) : (
                            <div>
                                <p className="text-sm leading-7 text-[#bdb6b1]">
                                    Create a list to collect this game alongside
                                    your other picks.
                                </p>
                                <Button asChild className="mt-5">
                                    <Link href={lists()}>Create a list</Link>
                                </Button>
                            </div>
                        ))}
                    {panel === 'library' && (
                        <form
                            className="space-y-5"
                            onSubmit={(event) => {
                                event.preventDefault();
                                removal.delete(destroy(gameSlug).url, {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setPanel(null);
                                        removal.reset();
                                    },
                                });
                            }}
                        >
                            <p className="text-sm leading-7 text-[#bdb6b1]">
                                This game is in your library. Removing it also
                                removes its rating, review, playthroughs, and
                                diary sessions.
                            </p>
                            <Label className="flex items-start gap-3 text-sm leading-6">
                                <input
                                    type="checkbox"
                                    checked={removal.data.confirm}
                                    onChange={(event) =>
                                        removal.setData(
                                            'confirm',
                                            event.target.checked,
                                        )
                                    }
                                    className="mt-1 size-4 shrink-0"
                                />
                                I want to remove this game and its personal
                                history.
                            </Label>
                            {removal.errors.confirm && (
                                <p
                                    role="alert"
                                    className="text-sm text-red-300"
                                >
                                    {removal.errors.confirm}
                                </p>
                            )}
                            <Button
                                type="submit"
                                disabled={
                                    !removal.data.confirm || removal.processing
                                }
                                variant="destructive"
                            >
                                <Trash2 className="size-4" aria-hidden="true" />
                                Remove from library
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
