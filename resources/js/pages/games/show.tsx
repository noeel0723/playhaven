import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Star, Users } from 'lucide-react';
import GameCover from '@/components/game-cover';
import GameActionCard from '@/components/game-action-card';
import type { GameActionList } from '@/components/game-action-card';
import CommunityReviews from '@/components/community-reviews';
import GameConnections from '@/components/game-connections';

import { index } from '@/routes/games';

import type { CatalogGame } from '@/types/catalog';
import type { ConnectionState, GameConnection } from '@/types/connections';
import type { LibraryState } from '@/types/library';
import type { PersonalReview, ReviewPagination } from '@/types/reviews';

export default function GameDetails({
    game,
    libraryEntry,
    personalRating,
    personalReview,
    reviews,
    connections,
    connectionState,
    availableLists = [],
}: {
    game: CatalogGame;
    libraryEntry: LibraryState | null;
    personalRating: number | null;
    personalReview: PersonalReview | null;
    reviews: ReviewPagination;
    connections: GameConnection[];
    connectionState: ConnectionState;
    availableLists?: GameActionList[];
}) {
    const release = game.released_on
        ? new Intl.DateTimeFormat('en', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'UTC',
          }).format(new Date(`${game.released_on}T00:00:00Z`))
        : 'To be announced';
    return (
        <>
            <Head title={game.name}>
                <meta
                    name="description"
                    content={
                        game.summary?.slice(0, 160) ||
                        `Discover ${game.name} on PlayHaven.`
                    }
                />
            </Head>
            <Link
                href={index()}
                className="mb-5 inline-flex min-h-7 items-center gap-1.5 rounded-sm text-xs text-[#d5cec7] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                All games
            </Link>
            <article className="grid items-start gap-8 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_260px] xl:grid-cols-[240px_minmax(0,1fr)_280px] xl:gap-10">
                <aside className="md:row-span-2">
                    <GameCover
                        key={game.id}
                        game={game}
                        className="mx-auto w-full max-w-64 md:max-w-none"
                    />
                    <p className="mt-4 text-center text-xs text-[#bdb6b1]">
                        {game.released_on?.slice(0, 4) ?? 'Release TBA'}
                    </p>
                </aside>
                <div className="min-w-0 md:col-start-2 lg:col-start-2">
                    <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                        A world to explore
                    </p>
                    <h1 className="max-w-3xl text-4xl leading-tight font-medium tracking-tight sm:text-5xl lg:text-6xl">
                        {game.name}
                    </h1>
                    <p className="mt-4 text-sm leading-7 text-[#bdb6b1]">
                        {game.developers?.length ? (
                            <>
                                Developed by{' '}
                                {game.developers.map((developer, position) => (
                                    <span key={developer.id}>
                                        {position > 0 && ', '}
                                        <Link
                                            href={index({
                                                query: {
                                                    developer: developer.slug,
                                                },
                                            })}
                                            className="wrap-break-word text-[#e0d9d3] underline decoration-shadow underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4"
                                        >
                                            {developer.name}
                                        </Link>
                                    </span>
                                ))}
                            </>
                        ) : (
                            'Developer not listed yet'
                        )}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                        {game.genres.map((genre) => (
                            <Link
                                key={genre.id}
                                href={index({ query: { genre: genre.slug } })}
                                className="rounded-full border border-shadow px-3 py-1.5 text-xs text-[#d5cec7] hover:bg-rein focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                {genre.name}
                            </Link>
                        ))}
                    </div>
                    <div className="my-9 flex flex-wrap gap-x-10 gap-y-5 border-y border-white/10 py-6">
                        <div>
                            <p className="mb-2 text-xs text-[#bdb6b1]">
                                Community rating
                            </p>
                            <p className="flex items-center gap-2 text-xl">
                                <Star
                                    className="size-5 text-[#c5bfba]"
                                    fill={
                                        game.rating !== null
                                            ? 'currentColor'
                                            : 'none'
                                    }
                                    aria-hidden="true"
                                />
                                {game.rating !== null
                                    ? `${game.rating.toFixed(1)} / 5`
                                    : 'Not rated yet'}
                            </p>
                            <p className="mt-1 text-xs text-[#bdb6b1]">
                                {game.ratings_count}{' '}
                                {game.ratings_count === 1
                                    ? 'rating'
                                    : 'ratings'}{' '}
                                on PlayHaven
                            </p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs text-[#bdb6b1]">
                                In player collections
                            </p>
                            <p className="flex items-center gap-2 text-xl">
                                <Users
                                    className="size-5 text-[#c5bfba]"
                                    aria-hidden="true"
                                />
                                {game.players_count.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
                <aside className="min-w-0 self-start md:col-start-2 lg:sticky lg:top-6 lg:col-start-3 lg:row-span-2 lg:row-start-1">
                    <GameActionCard
                        game={game}
                        entry={libraryEntry}
                        rating={personalRating}
                        review={personalReview}
                        availableLists={availableLists}
                    />
                </aside>
                <div className="min-w-0 md:col-start-2 lg:col-start-2 lg:row-start-2">
                    <section aria-labelledby="about-game">
                        <h2
                            id="about-game"
                            className="mb-4 font-serif text-3xl"
                        >
                            About the game
                        </h2>
                        <p className="max-w-3xl text-sm leading-7 whitespace-pre-line text-[#c5bfba]">
                            {game.summary ||
                                'A description is not available for this game yet.'}
                        </p>
                    </section>
                    {game.storyline && (
                        <section
                            aria-labelledby="game-storyline"
                            className="mt-9"
                        >
                            <details className="rounded-lg border border-shadow p-5">
                                <summary
                                    id="game-storyline"
                                    className="cursor-pointer text-sm font-medium"
                                >
                                    Storyline · may contain spoilers
                                </summary>
                                <p className="mt-4 text-sm leading-7 whitespace-pre-line text-[#c5bfba]">
                                    {game.storyline}
                                </p>
                            </details>
                        </section>
                    )}
                    <dl className="mt-10 grid gap-8 border-t border-white/10 pt-7 sm:grid-cols-2">
                        <div>
                            <dt className="mb-3 text-xs text-[#bdb6b1]">
                                Publisher
                            </dt>
                            <dd className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                                {game.publishers?.length
                                    ? game.publishers.map((publisher) => (
                                          <Link
                                              key={publisher.id}
                                              href={index({
                                                  query: {
                                                      publisher: publisher.slug,
                                                  },
                                              })}
                                              className="wrap-break-word underline decoration-shadow underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4"
                                          >
                                              {publisher.name}
                                          </Link>
                                      ))
                                    : 'Not specified'}
                            </dd>
                        </div>
                        <div>
                            <dt className="mb-3 text-xs text-[#bdb6b1]">
                                Official website
                            </dt>
                            <dd className="text-sm">
                                {game.official_website ? (
                                    <a
                                        href={game.official_website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-sm underline decoration-shadow underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4"
                                    >
                                        Visit website
                                        <ExternalLink
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span className="sr-only">
                                            {' '}
                                            (opens in a new tab)
                                        </span>
                                    </a>
                                ) : (
                                    'Not available'
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt className="mb-3 text-xs text-[#bdb6b1]">
                                First release
                            </dt>
                            <dd className="text-sm">{release}</dd>
                        </div>
                        <div>
                            <dt className="mb-3 text-xs text-[#bdb6b1]">
                                Platforms
                            </dt>
                            <dd className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                                {game.platforms.length > 0
                                    ? game.platforms.map((platform) => (
                                          <Link
                                              key={platform.id}
                                              href={index({
                                                  query: {
                                                      platform: platform.slug,
                                                  },
                                              })}
                                              className="underline decoration-shadow underline-offset-4 hover:decoration-white"
                                          >
                                              {platform.name}
                                          </Link>
                                      ))
                                    : 'Not specified'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </article>
            <div className="mt-12">
                <GameConnections
                    key={game.id}
                    gameSlug={game.slug}
                    connections={connections}
                    state={connectionState}
                    reviewsPage={reviews.meta.current_page}
                />
                <CommunityReviews reviews={reviews} />
            </div>
        </>
    );
}
