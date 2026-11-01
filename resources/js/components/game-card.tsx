import { Star } from 'lucide-react';
import GamePreviewLink from '@/components/game-preview-link';
import type { CatalogGame } from '@/types/catalog';

export default function GameCard({
    game,
    poster = false,
}: {
    game: CatalogGame;
    poster?: boolean;
}) {
    const developerNames = game.developers
        ?.map((developer) => developer.name)
        .join(', ');
    return (
        <article className="min-w-0 font-sans">
            <GamePreviewLink
                game={game}
                compact={poster}
                coverClassName={
                    poster
                        ? 'aspect-[2/3] rounded-sm group-hover:border-[#bdb6b1]'
                        : undefined
                }
                className="group block rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#e0d9d3]"
            >
                <h2
                    title={
                        game.public_reviews_count === undefined
                            ? game.name
                            : undefined
                    }
                    className={
                        poster
                            ? 'mt-1.5 line-clamp-2 min-h-8 text-xs leading-4 font-medium wrap-break-word text-[#f4f1ed] group-hover:underline group-hover:underline-offset-4'
                            : 'mt-4 text-sm leading-5 font-semibold text-[#f4f1ed] group-hover:underline group-hover:underline-offset-4'
                    }
                >
                    {game.name}
                </h2>
            </GamePreviewLink>
            {game.developers !== undefined && (
                <p
                    className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-4 text-[#bdb6b1]"
                    title={developerNames || undefined}
                >
                    <span className="sr-only">Developer: </span>
                    {developerNames || 'Developer not listed'}
                </p>
            )}
            <div
                className={`${poster ? 'mt-1 gap-1 text-[11px]' : 'mt-2 gap-2 text-xs'} flex flex-wrap items-center justify-between text-[#bdb6b1]`}
            >
                <span>{game.released_on?.slice(0, 4) ?? 'Release TBA'}</span>
                {game.rating !== null ? (
                    <span
                        className="flex items-center gap-1"
                        aria-label={`${game.rating} out of 5 stars, ${game.ratings_count} ratings`}
                    >
                        <Star
                            className="size-3 fill-current"
                            aria-hidden="true"
                        />
                        {game.rating.toFixed(1)}
                    </span>
                ) : (
                    <span>Unrated</span>
                )}
            </div>
            {!poster && game.genres[0] && (
                <p className="mt-2 truncate text-xs text-[#bdb6b1]">
                    {game.genres.map((genre) => genre.name).join(' · ')}
                </p>
            )}
        </article>
    );
}
