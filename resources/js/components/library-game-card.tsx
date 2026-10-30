import { Link } from '@inertiajs/react';
import { CheckCircle2, Gamepad2, Heart, Pause, Square } from 'lucide-react';
import GameCard from '@/components/game-card';
import GameCover from '@/components/game-cover';
import StarRating from '@/components/star-rating';
import { show } from '@/routes/games';
import { libraryStatuses } from '@/types/library';
import type { LibraryEntry } from '@/types/library';

export default function LibraryGameCard({
    entry,
    compact = false,
}: {
    entry: LibraryEntry;
    compact?: boolean;
}) {
    const status =
        libraryStatuses.find((status) => status.value === entry.status)
            ?.label ?? 'In library';
    const StatusIcon = entry.status
        ? {
              completed: CheckCircle2,
              playing: Gamepad2,
              paused: Pause,
              dropped: Square,
          }[entry.status]
        : Gamepad2;
    if (compact)
        return (
            <article className="min-w-0" aria-label={entry.game.name}>
                <Link
                    href={show(entry.game.slug)}
                    aria-label={entry.game.name}
                    title={`${entry.game.name} · ${status}${entry.your_rating !== null ? ` · ${entry.your_rating} / 5` : ''}`}
                    className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    <GameCover
                        game={entry.game}
                        compact
                        className="aspect-[2/3] rounded-sm group-hover:border-[#bdb6b1]"
                    />
                </Link>
                <div className="mt-1 flex min-h-3.5 flex-wrap items-center gap-1 text-[#bdb6b1]">
                    {entry.your_rating !== null && (
                        <StarRating value={entry.your_rating} compact />
                    )}
                    <span title={status}>
                        <StatusIcon
                            role="img"
                            aria-label={status}
                            className="size-2.5"
                        />
                    </span>
                    {entry.is_favorite && (
                        <Heart
                            className="size-2.5 fill-current"
                            aria-label="Favorite game"
                            role="img"
                        />
                    )}
                </div>
            </article>
        );
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
