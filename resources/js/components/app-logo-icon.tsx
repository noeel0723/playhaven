import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    className,
    ...props
}: Omit<ComponentProps<'img'>, 'src' | 'alt'>) {
    return (
        <img
            {...props}
            src="/brand/playhaven-logo.svg"
            alt=""
            aria-hidden="true"
            width={696}
            height={324}
            className={cn('shrink-0 object-contain', className)}
        />
    );
}
