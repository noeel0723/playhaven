import { Link } from '@inertiajs/react';
import FollowPlayer from '@/components/follow-player';
import GameCover from '@/components/game-cover';
import PlayerAvatar from '@/components/player-avatar';
import { show as gameDetail } from '@/routes/games';
import { show } from '@/routes/players';
import type { DiscoveredPlayer } from '@/types/community';

export default function PlayerDiscoveryCard({
    player,
}: {
    player: DiscoveredPlayer;
}) {
    return (
        <article className="mx-auto w-full max-w-40 min-w-0 text-center font-sans">
            <div className="relative mx-auto w-fit">
                <Link
                    href={show(player.username)}
                    aria-label={`View ${player.name}'s player profile`}
                    className="block rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0d9d3]"
                >
                    <PlayerAvatar
                        name={player.name}
                        src={player.avatar_url}
                        className="size-22 border-white/20 sm:size-28 lg:size-30 [&_[data-slot=avatar-fallback]]:text-2xl"
                    />
                </Link>
                <div className="absolute right-0 bottom-0">
                    <FollowPlayer player={player} compact />
                </div>
            </div>
            <Link
                href={show(player.username)}
                className="mt-3 block rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <h3
                    className="truncate text-sm leading-5 font-medium text-[#f4f1ed]"
                    title={player.name}
                >
                    {player.name}
                </h3>
                <p className="mt-0.5 truncate text-[11px] leading-4 text-[#a9a19b]">
                    @{player.username}
                </p>
            </Link>
            <p
                className="mt-2 text-[11px] leading-4 text-[#bdb6b1]"
                aria-label={`${player.followers_count} followers and ${player.public_reviews_count} public reviews`}
            >
                {player.followers_count.toLocaleString()}{' '}
                {player.followers_count === 1 ? 'follower' : 'followers'}
                <span className="mx-1.5" aria-hidden="true">
                    ·
                </span>
                {player.public_reviews_count.toLocaleString()}{' '}
                {player.public_reviews_count === 1 ? 'review' : 'reviews'}
            </p>
            {player.top_games.length ? (
                <ul
                    aria-label={`${player.name}'s Top 4 games`}
                    className="mt-2.5 grid grid-cols-4 gap-1"
                >
                    {player.top_games.map((game) => (
                        <li key={game.id} className="min-w-0">
                            <Link
                                href={gameDetail(game.slug)}
                                aria-label={`${game.name}, one of ${player.name}'s Top 4 games`}
                                className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                <GameCover
                                    game={game}
                                    compact
                                    hideFallbackTitle
                                    className="aspect-[2/3] rounded-sm group-hover:border-[#bdb6b1]"
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-2.5 text-[11px] leading-4 text-[#9e9690]">
                    No favorites shared yet.
                </p>
            )}
        </article>
    );
}
