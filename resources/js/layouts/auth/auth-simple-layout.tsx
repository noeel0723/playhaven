import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import PopularGameBackdrop from '@/components/popular-game-backdrop';
import { home } from '@/routes';
import { show as gameDetails } from '@/routes/games';
import type { FeaturedWorld } from '@/types/home';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const page = usePage<{ featuredWorld?: FeaturedWorld | null }>();
    const entryPage =
        page.component === 'auth/login' || page.component === 'auth/register';
    const world = entryPage ? (page.props.featuredWorld ?? null) : null;
    return (
        <div className="dark relative isolate flex min-h-svh flex-col overflow-x-clip bg-caviar font-sans text-[#f4f1ed]">
            {entryPage && <PopularGameBackdrop world={world} />}
            <a
                href="#auth-main"
                className="sr-only z-50 rounded-md bg-white p-3 text-black focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
            >
                Skip to content
            </a>
            <div className="relative z-20 w-full shrink-0">
                <SiteHeader />
            </div>
            <main
                id="auth-main"
                tabIndex={-1}
                className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-3 px-6 py-8 sm:px-10 sm:py-10"
            >
                <div
                    className={
                        entryPage
                            ? 'w-full max-w-sm rounded-lg border border-white/15 bg-caviar/85 p-4 shadow-lg backdrop-blur-md sm:p-5'
                            : 'w-full max-w-sm'
                    }
                >
                    <div
                        className={
                            entryPage ? 'space-y-4' : 'flex flex-col gap-8'
                        }
                    >
                        <div
                            className={
                                entryPage
                                    ? 'space-y-1.5'
                                    : 'flex flex-col items-center gap-4'
                            }
                        >
                            {!entryPage && (
                                <Link
                                    href={home()}
                                    className="flex flex-col items-center gap-2 font-medium"
                                >
                                    <div className="mb-1 flex size-9 items-center justify-center rounded-md">
                                        <AppLogoIcon className="size-9 text-white" />
                                    </div>
                                    <span className="sr-only">{title}</span>
                                </Link>
                            )}
                            <h1 className="text-xl font-medium tracking-tight">
                                {title}
                            </h1>
                            <p
                                className={
                                    entryPage
                                        ? 'text-xs leading-5 text-[#bdb6b1]'
                                        : 'text-center text-sm text-muted-foreground'
                                }
                            >
                                {description}
                            </p>
                        </div>
                        {children}
                    </div>
                </div>
                {world && (
                    <p className="max-w-sm text-center text-[11px] leading-5 text-[#bdb6b1]">
                        <Link
                            href={gameDetails(world.slug)}
                            className="rounded-sm hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            {world.name}
                        </Link>
                    </p>
                )}
            </main>
            <SiteFooter />
        </div>
    );
}
