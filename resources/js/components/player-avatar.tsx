import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

export default function PlayerAvatar({
    name,
    src,
    className,
}: {
    name: string;
    src?: string | null;
    className?: string;
}) {
    const initials = useInitials();
    return (
        <Avatar
            role="img"
            aria-label={`Profile photo of ${name}`}
            className={cn('size-10 border border-shadow', className)}
        >
            <AvatarImage
                src={src ?? undefined}
                alt=""
                className="object-cover"
            />
            <AvatarFallback className="rounded-full bg-rein text-sm text-[#e0d9d3]">
                {initials(name) || 'P'}
            </AvatarFallback>
        </Avatar>
    );
}
