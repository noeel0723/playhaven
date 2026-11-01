import { Check, UserCheck, UsersRound } from 'lucide-react';
import type { PublicPlayer } from '@/types/community';

export default function PlayerRelationship({
    player,
}: {
    player: PublicPlayer;
}) {
    if (player.is_self) return null;
    const label = player.is_friend
        ? 'Friends'
        : player.is_following
          ? 'Following'
          : player.follows_you
            ? 'Follows you'
            : null;
    if (!label) return null;
    const Icon = player.is_friend
        ? UsersRound
        : player.is_following
          ? Check
          : UserCheck;
    return (
        <span
            className={`inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded border px-1.5 font-sans text-[10px] leading-none font-medium ${player.is_friend ? 'border-[#76bce9]/30 bg-[#4a97d6]/10 text-[#a8d4f2]' : 'border-white/10 bg-rein/30 text-[#bdb6b1]'}`}
            title={
                player.is_friend
                    ? 'You follow each other'
                    : player.is_following
                      ? 'You follow this player'
                      : 'This player follows you'
            }
        >
            <Icon className="size-3" aria-hidden="true" />
            {label}
        </span>
    );
}
