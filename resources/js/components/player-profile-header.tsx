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
            className="mb-10 flex flex-col gap-7 border-b border-white/10 pb-9 sm:mb-12 sm:pb-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10"
        >
            <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-6">
                <PlayerAvatar
                    name={name}
                    src={avatarUrl}
                    className="size-20 shrink-0 border-white/20 sm:size-28 lg:size-32 [&_[data-slot=avatar-fallback]]:text-2xl sm:[&_[data-slot=avatar-fallback]]:text-3xl"
                />
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl leading-tight font-semibold tracking-tight wrap-break-word sm:text-3xl">
                        {name}
                    </h1>
                    {username && (
                        <p className="mt-2 text-xs wrap-break-word text-[#a9a19b]">
                            @{username}
                        </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        {actions}
                    </div>
                    {bio && (
                        <p className="mt-4 max-w-xl text-sm leading-7 wrap-break-word whitespace-pre-wrap text-[#bdb6b1]">
                            {bio}
                        </p>
                    )}
                    {location && (
                        <p className="mt-3 flex items-start gap-1.5 text-xs leading-6 wrap-break-word text-[#a9a19b]">
                            <MapPin
                                className="mt-1 size-3.5 shrink-0"
                                aria-hidden="true"
                            />
                            <span>{location}</span>
                        </p>
                    )}
                </div>
            </div>
            <dl className="grid shrink-0 grid-cols-2 gap-y-5 sm:flex sm:items-center sm:justify-end sm:divide-x sm:divide-white/10 lg:pl-2">
                {statistics.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex min-w-0 flex-col px-4 text-center first:pl-0 sm:px-5 last:sm:pr-0"
                    >
                        <dt className="order-2 mt-2 text-[10px] tracking-[0.12em] text-[#a9a19b] uppercase">
                            {stat.label}
                        </dt>
                        <dd className="font-serif text-3xl font-semibold text-[#e0d9d3]">
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
