import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, LockKeyhole, Globe } from 'lucide-react';
import { useState } from 'react';
import GameCover from '@/components/game-cover';
import PlayerAvatar from '@/components/player-avatar';
import PlayerPageNavigation from '@/components/player-page-navigation';
import StarRating from '@/components/star-rating';
import {
    StatColumns,
    StatMetricTabs,
    StatRows,
    StatSection,
} from '@/components/statistics-charts';
import { dashboard } from '@/routes';
import { sessions as diarySessions, index as diary } from '@/routes/diary';
import { index as games, show as gameDetails } from '@/routes/games';
import { index as library } from '@/routes/library';
import { me as profile } from '@/routes/players';
import {
    show as playerProfile,
    diary as playerDiary,
    stats as playerStats,
} from '@/routes/players';
import type { PlayerPageContext } from '@/types/community';
import { index } from '@/routes/stats';
import { formatMinutes } from '@/types/history';
import { libraryStatuses } from '@/types/library';
import type { PlayerStatistics } from '@/types/statistics';

const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
const linkClass =
    'inline-flex min-h-7 items-center gap-1.5 rounded-sm text-[11px] text-[#bdb6b1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2';

export default function Statistics({
    stats,
    playerPage,
    sharedOnProfile = false,
}: {
    stats: PlayerStatistics;
    playerPage?: PlayerPageContext;
    sharedOnProfile?: boolean;
}) {
    const { auth } = usePage().props;
    const publicView = Boolean(playerPage);
    const owner = playerPage?.owner ?? {
        name: auth.user.name,
        avatar_url: auth.user.avatar ?? null,
        username: null,
    };
    const profileUrl = playerPage
        ? playerProfile.url(owner.username!)
        : profile.url();
    const diaryUrl = playerPage
        ? playerDiary.url(owner.username!)
        : diary.url();
    const statisticsUrl = playerPage
        ? playerStats.url(owner.username!)
        : index.url();
    const [releaseMetric, setReleaseMetric] = useState<'games' | 'ratings'>(
        'games',
    );
    const [diaryMetric, setDiaryMetric] = useState<
        'logs' | 'minutes' | 'sessions'
    >('logs');
    const [loadingYear, setLoadingYear] = useState(false);
    // Keep calendar gaps visible without constructing an unbounded timeline for malformed catalog dates.
    const firstYear = stats.release_years[0]?.year;
    const lastYear = stats.release_years.at(-1)?.year;
    const releaseYears =
        firstYear !== undefined &&
        lastYear !== undefined &&
        lastYear - firstYear <= 120
            ? Array.from(
                  { length: lastYear - firstYear + 1 },
                  (_, offset) =>
                      stats.release_years.find(
                          (item) => item.year === firstYear + offset,
                      ) ?? {
                          year: firstYear + offset,
                          games: 0,
                          ratings_count: 0,
                          average: null,
                      },
              )
            : stats.release_years;
    const overview = [
        { label: 'Games', value: stats.library.total.toLocaleString() },
        {
            label: 'Completed',
            value: stats.library.statuses.completed.toLocaleString(),
        },
        {
            label: 'Recorded hours',
            value: (stats.diary.minutes / 60).toLocaleString(undefined, {
                maximumFractionDigits: 1,
            }),
        },
        {
            label: 'Developers',
            value: stats.developers_count.toLocaleString(),
        },
        { label: 'Diary logs', value: stats.diary.logs.toLocaleString() },
        {
            label: 'Average rating',
            value:
                stats.ratings.average === null
                    ? '—'
                    : `${stats.ratings.average.toFixed(1)} / 5`,
        },
    ];
    return (
        <div className="mx-auto max-w-4xl space-y-7 font-sans sm:space-y-9">
            <Head
                title={publicView ? `Statistic · ${owner.name}` : 'Statistic'}
            >
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            {playerPage && (
                <PlayerPageNavigation
                    context={playerPage}
                    current="stats"
                    showIdentity={false}
                />
            )}
            <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <Link
                        href={publicView ? profileUrl : dashboard()}
                        className={linkClass}
                    >
                        <ArrowLeft className="size-3" aria-hidden="true" />{' '}
                        {publicView ? 'Profile' : 'Your haven'}
                    </Link>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-[#a9a19b]">
                        {publicView || sharedOnProfile ? (
                            <Globe className="size-3" aria-hidden="true" />
                        ) : (
                            <LockKeyhole
                                className="size-3"
                                aria-hidden="true"
                            />
                        )}{' '}
                        {publicView
                            ? 'Public profile statistics'
                            : sharedOnProfile
                              ? 'Shared on your public profile'
                              : 'Only visible to you'}
                    </span>
                </div>
                <header className="relative isolate overflow-hidden border-y border-white/10 bg-rein/10 px-4 py-7 text-center sm:py-9">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(213,206,199,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(213,206,199,0.035)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black,transparent)] bg-size-[48px_48px]"
                    />
                    <p className="mb-2 text-[10px] tracking-[0.12em] text-[#a9a19b] uppercase">
                        All-time overview
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-[#f4f1ed] sm:text-4xl">
                        Statistics
                    </h1>
                    <Link
                        href={profileUrl}
                        className="mx-auto mt-3 flex w-fit max-w-full items-center gap-2 rounded-sm text-xs text-[#bdb6b1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                        <PlayerAvatar
                            name={owner.name}
                            src={owner.avatar_url}
                            className="size-7 shrink-0"
                        />
                        <span className="truncate">{owner.name}</span>
                    </Link>
                </header>
                <section
                    aria-label="All-time overview"
                    className="border-b border-white/10 py-5"
                >
                    <dl className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-6">
                        {overview.map((item) => (
                            <div
                                key={item.label}
                                className="flex min-w-0 flex-col text-center"
                            >
                                <dt className="order-2 mt-1.5 text-[10px] leading-4 text-[#a9a19b]">
                                    {item.label}
                                </dt>
                                <dd className="mt-1 text-xl leading-7 font-semibold wrap-break-word text-[#e0d9d3] tabular-nums sm:text-2xl">
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-4 text-center text-[10px] text-[#a9a19b]">
                        {stats.library.favorites.toLocaleString()} favorites ·{' '}
                        {stats.library.completed_percent}% completed ·{' '}
                        {stats.ratings.total.toLocaleString()} rated
                    </p>
                </section>
            </div>

            {stats.library.total === 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-white/15 p-3">
                    <p className="text-xs text-[#bdb6b1]">
                        {publicView
                            ? 'No library games to show yet.'
                            : 'Add games to your library to start your statistics.'}
                    </p>
                    <Link href={games()} className={linkClass}>
                        Discover games{' '}
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                    </Link>
                </div>
            )}

            <StatSection
                id="release-years"
                title="By release year"
                controls={
                    <StatMetricTabs
                        label="Release-year metric"
                        value={releaseMetric}
                        onChange={setReleaseMetric}
                        options={[
                            { value: 'games', label: 'Games' },
                            { value: 'ratings', label: 'Ratings' },
                        ]}
                    />
                }
                detail={`Games in ${publicView ? 'this library' : 'your current library'}, grouped by release year.${stats.undated_games ? ` ${stats.undated_games} without a release date.` : ''}`}
            >
                {releaseYears.length ? (
                    <StatColumns
                        label={
                            releaseMetric === 'games'
                                ? 'Library games by release year'
                                : 'Personal average rating by release year'
                        }
                        max={releaseMetric === 'ratings' ? 5 : undefined}
                        color={
                            releaseMetric === 'ratings' ? '#c4cbbd' : '#b8a795'
                        }
                        data={releaseYears.map((item) => ({
                            label: String(item.year),
                            value:
                                releaseMetric === 'games'
                                    ? item.games
                                    : item.average,
                            description:
                                releaseMetric === 'games'
                                    ? `${item.year}: ${item.games} ${item.games === 1 ? 'game' : 'games'}`
                                    : `${item.year}: ${item.average === null ? 'Not rated' : `${item.average.toFixed(1)} / 5 from ${item.ratings_count} ratings`}`,
                        }))}
                    />
                ) : (
                    <p className="py-6 text-center text-xs text-[#a9a19b]">
                        Release-year insights appear when library games have
                        release dates.
                    </p>
                )}
            </StatSection>

            <StatSection
                id="highest-rated"
                title={publicView ? 'Highest rated' : 'Your highest rated'}
                controls={
                    <Link
                        href={publicView ? diaryUrl : library()}
                        className={linkClass}
                    >
                        {publicView ? 'Diary' : 'Library'}{' '}
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                    </Link>
                }
                detail="Current personal ratings, one per game."
            >
                {stats.highest_rated.length ? (
                    <ol className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-6 sm:gap-x-3">
                        {stats.highest_rated.map((game) => (
                            <li key={game.id} className="min-w-0">
                                <Link
                                    href={gameDetails(game.slug)}
                                    className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                                >
                                    <GameCover
                                        game={game}
                                        compact
                                        hideFallbackTitle
                                        className="aspect-[2/3] rounded-sm group-hover:border-[#bdb6b1]"
                                    />
                                    <h3
                                        className="mt-1.5 line-clamp-2 min-h-8 text-xs leading-4 text-[#d5cec7] group-hover:underline"
                                        title={game.name}
                                    >
                                        {game.name}
                                    </h3>
                                    <span className="mt-1 flex items-center gap-1 text-[10px] text-[#bdb6b1]">
                                        <StarRating
                                            value={game.rating}
                                            compact
                                        />
                                        <span aria-hidden="true">
                                            {game.rating.toFixed(1)}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="py-4 text-xs text-[#a9a19b]">
                        {publicView
                            ? 'No rated games to show yet.'
                            : 'Rate a game to add it to this shelf.'}
                    </p>
                )}
            </StatSection>

            <StatSection
                id="gaming-preferences"
                title="Genres, developers & platforms"
                detail="Genres and developers count games with a playing status. Platforms use the choices recorded on your playthroughs."
            >
                <div className="grid min-w-0 grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-5">
                    <div className="min-w-0">
                        <h3 className="mb-3 text-[11px] text-[#a9a19b]">
                            Genres
                        </h3>
                        <StatRows
                            empty="No played genres yet."
                            rows={stats.genres.map((item) => ({
                                key: item.id,
                                name: item.name,
                                value: item.games,
                                detail: `${item.games} games`,
                                href: games.url({
                                    query: { genre: item.slug },
                                }),
                            }))}
                        />
                    </div>
                    <div className="min-w-0">
                        <h3 className="mb-3 text-[11px] text-[#a9a19b]">
                            Developers
                        </h3>
                        <StatRows
                            empty="No developer credits for played games yet."
                            color="#c4cbbd"
                            rows={stats.developers.map((item) => ({
                                key: item.id,
                                name: item.name,
                                value: item.games,
                                detail: `${item.games} games`,
                                href: games.url({
                                    query: { developer: item.slug },
                                }),
                            }))}
                        />
                    </div>
                    <div className="min-w-0">
                        <h3 className="mb-3 text-[11px] text-[#a9a19b]">
                            Platforms
                        </h3>
                        <StatRows
                            empty="Choose a platform on a playthrough to start this chart."
                            color="#a7b5c1"
                            rows={stats.platforms.map((item) => ({
                                key: item.id,
                                name: item.name,
                                value: item.playthroughs,
                                detail: `${item.playthroughs} runs`,
                            }))}
                        />
                        <p className="mt-2 text-[10px] leading-4 text-[#a9a19b]">
                            {stats.playthroughs} playthroughs ·{' '}
                            {stats.unspecified_platform_runs} without a platform
                        </p>
                    </div>
                </div>
            </StatSection>

            <div className="grid items-start gap-7 md:grid-cols-2 md:gap-8">
                <StatSection
                    id="library-status"
                    title="Library status"
                    detail={`${stats.library.total} games · including games without a status`}
                >
                    <StatRows
                        empty="No library games yet."
                        rows={[
                            ...libraryStatuses.map((status) => ({
                                key: status.value,
                                name: status.label,
                                value: stats.library.statuses[status.value],
                                detail: String(
                                    stats.library.statuses[status.value],
                                ),
                                href: publicView
                                    ? undefined
                                    : library.url({
                                          query: { status: status.value },
                                      }),
                            })),
                            {
                                key: 'unassigned',
                                name: 'No status',
                                value:
                                    stats.library.total -
                                    Object.values(
                                        stats.library.statuses,
                                    ).reduce((sum, count) => sum + count, 0),
                                detail: String(
                                    stats.library.total -
                                        Object.values(
                                            stats.library.statuses,
                                        ).reduce(
                                            (sum, count) => sum + count,
                                            0,
                                        ),
                                ),
                            },
                        ]}
                    />
                </StatSection>
                <StatSection
                    id="rating-distribution"
                    title="Ratings"
                    detail={`${stats.ratings.total} current ratings · half-star increments`}
                >
                    <StatColumns
                        label="Personal rating distribution"
                        color="#c4cbbd"
                        data={stats.ratings.distribution.map((item) => ({
                            label: String(item.stars),
                            value: item.count,
                            description: `${item.stars} stars: ${item.count} ${item.count === 1 ? 'game' : 'games'}`,
                        }))}
                    />
                </StatSection>
            </div>

            <StatSection
                id="diary-activity"
                title="Diary activity"
                controls={
                    <div className="flex flex-wrap items-center gap-2">
                        <StatMetricTabs
                            label="Diary chart metric"
                            value={diaryMetric}
                            onChange={setDiaryMetric}
                            options={[
                                { value: 'logs', label: 'Logs' },
                                { value: 'minutes', label: 'Hours' },
                                { value: 'sessions', label: 'Sessions' },
                            ]}
                        />
                        <select
                            aria-label="Diary year"
                            disabled={loadingYear}
                            value={stats.activity.year}
                            onChange={(event) =>
                                router.get(
                                    statisticsUrl,
                                    { year: Number(event.target.value) },
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                        onStart: () => setLoadingYear(true),
                                        onFinish: () => setLoadingYear(false),
                                    },
                                )
                            }
                            className="h-7 rounded border border-white/15 bg-[#211f1f] px-2 font-sans text-[11px] text-[#d5cec7] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                        >
                            {stats.activity.available_years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                }
                detail="The year filter applies to diary activity only. Recorded hours come from timed sessions, not game status logs."
            >
                <dl className="mb-4 grid grid-cols-3 gap-3 text-center">
                    {[
                        { label: 'Diary logs', value: stats.activity.logs },
                        {
                            label: 'Recorded time',
                            value: formatMinutes(stats.activity.minutes),
                        },
                        {
                            label: 'Session days',
                            value: stats.activity.active_days,
                        },
                    ].map((item) => (
                        <div key={item.label}>
                            <dt className="min-h-8 text-[10px] leading-4 text-[#a9a19b] sm:min-h-4">
                                {item.label} · {stats.activity.year}
                            </dt>
                            <dd className="mt-1 text-lg font-medium text-[#d5cec7] tabular-nums">
                                {item.value}
                            </dd>
                        </div>
                    ))}
                </dl>
                <StatColumns
                    label={`${stats.activity.year} monthly ${diaryMetric === 'minutes' ? 'recorded hours' : diaryMetric}`}
                    color="#a7b5c1"
                    data={stats.activity.months.map((item) => ({
                        label: months[item.month - 1],
                        value: item[diaryMetric],
                        description: `${months[item.month - 1]} ${stats.activity.year}: ${diaryMetric === 'minutes' ? formatMinutes(item.minutes) : `${item[diaryMetric]} ${diaryMetric}`}`,
                    }))}
                />
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-[#a9a19b]">
                    <span>
                        {stats.activity.sessions -
                            stats.activity.timed_sessions}{' '}
                        sessions without a duration
                    </span>
                    <Link
                        href={diaryUrl}
                        className="rounded-sm underline-offset-4 hover:text-white hover:underline focus-visible:outline-2"
                    >
                        Open diary
                    </Link>
                </div>
            </StatSection>

            <StatSection
                id="most-played"
                title="Most played"
                controls={
                    <Link
                        href={publicView ? diaryUrl : diarySessions()}
                        className={linkClass}
                    >
                        {publicView ? 'Diary' : 'Sessions'}{' '}
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                    </Link>
                }
                detail="All recorded session time, combined across playthroughs. Unknown durations are excluded."
            >
                <StatRows
                    empty={
                        publicView
                            ? 'No recorded session durations yet.'
                            : 'Add a duration to a diary session to see your most played games.'
                    }
                    rows={stats.most_played.map((game) => ({
                        key: game.id,
                        name: game.name,
                        value: game.minutes,
                        detail: formatMinutes(game.minutes),
                        href: gameDetails.url(game.slug),
                    }))}
                />
            </StatSection>
        </div>
    );
}
