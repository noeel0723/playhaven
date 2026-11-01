import { cn } from '@/lib/utils';

export default function AppWordmark({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'font-brand leading-none font-black tracking-[-0.045em]',
                className,
            )}
        >
            PlayHaven
        </span>
    );
}
