import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Star, Users } from 'lucide-react';
import GameCover from '@/components/game-cover';
import CommunityReviews from '@/components/community-reviews';
import LibraryEditor from '@/components/library-editor';
import RatingEditor from '@/components/rating-editor';
import ReviewEditor from '@/components/review-editor';
import { index } from '@/routes/games';
import type { CatalogGame } from '@/types/catalog';
import type { LibraryState } from '@/types/library';
import type { PersonalReview, ReviewPagination } from '@/types/reviews';

export default function GameDetails({
    game,
    libraryEntry,
    personalRating,
    personalReview,
    reviews,
}: {
    game: CatalogGame;
    libraryEntry: LibraryState | null;
    personalRating: number | null;
    personalReview: PersonalReview | null;
    reviews: ReviewPagination;
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
                className="mb-10 inline-flex items-center gap-2 rounded-sm text-sm text-[#bdb6b1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                All games
            </Link>
            <article className="grid gap-10 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] lg:gap-16">
                <aside>
                    <GameCover
                        key={game.id}
                        game={game}
                        className="mx-auto w-full max-w-64 md:max-w-none"
                    />
                    <p className="mt-4 text-center text-xs text-[#bdb6b1]">
                        {game.released_on?.slice(0, 4) ?? 'Release TBA'}
                    </p>
                </aside>
                <div className="min-w-0">
                    <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                        A world to explore
                    </p>
                    <h1 className="max-w-3xl text-4xl leading-tight font-medium tracking-tight sm:text-5xl lg:text-6xl">
                        {game.name}
                    </h1>
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
                    <LibraryEditor
                        key={`${game.id}:${libraryEntry?.status}:${libraryEntry?.is_favorite}`}
                        gameSlug={game.slug}
                        gameName={game.name}
                        entry={libraryEntry}
                    />
                    {libraryEntry && (
                        <>
                            <RatingEditor
                                key={`${game.id}:rating:${personalRating}`}
                                gameSlug={game.slug}
                                rating={personalRating}
                            />
                        </>
                    )}
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
                    {libraryEntry && (
                        <ReviewEditor
                            key={`${game.id}:review:${personalReview?.id}:${personalReview?.updated_at}`}
                            gameSlug={game.slug}
                            review={personalReview}
                        />
                    )}
                    <CommunityReviews reviews={reviews} />
                </div>
            </article>
        </>
    );
}
