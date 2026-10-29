import { Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CatalogGame } from '@/types/catalog';

export default function GameCover({
    game,
    className,
}: {
    game: Pick<CatalogGame, 'id' | 'name' | 'cover_url'>;
    className?: string;
}) {
    const [failed, setFailed] = useState(false);
    return (
        <div
            aria-hidden="true"
            className={cn(
                'relative aspect-[3/4] overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-saddle/60 via-rein to-caviar',
                className,
            )}
        >
            {game.cover_url && !failed ? (
                <img
                    src={game.cover_url}
                    alt=""
                    loading="lazy"
                    width="264"
                    height="352"
                    className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="flex h-full flex-col items-center justify-center gap-5 p-5 text-center">
                    <Gamepad2
                        className="size-10 text-mustang"
                        strokeWidth={1}
                        aria-hidden="true"
                    />
                    <span className="line-clamp-3 font-serif text-lg leading-tight text-[#d5cec7]">
                        {game.name}
                    </span>
                </div>
            )}
        </div>
    );
}
