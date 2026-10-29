import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, LockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import { index as diary } from '@/routes/diary';
import { index as games, show as gameDetails } from '@/routes/games';
import { index as library } from '@/routes/library';
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

function SectionTitle({
    id,
    children,
    detail,
}: {
    id: string;
    children: ReactNode;
    detail?: string;
}) {
    return (
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-shadow pb-4">
            <h2 id={id} className="font-serif text-2xl sm:text-3xl">
                {children}
            </h2>
            {detail && <p className="text-xs text-[#bdb6b1]">{detail}</p>}
        </div>
    );
}

export default function Statistics({ stats }: { stats: PlayerStatistics }) {
    const ratingMax = Math.max(
        1,
        ...stats.ratings.distribution.map((rating) => rating.count),
    );
    const monthMax = Math.max(
        1,
        ...stats.activity.months.map((month) => month.minutes),
    );
    const genreMax = Math.max(1, ...stats.genres.map((genre) => genre.games));
    const platformMax = Math.max(
        1,
        ...stats.platforms.map((platform) => platform.playthroughs),
    );
    return (
        <>
            <Head title="Your statistics">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <Link
                href={dashboard()}
                className="mb-8 inline-flex items-center gap-2 rounded-sm text-sm text-[#bdb6b1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Your haven
            </Link>
            <header className="mb-10">
                <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                    Every world leaves a mark
                </p>
                <h1 className="max-w-4xl text-4xl leading-tight font-medium tracking-tight sm:text-6xl">
                    Your gaming,
                    <br />
                    <span className="font-serif font-normal text-[#c5bfba] italic">
                        in perspective.
                    </span>
                </h1>
                <p className="mt-6 max-w-2xl text-sm leading-7 text-[#bdb6b1]">
                    The games you collect, the ratings you give, and the time
                    you choose to remember. Built from your library and diary.
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-xs text-[#bdb6b1]">
                    <LockKeyhole className="size-3.5" aria-hidden="true" />
                    Only you can see these statistics.
                </p>
            </header>
            {stats.library.total === 0 && (
                <div className="mb-9 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-dashed border-shadow p-6">
                    <p className="max-w-xl text-sm leading-7 text-[#bdb6b1]">
                        Your story starts with a game. Add one to your library,
                        then log a session or leave a rating to build your
                        picture.
                    </p>
                    <Button asChild>
                        <Link href={games()}>
                            Find your first game
                            <ArrowUpRight aria-hidden="true" />
                        </Link>
                    </Button>
                </div>
            )}
            <section
                aria-label="All-time overview"
                className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                {[
                    {
                        label: 'Games on your shelf',
                        value: stats.library.total.toLocaleString(),
                        detail: `${stats.library.favorites} marked as favorites`,
                    },
                    {
                        label: 'Currently completed',
                        value: stats.library.statuses.completed.toLocaleString(),
                        detail: `${stats.library.completed_percent}% of your current library`,
                    },
                    {
                        label: 'Time in your diary',
                        value: formatMinutes(stats.diary.minutes),
                        detail: `${stats.diary.timed_sessions} of ${stats.diary.sessions} sessions with recorded time`,
                    },
                    {
                        label: 'Your average rating',
                        value:
                            stats.ratings.average !== null
                                ? `${stats.ratings.average.toFixed(1)} / 5`
                                : '—',
                        detail: stats.ratings.total
                            ? `Across ${stats.ratings.total} current ratings`
                            : 'No ratings yet',
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="min-w-0 rounded-xl border border-shadow bg-rein/20 p-5 sm:p-6"
                    >
                        <h2 className="text-xs text-[#bdb6b1]">{item.label}</h2>
                        <p className="mt-4 font-serif text-3xl wrap-break-word tabular-nums sm:text-4xl">
                            {item.value}
                        </p>
                        <p className="mt-3 text-xs leading-6 text-[#bdb6b1]">
                            {item.detail}
                        </p>
                    </div>
                ))}
            </section>
            <div className="grid items-start gap-12 lg:grid-cols-2">
                <section aria-labelledby="collection-shape">
                    <SectionTitle
                        id="collection-shape"
                        detail="Current library · all time"
                    >
                        The shape of your shelf
                    </SectionTitle>
                    <div className="space-y-1">
                        {libraryStatuses.map((status) => (
                            <Link
                                key={status.value}
                                href={library({
                                    query: { status: status.value },
                                })}
                                className="group grid grid-cols-[100px_minmax(0,1fr)_36px] items-center gap-3 rounded-sm py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                            >
                                <span className="text-[#c5bfba] group-hover:text-white">
                                    {status.label}
                                </span>
                                <span
                                    className="h-1.5 overflow-hidden rounded-full bg-rein/50"
                                    aria-hidden="true"
                                >
                                    <span
                                        className="block h-full rounded-full bg-[#c5bfba]"
                                        style={{
                                            width: `${stats.library.total ? (stats.library.statuses[status.value] / stats.library.total) * 100 : 0}%`,
                                        }}
                                    />
                                </span>
                                <span className="text-right tabular-nums">
                                    {stats.library.statuses[status.value]}
                                </span>
                            </Link>
                        ))}
                    </div>
                    <p className="mt-4 text-xs leading-6 text-[#bdb6b1]">
                        One game, one current status. Replays are tracked
                        separately in your {stats.playthroughs} playthroughs.
                    </p>
                </section>
                <section aria-labelledby="rating-signature">
                    <SectionTitle
                        id="rating-signature"
                        detail={`${stats.ratings.total} current ratings`}
                    >
                        Your rating signature
                    </SectionTitle>
                    <figure aria-labelledby="rating-signature">
                        <ol className="grid grid-cols-10 gap-1.5 pt-4 sm:gap-3">
                            {stats.ratings.distribution.map((rating) => (
                                <li
                                    key={rating.stars}
                                    aria-label={`${rating.stars} stars: ${rating.count} ratings`}
                                    className="min-w-0 text-center"
                                >
                                    <span
                                        className="mb-2 block text-[10px] text-[#bdb6b1] tabular-nums sm:text-xs"
                                        aria-hidden="true"
                                    >
                                        {rating.count}
                                    </span>
                                    <div
                                        className="flex h-32 items-end rounded-t-sm bg-rein/20"
                                        aria-hidden="true"
                                    >
                                        <div
                                            className="w-full rounded-t-sm bg-[#c5bfba]"
                                            style={{
                                                height: `${(rating.count / ratingMax) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span
                                        className="mt-3 block text-[10px] text-[#c5bfba] sm:text-xs"
                                        aria-hidden="true"
                                    >
                                        {rating.stars}
                                    </span>
                                </li>
                            ))}
                        </ol>
                        <figcaption className="mt-5 text-xs leading-6 text-[#bdb6b1]">
                            Half-star scores from 0.5 to 5. One current rating
                            per game; replays do not add extra votes.
                        </figcaption>
                    </figure>
                </section>
            </div>
            <section
                aria-labelledby="diary-activity"
                className="mt-12 rounded-xl border border-shadow bg-rein/10 p-5 sm:p-7"
            >
                <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <h2 id="diary-activity" className="font-serif text-3xl">
                            A year in play
                        </h2>
                        <p className="mt-3 text-xs leading-6 text-[#bdb6b1]">
                            {stats.activity.year} diary activity · library and
                            rating summaries above remain all time.
                        </p>
                    </div>
                    <Form
                        action={index()}
                        method="get"
                        key={stats.activity.year}
                        options={{ preserveScroll: true }}
                    >
                        {({ processing, errors }) => (
                            <>
                                <Label
                                    htmlFor="activity-year"
                                    className="mb-2 text-xs"
                                >
                                    Diary year
                                </Label>
                                <div className="flex gap-2">
                                    <select
                                        id="activity-year"
                                        name="year"
                                        defaultValue={stats.activity.year}
                                        className="h-9 rounded-md border border-shadow bg-rein px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                                    >
                                        {stats.activity.available_years.map(
                                            (year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Loading…' : 'Apply year'}
                                    </Button>
                                </div>
                                {errors.year && (
                                    <p
                                        role="alert"
                                        className="mt-2 text-sm text-red-300"
                                    >
                                        {errors.year}
                                    </p>
                                )}
                            </>
                        )}
                    </Form>
                </div>
                <dl className="mb-8 grid grid-cols-3 gap-3 border-y border-white/10 py-5">
                    {[
                        {
                            label: 'Logged time',
                            value: formatMinutes(stats.activity.minutes),
                        },
                        {
                            label: 'Sessions',
                            value: stats.activity.sessions.toLocaleString(),
                        },
                        {
                            label: 'Active days',
                            value: stats.activity.active_days.toLocaleString(),
                        },
                    ].map((item) => (
                        <div key={item.label} className="min-w-0">
                            <dt className="text-[11px] text-[#bdb6b1] sm:text-xs">
                                {item.label}
                            </dt>
                            <dd className="mt-2 font-serif text-xl wrap-break-word tabular-nums sm:text-3xl">
                                {item.value}
                            </dd>
                        </div>
                    ))}
                </dl>
                <figure aria-labelledby="diary-activity">
                    <ol className="grid grid-cols-12 gap-1 sm:gap-3">
                        {stats.activity.months.map((month) => (
                            <li
                                key={month.month}
                                title={`${months[month.month - 1]}: ${formatMinutes(month.minutes)}, ${month.sessions} sessions, ${month.active_days} active days`}
                                aria-label={`${months[month.month - 1]}: ${formatMinutes(month.minutes)} recorded, ${month.sessions} sessions, ${month.active_days} active days`}
                                className="min-w-0 text-center"
                            >
                                <div
                                    className="flex h-40 items-end rounded-t-sm bg-rein/25"
                                    aria-hidden="true"
                                >
                                    <div
                                        className="w-full rounded-t-sm bg-[#a8a09a]"
                                        style={{
                                            height: `${(month.minutes / monthMax) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span
                                    className="mt-3 block text-[9px] text-[#bdb6b1] sm:text-xs"
                                    aria-hidden="true"
                                >
                                    {months[month.month - 1]}
                                </span>
                            </li>
                        ))}
                    </ol>
                    <figcaption className="mt-5 text-xs leading-6 text-[#bdb6b1]">
                        Bars show recorded diary minutes by month.{' '}
                        {stats.activity.sessions -
                            stats.activity.timed_sessions}{' '}
                        sessions have no recorded duration. A day with multiple
                        sessions counts as one active day.
                    </figcaption>
                </figure>
                {stats.activity.sessions === 0 && (
                    <p className="mt-4 text-sm leading-7 text-[#c5bfba]">
                        No diary sessions for this year yet.{' '}
                        <Link
                            href={diary()}
                            className="underline underline-offset-4"
                        >
                            Open your diary
                        </Link>{' '}
                        to start recording.
                    </p>
                )}
                <details className="mt-6 border-t border-shadow pt-4">
                    <summary className="w-fit cursor-pointer rounded-sm text-xs text-[#c5bfba] focus-visible:outline-2 focus-visible:outline-offset-4">
                        View monthly data table
                    </summary>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <caption className="sr-only">
                                Monthly diary activity for {stats.activity.year}
                            </caption>
                            <thead className="text-[#bdb6b1]">
                                <tr>
                                    <th
                                        scope="col"
                                        className="py-3 pr-4 font-normal"
                                    >
                                        Month
                                    </th>
                                    <th
                                        scope="col"
                                        className="py-3 pr-4 font-normal"
                                    >
                                        Logged time
                                    </th>
                                    <th
                                        scope="col"
                                        className="py-3 pr-4 font-normal"
                                    >
                                        Sessions
                                    </th>
                                    <th
                                        scope="col"
                                        className="py-3 font-normal"
                                    >
                                        Active days
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.activity.months.map((month) => (
                                    <tr
                                        key={month.month}
                                        className="border-t border-white/10"
                                    >
                                        <th
                                            scope="row"
                                            className="py-3 pr-4 font-normal"
                                        >
                                            {months[month.month - 1]}
                                        </th>
                                        <td className="py-3 pr-4 tabular-nums">
                                            {formatMinutes(month.minutes)}
                                        </td>
                                        <td className="py-3 pr-4 tabular-nums">
                                            {month.sessions}
                                        </td>
                                        <td className="py-3 tabular-nums">
                                            {month.active_days}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            </section>
            <div className="mt-12 grid items-start gap-12 lg:grid-cols-2">
                <section aria-labelledby="most-played">
                    <SectionTitle
                        id="most-played"
                        detail="All-time recorded diary time"
                    >
                        Worlds you stayed in
                    </SectionTitle>
                    {stats.most_played.length ? (
                        <ol>
                            {stats.most_played.map((game, position) => (
                                <li
                                    key={game.id}
                                    className="border-b border-white/10 py-4 first:pt-0"
                                >
                                    <Link
                                        href={gameDetails(game.slug)}
                                        className="group flex items-start justify-between gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                                    >
                                        <div className="flex min-w-0 gap-4">
                                            <span className="mt-1 text-xs text-[#807d7d] tabular-nums">
                                                0{position + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="text-sm leading-6 wrap-break-word text-[#e0d9d3] group-hover:underline">
                                                    {game.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-[#bdb6b1]">
                                                    {game.sessions} diary{' '}
                                                    {game.sessions === 1
                                                        ? 'session'
                                                        : 'sessions'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-sm text-[#c5bfba] tabular-nums">
                                            {formatMinutes(game.minutes)}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="rounded-lg border border-dashed border-shadow p-6 text-sm leading-7 text-[#bdb6b1]">
                            Add session durations in your diary to discover
                            where you spend the most time.
                        </p>
                    )}
                    <p className="mt-4 text-xs leading-6 text-[#bdb6b1]">
                        Sessions from every playthrough are combined per game.
                        This includes only the time you logged.
                    </p>
                </section>
                <section aria-labelledby="played-genres">
                    <SectionTitle
                        id="played-genres"
                        detail="Current library · excludes backlog"
                    >
                        Your played genres
                    </SectionTitle>
                    {stats.genres.length ? (
                        <div className="space-y-5">
                            {stats.genres.map((genre) => (
                                <Link
                                    key={genre.id}
                                    href={games({
                                        query: { genre: genre.slug },
                                    })}
                                    className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                                >
                                    <div className="mb-2 flex justify-between gap-4 text-sm">
                                        <span className="text-[#c5bfba] group-hover:text-white">
                                            {genre.name}
                                        </span>
                                        <span className="text-xs text-[#bdb6b1]">
                                            {genre.games}{' '}
                                            {genre.games === 1
                                                ? 'game'
                                                : 'games'}
                                        </span>
                                    </div>
                                    <div
                                        className="h-1.5 overflow-hidden rounded-full bg-rein/50"
                                        aria-hidden="true"
                                    >
                                        <div
                                            className="h-full rounded-full bg-[#a8a09a]"
                                            style={{
                                                width: `${(genre.games / genreMax) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-lg border border-dashed border-shadow p-6 text-sm leading-7 text-[#bdb6b1]">
                            Genre insights appear when games beyond your backlog
                            have genre information.
                        </p>
                    )}
                    <p className="mt-5 text-xs leading-6 text-[#bdb6b1]">
                        Each game counts once per genre. A game can belong to
                        several genres; replays do not multiply the counts.
                    </p>
                </section>
            </div>
            <section
                aria-labelledby="played-platforms"
                className="mt-12 border-t border-shadow pt-9"
            >
                <SectionTitle
                    id="played-platforms"
                    detail={`${stats.playthroughs} playthroughs · ${stats.unspecified_platform_runs} without a platform`}
                >
                    Where you play
                </SectionTitle>
                {stats.platforms.length ? (
                    <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                        {stats.platforms.map((platform) => (
                            <div key={platform.id}>
                                <div className="mb-3 flex flex-wrap justify-between gap-2">
                                    <h3 className="text-sm text-[#c5bfba]">
                                        {platform.name}
                                    </h3>
                                    <p className="text-xs text-[#bdb6b1]">
                                        {platform.playthroughs}{' '}
                                        {platform.playthroughs === 1
                                            ? 'playthrough'
                                            : 'playthroughs'}{' '}
                                        · {platform.games}{' '}
                                        {platform.games === 1
                                            ? 'game'
                                            : 'games'}
                                    </p>
                                </div>
                                <div
                                    className="h-1.5 overflow-hidden rounded-full bg-rein/50"
                                    aria-hidden="true"
                                >
                                    <div
                                        className="h-full rounded-full bg-[#a8a09a]"
                                        style={{
                                            width: `${(platform.playthroughs / platformMax) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm leading-7 text-[#bdb6b1]">
                        Choose a platform on a playthrough to start this
                        breakdown.
                    </p>
                )}
                <p className="mt-5 text-xs leading-6 text-[#bdb6b1]">
                    Based on platforms you selected for your playthroughs,
                    rather than the platforms a game supports.
                </p>
            </section>
        </>
    );
}
