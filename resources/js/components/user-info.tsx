import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    compact = false,
}: {
    user: User;
    showEmail?: boolean;
    compact?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar
                className={`${compact ? 'size-7' : 'size-8'} shrink-0 overflow-hidden rounded-full`}
            >
                <AvatarImage
                    src={user.avatar ?? undefined}
                    alt={user.name}
                    className="object-cover"
                />
                <AvatarFallback
                    className={`${compact ? 'text-[11px]' : ''} rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white`}
                >
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div
                className={`grid min-w-0 flex-1 text-left font-sans ${compact ? 'text-xs leading-4' : 'text-sm leading-tight'}`}
            >
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && (
                    <span
                        className={`truncate text-muted-foreground ${compact ? 'text-[11px] leading-4' : 'text-xs'}`}
                    >
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
