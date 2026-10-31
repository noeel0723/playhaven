import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Heart,
    Library,
    ListOrdered,
    Users,
} from 'lucide-react';
import GameCover from '@/components/game-cover';
import SiteHeader from '@/components/site-header';
import { dashboard, register } from '@/routes';
import { index as community } from '@/routes/community';
import { index as diary } from '@/routes/diary';
import { index as games, show } from '@/routes/games';
import { index as library } from '@/routes/library';
import { discover as discoverLists, index as myLists } from '@/routes/lists';
import { index as statistics } from '@/routes/stats';
import type { CatalogGame } from '@/types/catalog';

type Props = {
    featuredGames: CatalogGame[];
    featuredWorld: { name: string; slug: string } | null;
    catalogCount: number;
};

export default function Welcome({
    featuredGames,
    featuredWorld,
    catalogCount,
}: Props) {
    const { auth } = usePage().props;
    const experiences = [
        {
            icon: Library,
            title: 'Give every game a place.',
            description:
                'Keep your whole collection together, then mark games as playing, completed, paused, or dropped.',
            href: library(),
            action: 'Build your library',
        },
        {
            icon: Heart,
            title: 'Know what stays with you.',
            description:
                'Rate in half stars, write your honest take, and choose four favorites to make your profile your own.',
            href: games(),
            action: 'Find your favorites',
        },
        {
            icon: BookOpen,
            title: 'Remember every chapter.',
            description:
                'Log sessions in your diary, track a first playthrough or a replay, and keep the little moments.',
            href: diary(),
            action: 'Keep a gaming diary',
        },
        {
            icon: ListOrdered,
            title: 'Curate a little universe.',
            description:
                'Collect comfort games, unforgettable stories, or your next adventures in lists that are yours to share.',
            href: auth.user ? myLists() : discoverLists(),
            action: 'Explore game lists',
        },
        {
            icon: Users,
            title: 'Find your kind of players.',
            description:
                'Discover public reviews, follow a perspective you love, and see what your circle has to say.',
            href: community(),
            action: 'Meet the community',
        },
        {
            icon: BarChart3,
            title: 'See the bigger picture.',
            description:
                'Your ratings, genres, platforms, and the time you have logged. Personal insights, kept just for you.',
            href: statistics(),
            action: 'Explore your statistics',
        },
    ];
    return (
        <>
            <Head title="Your Games. Your Stories.">
                <meta
                    name="description"
                    content="Track the games you play. Remember every journey. Discover games, rate and review your favorites, build lists, and find your people on PlayHaven."
                />
                <link
                    rel="preload"
                    as="image"
                    href="/images/home/rdr2-hero-1920.webp"
                    imageSrcSet="/images/home/rdr2-hero-960.webp 960w, /images/home/rdr2-hero-1920.webp 1920w"
                    imageSizes="(min-width: 1800px) 1800px, 100vw"
                />
            </Head>
            <div className="dark min-h-svh overflow-x-clip bg-caviar font-sans text-[#f4f1ed] selection:bg-mustang selection:text-caviar">
                <a
                    href="#home-main"
                    className="sr-only fixed top-3 left-6 z-50 rounded-md bg-[#f4f1ed] px-4 py-3 text-sm text-caviar focus:not-sr-only"
                >
                    Skip to content
                </a>
                <div className="relative isolate">
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[520px] max-w-[1800px] overflow-hidden sm:h-[600px] lg:h-[680px]"
                        aria-hidden="true"
                    >
                        <img
                            src="/images/home/rdr2-hero-1920.webp"
                            srcSet="/images/home/rdr2-hero-960.webp 960w, /images/home/rdr2-hero-1920.webp 1920w"
                            sizes="(min-width: 1800px) 1800px, 100vw"
                            alt=""
                            width="1920"
                            height="1080"
                            fetchPriority="high"
                            loading="eager"
                            className="h-full w-full object-cover object-[61%_center] sm:object-[58%_center] lg:object-center"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,1,1,0.68)_0%,rgba(1,1,1,0.08)_30%,rgba(1,1,1,0.12)_47%,rgba(1,1,1,0.7)_73%,#010101_100%)]" />
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,#010101_0%,rgba(1,1,1,0.2)_14%,transparent_35%,transparent_65%,rgba(1,1,1,0.2)_86%,#010101_100%)] opacity-45 sm:opacity-80" />
                    </div>
                    <SiteHeader />
                    <main id="home-main" tabIndex={-1}>
                        <section
                            aria-labelledby="home-title"
                            className="mx-auto max-w-4xl px-6 pt-44 pb-8 text-center sm:px-10 sm:pt-56 lg:pt-64 lg:pb-10"
                        >
                            <p className="mb-3 text-[11px] font-medium tracking-[0.12em] text-[#e0d9d3] uppercase">
                                Your Games. Your Stories.
                            </p>
                            <h1
                                id="home-title"
                                className="text-3xl leading-tight font-medium tracking-tight text-white sm:text-4xl lg:text-[2.75rem]"
                            >
                                Track the worlds you play.
                                <br className="hidden sm:block" />{' '}
                                <span className="font-normal text-[#e0d9d3]">
                                    Keep the stories they leave.
                                </span>
                            </h1>
                            <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-[#c5bfba]">
                                A home for the games you love, the ones you want
                                to play,
                                <br className="hidden sm:block" /> and the
                                people who understand why they matter.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                                <Link
                                    href={auth.user ? library() : register()}
                                    className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md bg-[#e7dfd6] px-3 py-1.5 text-xs font-medium text-[#211d1a] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                                >
                                    {auth.user
                                        ? 'Back to your library'
                                        : 'Start your story'}
                                    <ArrowRight
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </Link>
                                <Link
                                    href={games()}
                                    className="inline-flex min-h-7 items-center gap-1.5 rounded-sm py-1 text-xs text-[#e0d9d3] underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                                >
                                    Explore games
                                    <ArrowUpRight
                                        className="size-3"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </div>
                            <p className="mt-4 text-[11px] text-[#9e9690]">
                                {featuredWorld ? (
                                    <Link
                                        href={show(featuredWorld.slug)}
                                        className="rounded-sm underline-offset-4 hover:text-[#e0d9d3] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                                    >
                                        {featuredWorld.name}
                                    </Link>
                                ) : (
                                    'Red Dead Redemption 2'
                                )}
                                <span className="mx-2" aria-hidden="true">
                                    /
                                </span>
                                Rockstar Games
                            </p>
                        </section>
                        <div className="mx-auto max-w-7xl px-6 sm:px-10">
                            <div className="mx-auto max-w-4xl">
                                <section
                                    aria-labelledby="home-catalog"
                                    className="border-t border-white/10 pt-5 pb-6"
                                >
                                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                                        <h2
                                            id="home-catalog"
                                            className="text-xs font-medium tracking-[0.1em] text-[#bdb6b1] uppercase"
                                        >
                                            A few worlds to get lost in
                                        </h2>
                                        <Link
                                            href={games()}
                                            className="inline-flex min-h-7 items-center gap-1.5 rounded-sm text-[11px] text-[#bdb6b1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                                        >
                                            Explore the catalog
                                            <ArrowRight
                                                className="size-3"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </div>
                                    {featuredGames.length ? (
                                        <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-6 sm:gap-x-3">
                                            {featuredGames.map((game) => (
                                                <article
                                                    key={game.id}
                                                    className="min-w-0"
                                                >
                                                    <Link
                                                        href={show(game.slug)}
                                                        className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
                                                    >
                                                        <GameCover
                                                            game={game}
                                                            compact
                                                            hideFallbackTitle
                                                            className="aspect-[2/3] rounded-sm transition-colors group-hover:border-[#bdb6b1]"
                                                        />
                                                        <h3
                                                            title={game.name}
                                                            className="mt-1.5 line-clamp-2 min-h-8 text-xs leading-4 text-[#d5cec7] group-hover:text-white"
                                                        >
                                                            {game.name}
                                                        </h3>
                                                    </Link>
                                                    <p className="mt-1 text-[11px] text-[#a9a19b]">
                                                        {game.released_on?.slice(
                                                            0,
                                                            4,
                                                        ) ?? 'Release TBA'}
                                                    </p>
                                                </article>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-md border border-dashed border-shadow px-4 py-6 text-center text-xs leading-5 text-[#bdb6b1]">
                                            No games in the catalog yet.
                                        </div>
                                    )}
                                    <p className="mt-3 text-[11px] text-[#a9a19b]">
                                        {catalogCount.toLocaleString()}{' '}
                                        {catalogCount === 1 ? 'game' : 'games'}{' '}
                                        in the local catalog.
                                    </p>
                                </section>
                                <section
                                    aria-labelledby="home-experiences"
                                    className="border-t border-white/10 pt-5 pb-6"
                                >
                                    <div className="mb-3">
                                        <h2
                                            id="home-experiences"
                                            className="text-base leading-6 font-medium"
                                        >
                                            A life in games.{' '}
                                            <span className="text-[#bdb6b1]">
                                                A place to keep it.
                                            </span>
                                        </h2>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                                        {experiences.map(
                                            ({
                                                icon: Icon,
                                                title,
                                                description,
                                                href,
                                                action,
                                            }) => (
                                                <Link
                                                    key={title}
                                                    href={href}
                                                    className="group flex min-w-0 flex-col rounded-md border border-white/10 bg-rein/20 p-3 transition-colors hover:border-shadow hover:bg-rein/40 focus-visible:outline-2 focus-visible:outline-offset-4 sm:p-4"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <Icon
                                                            className="mt-0.5 size-4 shrink-0 text-[#bdb6b1]"
                                                            strokeWidth={1.5}
                                                            aria-hidden="true"
                                                        />
                                                        <h3 className="min-w-0 text-[13px] leading-5 font-medium wrap-break-word text-[#e0d9d3]">
                                                            {title}
                                                        </h3>
                                                    </div>
                                                    <p className="mt-2 mb-2 text-xs leading-5 text-[#a9a19b]">
                                                        {description}
                                                    </p>
                                                    <span className="mt-auto inline-flex min-h-7 items-center gap-1.5 text-[11px] text-[#c5bfba]">
                                                        {action}
                                                        <ArrowUpRight
                                                            className="size-3 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                </section>
                                <section
                                    aria-labelledby="home-next-chapter"
                                    className="border-t border-white/10 py-6 text-center sm:py-8"
                                >
                                    <p className="mb-2 text-[11px] tracking-[0.1em] text-[#9e9690] uppercase">
                                        There is always another world
                                    </p>
                                    <h2
                                        id="home-next-chapter"
                                        className="text-xl font-medium tracking-tight sm:text-2xl"
                                    >
                                        The next chapter is yours.
                                    </h2>
                                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#bdb6b1]">
                                        Keep a little more of what you play.
                                        Share a little more of what you love.
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                                        <Link
                                            href={
                                                auth.user
                                                    ? dashboard()
                                                    : register()
                                            }
                                            className="inline-flex min-h-7 items-center rounded-md border border-shadow bg-rein/40 px-2.5 py-1 text-[11px] text-[#e0d9d3] transition-colors hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-4"
                                        >
                                            {auth.user
                                                ? 'Open your haven'
                                                : 'Join PlayHaven'}
                                        </Link>
                                        <Link
                                            href={community()}
                                            className="inline-flex min-h-7 items-center rounded-sm text-[11px] text-[#bdb6b1] underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                                        >
                                            Meet the community
                                        </Link>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </main>
                </div>
                <footer className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-3 border-t border-white/10 px-6 py-6 text-[11px] leading-5 text-[#9e9690] sm:px-10">
                    <div>
                        <p className="text-[#c5bfba]">
                            PlayHaven · Your Games. Your Stories.
                        </p>
                    </div>
                    <div className="sm:text-right">
                        <p>
                            Catalog data and artwork via{' '}
                            <a
                                href="https://rawg.io"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-4 hover:text-white"
                            >
                                RAWG
                            </a>
                            .
                        </p>
                        <p>
                            Featured artwork: Red Dead Redemption 2 /{' '}
                            <a
                                href="https://www.rockstargames.com/reddeadredemption2/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-4 hover:text-white"
                            >
                                Rockstar Games
                            </a>
                            .
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
