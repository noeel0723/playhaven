import { Heart } from 'lucide-react';
import GameCard from '@/components/game-card';
import { libraryStatuses } from '@/types/library';
import type { LibraryEntry } from '@/types/library';

export default function LibraryGameCard({ entry }: { entry: LibraryEntry }) {
    return (
        <div className="min-w-0">
            <GameCard game={entry.game} />
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-[#d5cec7]">
                <span>
                    {
                        libraryStatuses.find(
                            (status) => status.value === entry.status,
                        )?.label
                    }
                </span>
                {entry.is_favorite && (
                    <Heart
                        className="size-3.5 fill-current"
                        aria-label="Favorite game"
                        role="img"
                    />
                )}
            </div>
        </div>
    );
}
