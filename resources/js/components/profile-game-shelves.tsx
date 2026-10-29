import { Link } from '@inertiajs/react';
import { Gamepad2, LockKeyhole } from 'lucide-react';
import GameCover from '@/components/game-cover';
import StarRating from '@/components/star-rating';
import { show } from '@/routes/games';
import { edit } from '@/routes/players';
import type { CatalogGame } from '@/types/catalog';
import type { CompletedGame } from '@/types/community';

const shelfLink = `${edit().url}#profile-shelves`;

function Poster({
    game,
    rank,
    showTitle = true,
}: {
    game: CatalogGame;
    rank?: number;
    showTitle?: boolean;
}) {
    return (
        <Link
            href={show(game.slug)}
            title={game.name}
            aria-label={rank ? `Top ${rank}: ${game.name}` : game.name}
            className="group block min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
        >
            <div className="relative">
                <GameCover
                    game={game}
                    compact
                    className="aspect-[2/3] rounded-md shadow-lg transition-colors group-hover:border-[#c5bfba]"
                />
                {rank && (
                    <span
                        className="pointer-events-none absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-caviar/80 text-[10px] text-[#f4f1ed] sm:size-6 sm:text-xs"
                        aria-hidden="true"
                    >
                        {rank}
                    </span>
                )}
            </div>
            {showTitle && (
                <span className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-4 text-[#c5bfba] group-hover:text-white sm:text-xs">
                    {game.name}
                </span>
            )}
        </Link>
    );
}

export default function ProfileGameShelves({
    topGames,
    recentCompleted,
    recentCompletedShared,
    isOwner,
}: {
    topGames: CatalogGame[];
    recentCompleted: CompletedGame[];
    recentCompletedShared: boolean;
    isOwner: boolean;
}) {
    return (
        <>
            <section aria-labelledby="top-four-games">
                <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-shadow pb-3">
                    <h2
                        id="top-four-games"
                        className="text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm"
                    >
                        Top 4 games
                    </h2>
                    {isOwner && (
                        <Link
                            href={shelfLink}
                            className="rounded-sm text-xs text-[#bdb6b1] underline-offset-4 hover:underline focus-visible:outline-2"
                        >
                            Edit picks
                        </Link>
                    )}
                </div>
                <div className="grid grid-cols-4 items-start gap-2 sm:gap-4">
                    {Array.from({ length: 4 }, (_, index) => (
                        <div
                            key={topGames[index]?.id ?? `empty-${index}`}
                            className="min-w-0"
                        >
                            {topGames[index] ? (
                                <Poster
                                    game={topGames[index]}
                                    rank={index + 1}
                                />
                            ) : (
                                <div
                                    className="flex aspect-[2/3] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-shadow bg-rein/10 p-2 text-[#807d7d]"
                                    aria-label={`Top game ${index + 1} not selected`}
                                >
                                    <Gamepad2
                                        className="size-5 sm:size-7"
                                        strokeWidth={1}
                                        aria-hidden="true"
                                    />
                                    <span className="text-[10px] sm:text-xs">
                                        No. {index + 1}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {!topGames.length && (
                    <p className="mt-4 text-xs leading-6 text-[#bdb6b1]">
                        {isOwner
                            ? 'Choose four games that feel like you. Add your picks from Edit picks.'
                            : 'This player has not chosen their favorites yet.'}
                    </p>
                )}
            </section>
            <section
                aria-labelledby="recent-completed-games"
                className="mt-10 sm:mt-12"
            >
                <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-shadow pb-3">
                    <h2
                        id="recent-completed-games"
                        className="text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm"
                    >
                        Recently completed
                    </h2>
                    {isOwner && (
                        <Link
                            href={shelfLink}
                            className="rounded-sm text-xs text-[#bdb6b1] underline-offset-4 hover:underline focus-visible:outline-2"
                        >
                            Manage
                        </Link>
                    )}
                </div>
                {!recentCompletedShared ? (
                    <div className="flex items-start gap-3 rounded-md border border-dashed border-shadow px-5 py-7 text-sm leading-7 text-[#bdb6b1]">
                        <LockKeyhole
                            className="mt-1 size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <p>
                            {isOwner
                                ? 'Recent completions are private. Turn on sharing in your profile shelves to display your latest four.'
                                : 'This player keeps their recent completions private.'}
                        </p>
                    </div>
                ) : recentCompleted.length ? (
                    <div className="grid grid-cols-4 items-start gap-2 sm:gap-4">
                        {recentCompleted.map((entry) => (
                            <div key={entry.game.id} className="min-w-0">
                                <Poster game={entry.game} showTitle={false} />
                                <div className="mt-2 flex h-4 items-center">
                                    {entry.rating !== null ? (
                                        <StarRating
                                            value={entry.rating}
                                            compact
                                        />
                                    ) : (
                                        <span className="text-[10px] text-[#807d7d] sm:text-xs">
                                            Unrated
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-4 text-[#c5bfba] sm:text-xs">
                                    {entry.game.name}
                                </p>
                                {entry.completed_at ? (
                                    <time
                                        dateTime={entry.completed_at}
                                        className="mt-1 block text-[10px] leading-4 text-[#bdb6b1] sm:text-xs"
                                    >
                                        {new Intl.DateTimeFormat('en', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            timeZone: 'UTC',
                                        }).format(new Date(entry.completed_at))}
                                    </time>
                                ) : (
                                    <p className="mt-1 text-[10px] leading-4 text-[#807d7d] sm:text-xs">
                                        Date not recorded
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="rounded-md border border-dashed border-shadow px-5 py-7 text-sm leading-7 text-[#bdb6b1]">
                        {isOwner
                            ? 'Mark a game Completed in your library to begin this shelf.'
                            : 'No completed games to share yet.'}
                    </p>
                )}
            </section>
        </>
    );
}
