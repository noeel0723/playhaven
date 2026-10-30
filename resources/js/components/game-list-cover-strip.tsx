import { Gamepad2 } from 'lucide-react';
import GameCover from '@/components/game-cover';
import type { GameList } from '@/types/lists';

export default function GameListCoverStrip({ list }: { list: GameList }) {
    const games = list.preview_games ?? [];
    return (
        <div
            className="relative aspect-[5/2] overflow-hidden rounded border border-white/15 bg-rein/30"
            aria-hidden="true"
        >
            {games.length ? (
                Array.from({ length: 5 }, (_, index) => {
                    const game = games[index];
                    const style = { left: `${index * 18}%`, zIndex: 5 - index };
                    return game ? (
                        <div
                            key={game.id}
                            className="absolute inset-y-0 w-[28%]"
                            style={style}
                        >
                            <GameCover
                                game={game}
                                compact
                                hideFallbackTitle
                                className="h-full w-full rounded-sm border-white/15 shadow-md group-hover:border-[#807d7d]"
                            />
                        </div>
                    ) : (
                        <span
                            key={`empty-${index}`}
                            className="absolute inset-y-0 w-[28%] border-l border-white/10 bg-gradient-to-br from-rein to-caviar"
                            style={style}
                        />
                    );
                })
            ) : (
                <span className="flex h-full items-center justify-center gap-2 text-[11px] text-[#a9a19b]">
                    <Gamepad2 className="size-4" /> No games yet
                </span>
            )}
        </div>
    );
}
