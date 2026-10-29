import { Link, useForm } from '@inertiajs/react';
import ConfirmDelete from '@/components/confirm-history-delete';
import GameCover from '@/components/game-cover';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { show } from '@/routes/games';
import { destroy, update } from '@/routes/list-items';
import type { ListItem } from '@/types/lists';

export default function GameListItem({
    item,
    listId,
    total,
    isOwner,
}: {
    item: ListItem;
    listId: number;
    total: number;
    isOwner: boolean;
}) {
    const form = useForm({ position: item.position, notes: item.notes ?? '' });
    return (
        <article className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-4 rounded-xl border border-shadow bg-rein/20 p-5 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-6 sm:p-6">
            <Link
                href={show(item.game.slug)}
                className="self-start rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <GameCover game={item.game} />
            </Link>
            <div className="min-w-0">
                <p className="mb-2 text-xs text-[#bdb6b1] tabular-nums">
                    No. {item.position}
                </p>
                <Link
                    href={show(item.game.slug)}
                    className="rounded-sm text-lg font-medium break-words hover:underline focus-visible:outline-2"
                >
                    {item.game.name}
                </Link>
                {item.notes && (
                    <p className="mt-3 text-sm leading-7 break-words whitespace-pre-wrap text-[#c5bfba]">
                        {item.notes}
                    </p>
                )}
                {isOwner && (
                    <details className="mt-4">
                        <summary className="cursor-pointer rounded-sm text-xs text-[#c5bfba] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
                            Edit notes and position
                        </summary>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.put(
                                    update({
                                        gameList: listId,
                                        listItem: item.id,
                                    }).url,
                                    { preserveScroll: true },
                                );
                            }}
                            className="mt-5 space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor={`position-${item.id}`}>
                                    Position in list
                                </Label>
                                <Input
                                    id={`position-${item.id}`}
                                    type="number"
                                    min={1}
                                    max={total}
                                    required
                                    value={form.data.position}
                                    onChange={(event) =>
                                        form.setData(
                                            'position',
                                            Number(event.target.value),
                                        )
                                    }
                                    disabled={form.processing}
                                    className="h-11 max-w-32 border-shadow bg-rein"
                                />
                                <InputError
                                    message={form.errors.position}
                                    role="alert"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`notes-${item.id}`}>
                                    Your notes
                                </Label>
                                <textarea
                                    id={`notes-${item.id}`}
                                    rows={3}
                                    maxLength={2000}
                                    value={form.data.notes}
                                    onChange={(event) =>
                                        form.setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    disabled={form.processing}
                                    className="w-full rounded-md border border-shadow bg-rein px-3 py-2 text-sm leading-7 focus-visible:outline-2 focus-visible:outline-offset-2"
                                />
                                <InputError
                                    message={form.errors.notes}
                                    role="alert"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={form.processing}
                                >
                                    {form.processing ? 'Saving…' : 'Save item'}
                                </Button>
                                <ConfirmDelete
                                    url={
                                        destroy({
                                            gameList: listId,
                                            listItem: item.id,
                                        }).url
                                    }
                                    title="Remove this game from the list?"
                                    description="This removes the game and its notes from this list. Your library and playing history will stay."
                                    label="Remove game"
                                />
                            </div>
                        </form>
                    </details>
                )}
            </div>
        </article>
    );
}
