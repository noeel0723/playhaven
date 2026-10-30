import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import ConfirmDelete from '@/components/confirm-history-delete';
import GameCover from '@/components/game-cover';
import StarRating from '@/components/star-rating';
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
    busy,
    onMove,
}: {
    item: ListItem;
    listId: number;
    total: number;
    busy: boolean;
    onMove: (item: ListItem, position: number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        position: item.position,
        notes: item.notes ?? '',
        return_to_edit: true,
    });
    useEffect(() => {
        form.setData('position', item.position);
    }, [item.position]);
    useEffect(() => {
        form.setData('notes', item.notes ?? '');
    }, [item.notes]);
    const disabled = busy || form.processing;
    return (
        <article
            aria-label={item.game.name}
            className="border-b border-white/10 last:border-b-0"
        >
            <div className="flex min-w-0 items-center gap-2 px-3 py-3 sm:gap-4">
                <div className="flex shrink-0 items-center gap-2 text-[#bdb6b1]">
                    <div className="flex flex-col">
                        <button
                            type="button"
                            disabled={disabled || item.position <= 1}
                            onClick={() => onMove(item, item.position - 1)}
                            aria-label={`Move ${item.game.name} up`}
                            className="rounded-sm p-0.5 hover:text-white focus-visible:outline-2 disabled:opacity-25"
                        >
                            <ChevronUp className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            disabled={disabled || item.position >= total}
                            onClick={() => onMove(item, item.position + 1)}
                            aria-label={`Move ${item.game.name} down`}
                            className="rounded-sm p-0.5 hover:text-white focus-visible:outline-2 disabled:opacity-25"
                        >
                            <ChevronDown className="size-3.5" />
                        </button>
                    </div>
                    <span
                        className="min-w-5 text-center text-xs font-medium tabular-nums"
                        aria-label={`Position ${item.position}`}
                    >
                        {item.position}
                    </span>
                </div>
                <Link
                    href={show(item.game.slug)}
                    aria-label={`View ${item.game.name}`}
                    className="block w-9 shrink-0 rounded-sm focus-visible:outline-2 sm:w-10"
                >
                    <GameCover
                        game={item.game}
                        compact
                        hideFallbackTitle
                        className="aspect-[2/3] rounded-sm"
                    />
                </Link>
                <div className="min-w-0 flex-1">
                    <Link
                        href={show(item.game.slug)}
                        className="rounded-sm text-sm leading-5 font-medium wrap-break-word hover:underline focus-visible:outline-2"
                    >
                        {item.game.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#bdb6b1]">
                        <span>
                            {item.game.released_on?.slice(0, 4) ??
                                'Release TBA'}
                        </span>
                        {item.game.rating !== null ? (
                            <span title="Community rating">
                                <StarRating value={item.game.rating} compact />
                            </span>
                        ) : (
                            <span>Unrated</span>
                        )}
                    </div>
                    {item.notes && !editing && (
                        <p className="mt-1 line-clamp-1 text-xs leading-5 text-[#bdb6b1]">
                            {item.notes}
                        </p>
                    )}
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        aria-expanded={editing}
                        aria-controls={`edit-item-${item.id}`}
                        onClick={() => setEditing(!editing)}
                        className="h-8 gap-1 px-2 text-xs text-[#bdb6b1]"
                    >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">
                            {editing
                                ? 'Close'
                                : item.notes
                                  ? 'Edit note'
                                  : 'Add note'}
                        </span>
                    </Button>
                    <ConfirmDelete
                        url={
                            destroy({ gameList: listId, listItem: item.id }).url
                        }
                        title="Remove this game from the list?"
                        description="This removes the game and its notes from this list. Your library and playing history stay."
                        label="Remove game"
                        data={{ return_to_edit: true }}
                        iconOnly
                        disabled={disabled}
                    />
                </div>
            </div>
            {editing && (
                <form
                    id={`edit-item-${item.id}`}
                    className="space-y-3 border-t border-white/10 bg-rein/15 p-3 sm:ml-20 sm:p-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put(
                            update({ gameList: listId, listItem: item.id }).url,
                            {
                                preserveScroll: true,
                                onSuccess: () => setEditing(false),
                            },
                        );
                    }}
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <Label
                            htmlFor={`position-${item.id}`}
                            className="text-xs"
                        >
                            Position in list
                        </Label>
                        <Input
                            id={`position-${item.id}`}
                            type="number"
                            min={1}
                            max={total}
                            required
                            disabled={disabled}
                            value={form.data.position}
                            onChange={(event) =>
                                form.setData(
                                    'position',
                                    Number(event.target.value),
                                )
                            }
                            className="h-8 w-20 border-shadow bg-rein text-xs"
                        />
                    </div>
                    <InputError message={form.errors.position} role="alert" />
                    <Label htmlFor={`notes-${item.id}`} className="text-xs">
                        Your notes
                    </Label>
                    <textarea
                        id={`notes-${item.id}`}
                        rows={3}
                        maxLength={2000}
                        disabled={disabled}
                        value={form.data.notes}
                        onChange={(event) =>
                            form.setData('notes', event.target.value)
                        }
                        className="w-full rounded-md border border-shadow bg-rein px-3 py-2 text-xs leading-6 focus-visible:outline-2 focus-visible:outline-offset-2"
                    />
                    <InputError message={form.errors.notes} role="alert" />
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={disabled}>
                            {form.processing ? 'Saving…' : 'Save item'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                            onClick={() => {
                                form.setData('notes', item.notes ?? '');
                                setEditing(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            )}
        </article>
    );
}
