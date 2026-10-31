import { useState } from 'react';
import GameDiaryForm from '@/components/game-diary-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { CatalogGame } from '@/types/catalog';

export default function GameDiaryDialog({ game }: { game: CatalogGame }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!busy) setOpen(value);
            }}
        >
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-7 border-shadow bg-rein/30 px-2 text-[11px] text-[#f4f1ed] hover:bg-rein hover:text-white"
                >
                    New log<span className="sr-only"> for {game.name}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="dark max-h-[85svh] overflow-y-auto border-shadow bg-caviar p-4 font-sans text-[#f4f1ed] sm:max-w-xl sm:p-5">
                <DialogHeader className="gap-1 text-left">
                    <DialogTitle className="pr-6 text-sm font-medium">
                        Log a game
                    </DialogTitle>
                    <DialogDescription className="text-[11px] text-[#bdb6b1]">
                        Update your status, review, and completion date.
                    </DialogDescription>
                </DialogHeader>
                <GameDiaryForm
                    game={game}
                    returnToDiary
                    onSaved={() => setOpen(false)}
                    onCancel={() => setOpen(false)}
                    onProcessing={setBusy}
                />
            </DialogContent>
        </Dialog>
    );
}
