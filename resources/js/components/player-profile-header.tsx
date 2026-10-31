import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import PlayerAvatar from '@/components/player-avatar';

type Props = {
    name: string;
    username?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    location?: string | null;
    actions: ReactNode;
    statistics: { label: string; value: string | number }[];
};

export default function PlayerProfileHeader({
    name,
    username,
    avatarUrl,
    bio,
    location,
    actions,
    statistics,
}: Props) {
    return (
        <section
            aria-label="Player profile overview"
            className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 font-sans lg:flex-row lg:items-center lg:justify-between lg:gap-6"
        >
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                <PlayerAvatar
                    name={name}
                    src={avatarUrl}
                    className="size-16 shrink-0 border-white/20 sm:size-20 [&_[data-slot=avatar-fallback]]:text-xl"
                />
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl leading-tight font-medium tracking-tight wrap-break-word sm:text-2xl">
                        {name}
                    </h1>
                    {username && (
                        <p className="mt-1 text-[11px] wrap-break-word text-[#a9a19b]">
                            @{username}
                        </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 [&_a]:h-7 [&_a]:px-2.5 [&_a]:text-[11px] [&_button]:h-7 [&_button]:px-2.5 [&_button]:text-[11px] [&_svg]:size-3.5">
                        {actions}
                    </div>
                    {bio && (
                        <p className="mt-2 max-w-md text-xs leading-5 wrap-break-word whitespace-pre-wrap text-[#bdb6b1]">
                            {bio}
                        </p>
                    )}
                    {location && (
                        <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-4 wrap-break-word text-[#a9a19b]">
                            <MapPin
                                className="mt-0.5 size-3 shrink-0"
                                aria-hidden="true"
                            />
                            <span>{location}</span>
                        </p>
                    )}
                </div>
            </div>
            <dl className="grid grid-cols-4 divide-x divide-white/10 lg:max-w-[340px] lg:shrink-0">
                {statistics.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex min-w-0 flex-col px-2 text-center first:pl-0 last:pr-0 sm:px-3"
                    >
                        <dt className="order-2 mt-1 text-[10px] leading-4 tracking-[0.06em] text-[#a9a19b] uppercase">
                            {stat.label}
                        </dt>
                        <dd className="text-xl leading-6 font-medium wrap-break-word text-[#e0d9d3] tabular-nums">
                            {typeof stat.value === 'number'
                                ? stat.value.toLocaleString()
                                : stat.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
