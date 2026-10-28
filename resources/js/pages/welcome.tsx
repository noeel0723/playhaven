import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, Gamepad2, Library, Star } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';
import { index as games } from '@/routes/games';

const experiences = [
    {
        icon: Library,
        title: 'A place for your collection',
        description:
            'From the next game on your backlog to the one you always return to.',
    },
    {
        icon: BookOpen,
        title: 'Remember the journey',
        description:
            'Every playthrough has a story. Give yours a place to live.',
    },
    {
        icon: Star,
        title: 'Find your next favorite',
        description:
            'A shared love of games. A world of different perspectives.',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Your Games. Your Stories.">
                <meta
                    name="description"
                    content="PlayHaven is a home for your gaming journey. Discover games, collect your experiences, and share the stories that stay with you."
                />
            </Head>
            <div className="min-h-svh bg-caviar text-[#f4f1ed] selection:bg-mustang selection:text-caviar">
                <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-7 sm:px-10">
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-sm font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#f4f1ed]"
                        aria-label="PlayHaven home"
                    >
                        <AppLogoIcon className="size-8" />
                        <span className="text-xl">PlayHaven</span>
                    </Link>
                    <Button
                        asChild
                        variant="ghost"
                        className="text-[#f4f1ed] hover:bg-rein hover:text-white"
                    >
                        <Link href={auth.user ? dashboard() : login()}>
                            {auth.user ? 'Your account' : 'Log in'}{' '}
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                </header>
                <main className="mx-auto max-w-6xl px-6 sm:px-10">
                    <section className="grid gap-12 border-b border-shadow py-20 sm:py-28 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-20">
                        <div>
                            <p className="mb-7 flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-[#c5bfba] uppercase">
                                <Gamepad2
                                    className="size-4"
                                    aria-hidden="true"
                                />{' '}
                                A home for your gaming journey
                            </p>
                            <h1 className="text-5xl leading-[1.06] font-medium tracking-[-0.055em] sm:text-7xl lg:text-8xl">
                                Your Games.
                                <br />
                                <span className="font-serif font-normal text-[#c5bfba] italic">
                                    Your Stories.
                                </span>
                            </h1>
                            <p className="mt-8 max-w-lg text-base leading-7 text-[#bdb6b1] sm:text-lg">
                                Some games stay with you long after the credits.
                                Make a home for the worlds you explore and the
                                stories you bring back.
                            </p>
                            <Button
                                asChild
                                size="lg"
                                className="mt-10 h-12 bg-[#f4f1ed] px-6 text-caviar hover:bg-[#ded8d1]"
                            >
                                <Link
                                    href={auth.user ? dashboard() : register()}
                                >
                                    {auth.user
                                        ? 'Open your account'
                                        : 'Start your story'}{' '}
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="ghost"
                                size="lg"
                                className="mt-4 text-[#f4f1ed] hover:bg-rein hover:text-white sm:mt-10 sm:ml-3"
                            >
                                <Link href={games()}>
                                    Explore games{' '}
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </Button>
                        </div>
                        <aside
                            className="relative overflow-hidden rounded-xl border border-shadow bg-rein p-8 sm:p-10"
                            aria-label="PlayHaven introduction"
                        >
                            <span className="mb-14 block text-xs tracking-[0.2em] text-[#c5bfba] uppercase">
                                The next chapter
                            </span>
                            <Gamepad2
                                className="mb-8 size-16 stroke-1 text-[#e0d9d3]"
                                aria-hidden="true"
                            />
                            <p className="max-w-xs font-serif text-3xl leading-tight text-[#f4f1ed]">
                                Every game is a world.
                                <br />
                                Every player, a story.
                            </p>
                            <p className="mt-6 text-sm leading-6 text-[#c5bfba]">
                                We’re building a thoughtful place for people who
                                love to play.
                            </p>
                            <div
                                className="mt-10 flex gap-2"
                                aria-hidden="true"
                            >
                                {[
                                    'bg-mustang',
                                    'bg-shadow',
                                    'bg-saddle',
                                    'bg-caviar',
                                ].map((color) => (
                                    <span
                                        key={color}
                                        className={`h-1.5 flex-1 rounded-full ${color}`}
                                    />
                                ))}
                            </div>
                        </aside>
                    </section>
                    <section
                        aria-label="The PlayHaven vision"
                        className="grid gap-10 py-12 sm:py-16 md:grid-cols-3 md:gap-12"
                    >
                        {experiences.map(
                            ({ icon: Icon, title, description }) => (
                                <article key={title}>
                                    <Icon
                                        className="mb-5 size-5 text-[#c5bfba]"
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    />
                                    <h2 className="mb-3 text-base font-medium">
                                        {title}
                                    </h2>
                                    <p className="text-sm leading-6 text-[#bdb6b1]">
                                        {description}
                                    </p>
                                </article>
                            ),
                        )}
                    </section>
                </main>
                <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t border-shadow px-6 py-7 text-xs text-[#bdb6b1] sm:px-10">
                    <span>PlayHaven · Your Games. Your Stories.</span>
                    <span>Made for the love of play.</span>
                </footer>
            </div>
        </>
    );
}
