import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home, login, register } from '@/routes';
import { index as games } from '@/routes/games';
import { discover as discoverLists, index as lists } from '@/routes/lists';
import { index as community } from '@/routes/community';
import { index as players, me as profile } from '@/routes/players';
import { index as library } from '@/routes/library';
import { index as diary } from '@/routes/diary';
import { index as stats } from '@/routes/stats';

const linkClass =
    'inline-flex min-h-7 w-fit items-center rounded-sm text-[11px] text-[#bdb6b1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2';

export default function SiteFooter() {
    const { auth } = usePage().props;
    const explore = [
        { label: 'Games', href: games() },
        { label: 'Lists', href: discoverLists() },
        { label: 'Community', href: community() },
        { label: 'Players', href: players() },
    ];
    const account = auth.user
        ? [
              { label: 'Profile', href: profile() },
              { label: 'Library', href: library() },
              { label: 'Diary', href: diary() },
              { label: 'Lists', href: lists() },
              { label: 'Statistic', href: stats() },
          ]
        : [
              { label: 'Log in', href: login() },
              { label: 'Create account', href: register() },
          ];
    return (
        <footer
            className="dark relative z-10 mt-auto w-full border-t border-white/10 bg-caviar/95 px-6 font-sans text-[#f4f1ed] sm:px-10"
            aria-label="Site footer"
        >
            <div className="mx-auto max-w-4xl py-6">
                <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[1.4fr_1fr_1fr]">
                    <div>
                        <Link
                            href={home()}
                            aria-label="PlayHaven home"
                            className="inline-flex min-h-7 items-center gap-2 rounded-sm text-base font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            <AppLogoIcon className="size-6" />
                            PlayHaven
                        </Link>
                        <p className="mt-1 text-[11px] leading-5 text-[#a9a19b]">
                            Your Games. Your Stories.
                        </p>
                    </div>
                    <nav aria-label="Footer explore">
                        <h2 className="mb-1 text-[11px] font-medium tracking-[0.08em] text-[#d5cec7] uppercase">
                            Explore
                        </h2>
                        <div className="grid grid-cols-2 gap-x-3">
                            {explore.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className={linkClass}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                    <nav aria-label="Footer account">
                        <h2 className="mb-1 text-[11px] font-medium tracking-[0.08em] text-[#d5cec7] uppercase">
                            Your account
                        </h2>
                        <div className="grid grid-cols-2 gap-x-3">
                            {account.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className={linkClass}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-[10px] leading-5 text-[#a9a19b]">
                    <p>© {new Date().getFullYear()} PlayHaven</p>
                    <p>
                        Game metadata and artwork from{' '}
                        <a
                            href="https://rawg.io"
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-sm underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            RAWG
                        </a>
                        .
                    </p>
                </div>
            </div>
        </footer>
    );
}
