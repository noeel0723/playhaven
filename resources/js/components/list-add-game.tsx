import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import GameCover from '@/components/game-cover';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { store } from '@/routes/list-items';
import type { CatalogGame } from '@/types/catalog';

export default function ListAddGame({
    game,
    listId,
    returnToEdit = false,
}: {
    game: CatalogGame;
    listId: number;
    returnToEdit?: boolean;
}) {
    const form = useForm({ game_id: game.id, return_to_edit: returnToEdit });
    return (
        <div className="flex min-w-0 items-center gap-4 rounded-lg border border-shadow p-3">
            <GameCover game={game} className="w-12 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium break-words">{game.name}</p>
                <InputError message={form.errors.game_id} role="alert" />
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={form.processing}
                    className="mt-1"
                    onClick={() =>
                        form.post(store(listId).url, { preserveScroll: true })
                    }
                >
                    <Plus aria-hidden="true" />
                    {form.processing ? 'Adding…' : 'Add to list'}
                </Button>
            </div>
        </div>
    );
}
