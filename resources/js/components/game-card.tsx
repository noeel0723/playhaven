import { Link } from '@inertiajs/react';
import { Star } from 'lucide-react';
import GameCover from '@/components/game-cover';
import { show } from '@/routes/games';
import type { CatalogGame } from '@/types/catalog';

export default function GameCard({ game }: { game: CatalogGame }) {
    return (
        <article>
            <Link
                href={show(game.slug)}
                className="group block rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#e0d9d3]"
            >
                <GameCover game={game} />
                <h2 className="mt-4 text-sm leading-5 font-semibold text-[#f4f1ed] group-hover:underline group-hover:underline-offset-4">
                    {game.name}
                </h2>
            </Link>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#bdb6b1]">
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
            {game.genres[0] && (
                <p className="mt-2 truncate text-xs text-[#bdb6b1]">
                    {game.genres.map((genre) => genre.name).join(' · ')}
                </p>
            )}
        </article>
    );
}
