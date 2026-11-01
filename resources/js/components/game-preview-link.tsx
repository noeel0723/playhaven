import { Link } from '@inertiajs/react';
import { MessageSquare, Star } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import GameCover from '@/components/game-cover';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { show } from '@/routes/games';
import type { CatalogGame } from '@/types/catalog';

export default function GamePreviewLink({
    game,
    children,
    className,
    coverClassName,
    compact = false,
    hideFallbackTitle = false,
}: {
    game: CatalogGame;
    children: ReactNode;
    className?: string;
    coverClassName?: string;
    compact?: boolean;
    hideFallbackTitle?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const hasPreview = game.public_reviews_count !== undefined;
    const developers = game.developers
        ?.map((developer) => developer.name)
        .join(', ');
    const rating =
        game.rating === null
            ? 'Not rated yet'
            : `${game.rating.toFixed(1)} / 5`;
    const ratings = `${game.ratings_count.toLocaleString()} ${game.ratings_count === 1 ? 'rating' : 'ratings'}`;
    const reviews = `${(game.public_reviews_count ?? 0).toLocaleString()} public ${game.public_reviews_count === 1 ? 'review' : 'reviews'}`;
    const compactNumber = new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
    });

    return (
        <Tooltip
            open={hasPreview && open}
            onOpenChange={setOpen}
            delayDuration={150}
        >
            <TooltipTrigger asChild>
                <Link
                    href={show(game.slug)}
                    className={cn(
                        'group block rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#e0d9d3]',
                        className,
                    )}
                >
                    <div className="relative">
                        <GameCover
                            game={game}
                            compact={compact}
                            hideFallbackTitle={hideFallbackTitle}
                            className={coverClassName}
                        />
                        {hasPreview && (
                            <span
                                data-game-preview={game.id}
                                aria-hidden="true"
                                className={cn(
                                    'pointer-events-none absolute inset-0 flex items-center justify-center rounded-sm bg-black/45 p-1 opacity-0 transition-opacity motion-reduce:transition-none',
                                    open &&
                                        'opacity-100 ring-1 ring-[#d5cec7] ring-inset',
                                )}
                            >
                                <span className="flex w-full max-w-28 flex-col items-center gap-2 rounded-md border border-white/10 bg-[#010101]/85 px-1.5 py-2 text-center font-sans text-[#f4f1ed]">
                                    <span className="flex flex-col items-center gap-0.5">
                                        <Star className="size-3.5 fill-[#d5cec7] text-[#d5cec7]" />
                                        <span className="text-xs leading-4 font-medium">
                                            {game.rating === null
                                                ? 'Unrated'
                                                : rating}
                                        </span>
                                        <span className="text-[10px] leading-3.5 whitespace-nowrap text-[#bdb6b1]">
                                            {compactNumber.format(
                                                game.ratings_count,
                                            )}{' '}
                                            {game.ratings_count === 1
                                                ? 'rating'
                                                : 'ratings'}
                                        </span>
                                    </span>
                                    <span className="flex flex-col items-center gap-1">
                                        <MessageSquare className="size-3.5 text-[#d5cec7]" />
                                        <span className="text-[10px] leading-3.5 whitespace-nowrap text-[#d5cec7]">
                                            {compactNumber.format(
                                                game.public_reviews_count ?? 0,
                                            )}{' '}
                                            {game.public_reviews_count === 1
                                                ? 'review'
                                                : 'reviews'}
                                        </span>
                                    </span>
                                </span>
                            </span>
                        )}
                    </div>
                    {children}
                </Link>
            </TooltipTrigger>
            {hasPreview && (
                <TooltipContent
                    side="top"
                    sideOffset={8}
                    collisionPadding={12}
                    className="max-w-60 border border-white/15 bg-[#312e2e] px-3 py-2 text-center font-sans text-xs leading-4 text-[#f4f1ed] shadow-lg [&_svg]:bg-[#312e2e] [&_svg]:fill-[#312e2e]"
                >
                    <p className="font-medium wrap-break-word">{game.name}</p>
                    <p className="mt-0.5 text-[11px] wrap-break-word text-[#c5bfba]">
                        {developers || 'Developer not listed'}
                    </p>
                    <span className="sr-only">
                        {rating}, {ratings}, {reviews}.
                    </span>
                </TooltipContent>
            )}
        </Tooltip>
    );
}
