import { Link, useForm, usePage } from '@inertiajs/react';
import { BookmarkPlus, Heart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { destroy, index, save } from '@/routes/library';
import { libraryStatuses } from '@/types/library';
import type { LibraryState } from '@/types/library';

export default function LibraryEditor({
    gameSlug,
    gameName,
    entry,
}: {
    gameSlug: string;
    gameName: string;
    entry: LibraryState | null;
}) {
    const { auth } = usePage().props;
    const form = useForm<LibraryState>({
        status: entry?.status ?? 'backlog',
        is_favorite: entry?.is_favorite ?? false,
    });
    const removal = useForm({ confirm: true });
    const [open, setOpen] = useState(false);
    const busy = form.processing || removal.processing;

    return (
        <section
            aria-labelledby="your-library"
            className="mb-9 rounded-xl border border-shadow bg-rein/40 p-5 sm:p-6"
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="your-library" className="font-serif text-2xl">
                    Your experience
                </h2>
                {auth.user && (
                    <Link
                        href={index()}
                        className="rounded-sm text-xs underline underline-offset-4 focus-visible:outline-2"
                    >
                        View your library
                    </Link>
                )}
            </div>
            {!auth.user ? (
                <p className="text-sm leading-6 text-[#c5bfba]">
                    <Link
                        href={login()}
                        className="font-medium text-white underline underline-offset-4"
                    >
                        Log in
                    </Link>{' '}
                    to save this game and keep track of your journey.
                </p>
            ) : (
                <>
                    <p className="mb-5 text-sm text-[#bdb6b1]">
                        {entry
                            ? 'Keep your shelf up to date, one adventure at a time.'
                            : 'Add this game to your library to rate it and write your story.'}
                    </p>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(save(gameSlug).url, {
                                preserveScroll: true,
                            });
                        }}
                        className="space-y-4"
                    >
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="min-w-44 flex-1 space-y-2">
                                <Label htmlFor="library-status">
                                    Playing status
                                </Label>
                                <select
                                    id="library-status"
                                    name="status"
                                    value={form.data.status}
                                    onChange={(event) =>
                                        form.setData(
                                            'status',
                                            event.target
                                                .value as LibraryState['status'],
                                        )
                                    }
                                    disabled={busy}
                                    className="h-11 w-full rounded-md border border-shadow bg-rein px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    {libraryStatuses.map((status) => (
                                        <option
                                            key={status.value}
                                            value={status.value}
                                        >
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={form.errors.status}
                                    role="alert"
                                />
                            </div>
                            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-shadow px-3 text-sm">
                                <input
                                    type="checkbox"
                                    name="is_favorite"
                                    checked={form.data.is_favorite}
                                    onChange={(event) =>
                                        form.setData(
                                            'is_favorite',
                                            event.target.checked,
                                        )
                                    }
                                    disabled={busy}
                                    className="size-4 accent-[#c5bfba]"
                                />
                                <Heart
                                    className="size-4"
                                    fill={
                                        form.data.is_favorite
                                            ? 'currentColor'
                                            : 'none'
                                    }
                                    aria-hidden="true"
                                />{' '}
                                Favorite
                            </label>
                            <Button
                                type="submit"
                                disabled={busy}
                                className="h-11"
                            >
                                <BookmarkPlus aria-hidden="true" />
                                {form.processing
                                    ? 'Saving…'
                                    : entry
                                      ? 'Save changes'
                                      : 'Add to library'}
                            </Button>
                        </div>
                        <InputError
                            message={form.errors.is_favorite}
                            role="alert"
                        />
                    </form>
                    {entry && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={busy}
                                    className="mt-4 text-xs text-[#bdb6b1]"
                                >
                                    <Trash2 aria-hidden="true" />
                                    Remove from library
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="dark border-shadow bg-rein text-[#f4f1ed]">
                                <DialogHeader>
                                    <DialogTitle>
                                        Remove {gameName}?
                                    </DialogTitle>
                                    <DialogDescription className="leading-6 text-[#c5bfba]">
                                        This removes the game and all of your
                                        ratings, reviews, playthroughs, and
                                        diary entries for it. This cannot be
                                        undone. To keep your history, change the
                                        playing status instead.
                                    </DialogDescription>
                                </DialogHeader>
                                <InputError
                                    message={removal.errors.confirm}
                                    role="alert"
                                />
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            variant="outline"
                                            disabled={removal.processing}
                                        >
                                            Keep game
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        variant="destructive"
                                        disabled={busy}
                                        onClick={() =>
                                            removal.delete(
                                                destroy(gameSlug).url,
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        setOpen(false),
                                                },
                                            )
                                        }
                                    >
                                        {removal.processing
                                            ? 'Removing…'
                                            : 'Remove game and history'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </>
            )}
        </section>
    );
}
