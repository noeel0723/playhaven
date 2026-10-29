import { Link, usePage } from '@inertiajs/react';
import { CircleUserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { dashboard, home, login, register } from '@/routes';
import { index } from '@/routes/games';
import { index as library } from '@/routes/library';

export default function CatalogLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props;
    return (
        <div className="dark min-h-svh bg-caviar text-[#f4f1ed] selection:bg-mustang selection:text-caviar">
            <a
                href="#catalog-main"
                className="sr-only z-50 rounded-md bg-white p-3 text-black focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
            >
                Skip to content
            </a>
            <header className="border-b border-white/10">
                <nav
                    aria-label="Main navigation"
                    className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10"
                >
                    <Link
                        href={home()}
                        className="flex items-center gap-2.5 rounded-sm text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                        <AppLogoIcon className="size-7" />
                        PlayHaven
                    </Link>
                    <div className="flex max-w-full flex-wrap items-center gap-1 sm:gap-4">
                        <Button asChild variant="ghost">
                            <Link href={index()}>Games</Link>
                        </Button>
                        {auth.user ? (
                            <>
                                <Button asChild variant="ghost">
                                    <Link href={library()}>Your library</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={dashboard()}>Your haven</Link>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Account menu"
                                        >
                                            <CircleUserRound aria-hidden="true" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="dark w-60 border-shadow bg-rein text-[#f4f1ed]"
                                    >
                                        <UserMenuContent user={auth.user} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Button asChild variant="ghost">
                                    <Link href={login()}>Log in</Link>
                                </Button>
                                <Button
                                    asChild
                                    className="hidden sm:inline-flex"
                                >
                                    <Link href={register()}>
                                        Join PlayHaven
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </nav>
            </header>
            <main
                id="catalog-main"
                className="mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16"
            >
                {children}
            </main>
            <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-white/10 px-6 py-8 text-xs text-[#bdb6b1] sm:px-10">
                <span>PlayHaven · Your Games. Your Stories.</span>
                <span>
                    Game metadata and artwork from{' '}
                    <a
                        href="https://rawg.io"
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 hover:text-white"
                    >
                        RAWG
                    </a>
                    .
                </span>
            </footer>
        </div>
    );
}
