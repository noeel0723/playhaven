import { Heart } from 'lucide-react';
import GameCard from '@/components/game-card';
import StarRating from '@/components/star-rating';
import { libraryStatuses } from '@/types/library';
import type { LibraryEntry } from '@/types/library';

export default function LibraryGameCard({ entry }: { entry: LibraryEntry }) {
    return (
        <div className="min-w-0">
            <GameCard game={entry.game} />
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-[#d5cec7]">
                <span>
                    {libraryStatuses.find(
                        (status) => status.value === entry.status,
                    )?.label ?? 'In library'}
                </span>
                {entry.is_favorite && (
                    <Heart
                        className="size-3.5 fill-current"
                        aria-label="Favorite game"
                        role="img"
                    />
                )}
            </div>
            {entry.your_rating !== null && (
                <div className="mt-3 space-y-1.5">
                    <p className="text-xs text-[#bdb6b1]">
                        Your rating · {entry.your_rating.toFixed(1)}
                    </p>
                    <StarRating value={entry.your_rating} />
                </div>
            )}
        </div>
    );
}
