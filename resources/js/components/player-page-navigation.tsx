import { Link } from '@inertiajs/react';
import PlayerAvatar from '@/components/player-avatar';
import { index as ownDiary } from '@/routes/diary';
import { diary, stats, reviews, myReviews, me, show } from '@/routes/players';
import { index as ownStats } from '@/routes/stats';
import type { PlayerPageContext } from '@/types/community';

export function PlayerPageLinks({
    username,
    own = false,
    current,
    includeProfile = false,
}: {
    username: string | null;
    own?: boolean;
    current?: 'diary' | 'reviews' | 'stats';
    includeProfile?: boolean;
}) {
    const items = [
        ...(includeProfile
            ? [
                  {
                      key: 'profile',
                      label: 'Profile',
                      href: own ? me.url() : show.url(username!),
                  },
              ]
            : []),
        {
            key: 'diary',
            label: 'Diary',
            href: own ? ownDiary.url() : diary.url(username!),
        },
        {
            key: 'reviews',
            label: 'Reviews',
            href: own ? myReviews.url() : reviews.url(username!),
        },
        {
            key: 'stats',
            label: 'Statistic',
            href: own ? ownStats.url() : stats.url(username!),
        },
    ];
    return (
        <nav
            aria-label="Player pages"
            className="flex flex-wrap items-center gap-1"
        >
            {items.map((item) => (
                <Link
                    key={item.key}
                    href={item.href}
                    aria-current={current === item.key ? 'page' : undefined}
                    className="inline-flex min-h-7 items-center rounded-sm px-2 text-[11px] text-[#bdb6b1] hover:bg-rein/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 aria-[current=page]:bg-rein/50 aria-[current=page]:text-[#f4f1ed]"
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}

export default function PlayerPageNavigation({
    context,
    current,
    showIdentity = true,
}: {
    context: PlayerPageContext;
    current: 'diary' | 'reviews' | 'stats';
    showIdentity?: boolean;
}) {
    const { owner, isOwnPage } = context;
    return (
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 font-sans">
            {showIdentity && (
                <Link
                    href={isOwnPage ? me() : show(owner.username!)}
                    className="flex min-w-0 items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    <PlayerAvatar
                        name={owner.name}
                        src={owner.avatar_url}
                        className="size-9 shrink-0"
                    />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#f4f1ed]">
                            {owner.name}
                        </p>
                        {owner.username && (
                            <p className="truncate text-[11px] text-[#a9a19b]">
                                @{owner.username}
                            </p>
                        )}
                    </div>
                </Link>
            )}
            <PlayerPageLinks
                username={owner.username}
                own={isOwnPage}
                current={current}
                includeProfile
            />
        </header>
    );
}
