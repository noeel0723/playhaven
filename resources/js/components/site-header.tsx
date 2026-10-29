import { Form, Link, usePage } from '@inertiajs/react';
import { Menu, Search, X } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import PlayerAvatar from '@/components/player-avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard, home, login, register } from '@/routes';
import { index as community } from '@/routes/community';
import { index as games } from '@/routes/games';
import { index as library } from '@/routes/library';
import { index as diary } from '@/routes/diary';
import { index as myLists } from '@/routes/lists';
import { discover as lists } from '@/routes/lists';
import { index as players } from '@/routes/players';
import type { User } from '@/types';

function AccountMenu({ user }: { user: User }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-white/10"
                    aria-label="Account menu"
                >
                    <PlayerAvatar
                        name={user.name}
                        src={user.avatar}
                        className="size-8 border-white/30"
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="dark w-60 border-shadow bg-caviar text-[#f4f1ed]"
            >
                <UserMenuContent user={user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function GameSearch({ id }: { id: string }) {
    return (
        <Form
            action={games()}
            method="get"
            role="search"
            aria-label="Search the game catalog"
            className="relative"
        >
            <label htmlFor={id} className="sr-only">
                Search games
            </label>
            <input
                id={id}
                name="q"
                type="search"
                maxLength={100}
                placeholder="Search games"
                className="h-9 w-full rounded-full border border-white/15 bg-white/10 pr-10 pl-4 text-xs text-white outline-offset-4 backdrop-blur-md placeholder:text-white/75 focus-visible:outline-2 focus-visible:outline-white"
            />
            <button
                type="submit"
                aria-label="Submit game search"
                className="absolute top-0 right-0 flex size-9 items-center justify-center rounded-full text-white/90 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <Search className="size-4" aria-hidden="true" />
            </button>
        </Form>
    );
}

export default function SiteHeader() {
    const page = usePage();
    const { auth } = page.props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const links = [
        { label: 'Games', href: games() },
        { label: 'Lists', href: lists() },
        { label: 'Community', href: community() },
        { label: 'Players', href: players() },
    ];
    return (
        <header className="relative z-20 mx-auto flex h-24 max-w-7xl items-center justify-between gap-6 px-6 sm:px-10 lg:h-28">
            <Link
                href={home()}
                aria-label="PlayHaven home"
                className="flex shrink-0 items-center gap-2.5 rounded-sm text-2xl font-semibold tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-8"
            >
                <AppLogoIcon className="size-9" />
                <span>PlayHaven</span>
            </Link>
            <nav
                aria-label="Main navigation"
                className="hidden h-11 min-w-0 items-center gap-5 lg:flex xl:gap-7"
            >
                {links.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        aria-current={
                            isCurrentOrParentUrl(link.href) ? 'page' : undefined
                        }
                        className="rounded-sm text-[11px] font-semibold tracking-[0.08em] text-[#e0d9d3] uppercase transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 aria-[current=page]:text-white aria-[current=page]:underline aria-[current=page]:decoration-white/40 aria-[current=page]:underline-offset-8"
                    >
                        {link.label}
                    </Link>
                ))}
                <div className="w-36 xl:w-44">
                    <GameSearch id="site-desktop-search" />
                </div>
                {auth.user ? (
                    <div className="flex w-48 shrink-0 items-center justify-end gap-4">
                        <Link
                            href={dashboard()}
                            className="shrink-0 rounded-sm text-[11px] font-semibold tracking-[0.08em] text-white uppercase focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            Your haven
                        </Link>
                        <AccountMenu user={auth.user} />
                    </div>
                ) : (
                    <div className="flex w-48 shrink-0 items-center justify-end gap-4">
                        <Link
                            href={login()}
                            className="rounded-sm text-[11px] font-semibold tracking-[0.08em] text-[#e0d9d3] uppercase hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            Log in
                        </Link>
                        <Link
                            href={register()}
                            className="rounded-full border border-white/35 px-4 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-white uppercase transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            Join PlayHaven
                        </Link>
                    </div>
                )}
            </nav>
            <details
                key={page.url}
                className="group lg:hidden"
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        event.currentTarget.open = false;
                        event.currentTarget.querySelector('summary')?.focus();
                    }
                }}
            >
                <summary
                    aria-label="Toggle navigation menu"
                    className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/25 bg-caviar/40 text-white backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden"
                >
                    <Menu
                        className="size-5 group-open:hidden"
                        aria-hidden="true"
                    />
                    <X
                        className="hidden size-5 group-open:block"
                        aria-hidden="true"
                    />
                </summary>
                <nav
                    aria-label="Mobile navigation"
                    className="absolute top-22 right-6 left-6 rounded-xl border border-shadow bg-caviar/95 p-5 text-[#f4f1ed] shadow-2xl backdrop-blur-xl sm:right-10 sm:left-10"
                >
                    <GameSearch id="site-mobile-search" />
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {links.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                aria-current={
                                    isCurrentOrParentUrl(link.href)
                                        ? 'page'
                                        : undefined
                                }
                                className="rounded-md p-3 text-sm hover:bg-rein focus-visible:outline-2 aria-[current=page]:bg-rein"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/15 pt-5">
                        {auth.user ? (
                            <>
                                <Link
                                    href={library()}
                                    className="rounded-sm text-sm underline underline-offset-4"
                                >
                                    Your library
                                </Link>
                                <Link
                                    href={diary()}
                                    className="rounded-sm text-sm underline underline-offset-4"
                                >
                                    Diary
                                </Link>
                                <Link
                                    href={myLists()}
                                    className="rounded-sm text-sm underline underline-offset-4"
                                >
                                    Your lists
                                </Link>
                                <Link
                                    href={dashboard()}
                                    className="rounded-sm text-sm underline underline-offset-4"
                                >
                                    Your haven
                                </Link>
                                <AccountMenu user={auth.user} />
                            </>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-sm text-sm underline underline-offset-4"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-sm text-sm underline underline-offset-4"
                                >
                                    Join PlayHaven
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </details>
        </header>
    );
}
