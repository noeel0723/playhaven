import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { show } from '@/routes/lists';
import type { GameList } from '@/types/lists';
import PlayerAvatar from '@/components/player-avatar';

export default function GameListCard({ list }: { list: GameList }) {
    return (
        <article className="min-w-0 rounded-xl border border-shadow bg-rein/25 p-6">
            <p className="mb-4 text-xs text-[#bdb6b1]">
                {list.items_count} {list.items_count === 1 ? 'game' : 'games'} ·{' '}
                {list.visibility}
            </p>
            <Link
                href={show({ listOwner: list.owner.id, listSlug: list.slug })}
                className="group flex items-start justify-between gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <h2 className="min-w-0 font-serif text-2xl break-words group-hover:underline">
                    {list.name}
                </h2>
                <ArrowUpRight
                    className="mt-1 size-4 shrink-0"
                    aria-hidden="true"
                />
            </Link>
            {list.description && (
                <p className="mt-4 line-clamp-3 text-sm leading-7 break-words text-[#bdb6b1]">
                    {list.description}
                </p>
            )}
            <p className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-[#c5bfba]">
                <PlayerAvatar
                    name={list.owner.name}
                    src={list.owner.avatar_url}
                    className="size-6"
                />
                <span className="min-w-0 wrap-break-word">
                    Curated by {list.owner.name}
                </span>
            </p>
        </article>
    );
}
