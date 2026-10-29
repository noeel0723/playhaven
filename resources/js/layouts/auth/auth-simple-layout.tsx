import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import SiteHeader from '@/components/site-header';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="dark min-h-svh bg-caviar text-[#f4f1ed]">
            <a
                href="#auth-main"
                className="sr-only z-50 rounded-md bg-white p-3 text-black focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
            >
                Skip to content
            </a>
            <SiteHeader />
            <main
                id="auth-main"
                tabIndex={-1}
                className="flex min-h-[calc(100svh-7rem)] flex-col items-center justify-center gap-6 p-6 md:p-10"
            >
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                    <AppLogoIcon className="size-9 text-[var(--foreground)] dark:text-white" />
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-center text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
