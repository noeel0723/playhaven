import { Form, Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    Heart,
    MessageSquareText,
    Pencil,
    Repeat2,
    Search,
} from 'lucide-react';
import GameCover from '@/components/game-cover';
import HistoryPagination from '@/components/history-pagination';
import StarRating from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/diary';
import { index as library } from '@/routes/library';
import { show as gameDetails } from '@/routes/games';
import { show } from '@/routes/playthroughs';
import { formatMinutes } from '@/types/history';
import type {
    DiaryIndexSession,
    HistoryPagination as Pagination,
} from '@/types/history';

export default function Diary({
    sessions,
    totals,
    filters,
    today,
}: {
    sessions: Pagination<DiaryIndexSession>;
    totals: { sessions: number; minutes: number };
    filters: { q: string; from: string; to: string };
    today: string;
}) {
    const filtered = Boolean(filters.q || filters.from || filters.to);
    return (
        <>
            <Head title="Diary" />
            <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
                <div>
                    <h1 className="text-sm font-medium tracking-[0.14em] text-[#d5cec7] uppercase">
                        Diary
                    </h1>
                    <p className="mt-2 text-xs text-[#a9a19b]">
                        Your private playing history, one session at a time.
                    </p>
                </div>
                <p aria-live="polite" className="text-xs text-[#bdb6b1]">
                    {totals.sessions}{' '}
                    {totals.sessions === 1 ? 'session' : 'sessions'} ·{' '}
                    {formatMinutes(totals.minutes)} recorded
                </p>
            </div>
            <Form
                action={index()}
                method="get"
                key={JSON.stringify(filters)}
                options={{ preserveScroll: true }}
                role="search"
                aria-label="Filter your diary"
            >
                {({ processing, errors }) => (
                    <div className="mb-7">
                        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                            <div className="min-w-0">
                                <Label
                                    htmlFor="diary-search"
                                    className="mb-2 text-xs"
                                >
                                    Search game titles
                                </Label>
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute top-3.5 left-3 size-4 text-[#bdb6b1]"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        id="diary-search"
                                        name="q"
                                        type="search"
                                        defaultValue={filters.q}
                                        maxLength={100}
                                        placeholder="Find a game…"
                                        className="h-11 min-w-0 border-shadow bg-rein/40 pl-10"
                                    />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <Label
                                    htmlFor="diary-from"
                                    className="mb-2 text-xs"
                                >
                                    From
                                </Label>
                                <Input
                                    id="diary-from"
                                    name="from"
                                    type="date"
                                    min="0001-01-01"
                                    max={today}
                                    defaultValue={filters.from}
                                    className="h-11 min-w-0 border-shadow bg-rein/40 [color-scheme:dark]"
                                />
                            </div>
                            <div className="min-w-0">
                                <Label
                                    htmlFor="diary-to"
                                    className="mb-2 text-xs"
                                >
                                    To
                                </Label>
                                <Input
                                    id="diary-to"
                                    name="to"
                                    type="date"
                                    min="0001-01-01"
                                    max={today}
                                    defaultValue={filters.to}
                                    className="h-11 min-w-0 border-shadow bg-rein/40 [color-scheme:dark]"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11"
                            >
                                {processing ? 'Searching…' : 'Apply filters'}
                            </Button>
                        </div>
                        {Object.values(errors).length > 0 && (
                            <p
                                role="alert"
                                className="mt-4 text-sm text-red-300"
                            >
                                {Object.values(errors).join(' ')}
                            </p>
                        )}
                        {filtered && (
                            <Link
                                href={index()}
                                className="mt-4 inline-block rounded-sm text-xs text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                            >
                                Clear filters
                            </Link>
                        )}
                    </div>
                )}
            </Form>
            {sessions.data.length ? (
                <table
                    className="w-full table-fixed border-collapse text-left"
                    aria-label="Game diary"
                >
                    <caption className="sr-only">
                        Your game diary, grouped by month. Rating and favorite
                        values reflect your current library.
                    </caption>
                    <thead className="border-b border-shadow bg-rein/25 text-[10px] font-normal tracking-[0.08em] text-[#a9a19b] uppercase">
                        <tr>
                            <th
                                scope="col"
                                className="hidden w-20 px-2 py-3 font-normal md:table-cell"
                            >
                                Month
                            </th>
                            <th
                                scope="col"
                                className="w-10 py-3 font-normal sm:w-12"
                            >
                                Day
                            </th>
                            <th scope="col" className="py-3 pr-3 font-normal">
                                Game
                            </th>
                            <th
                                scope="col"
                                className="hidden w-16 py-3 font-normal lg:table-cell"
                            >
                                Released
                            </th>
                            <th
                                scope="col"
                                className="hidden w-24 py-3 font-normal md:table-cell"
                            >
                                Rating
                            </th>
                            <th
                                scope="col"
                                className="hidden w-12 py-3 text-center font-normal lg:table-cell"
                            >
                                Like
                            </th>
                            <th
                                scope="col"
                                className="hidden w-12 py-3 text-center font-normal lg:table-cell"
                            >
                                Run
                            </th>
                            <th
                                scope="col"
                                className="hidden w-14 py-3 text-center font-normal lg:table-cell"
                            >
                                Review
                            </th>
                            <th
                                scope="col"
                                className="w-10 py-3 text-center font-normal"
                            >
                                Edit
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.data.map((session, index) => {
                            if (!session.playthrough) return null;
                            const run = session.playthrough;
                            const game = session.catalog_game;
                            const date = new Date(
                                `${session.logged_on}T00:00:00Z`,
                            );
                            const month = new Intl.DateTimeFormat('en', {
                                month: 'short',
                                timeZone: 'UTC',
                            }).format(date);
                            const monthStart =
                                index === 0 ||
                                sessions.data[index - 1].logged_on.slice(
                                    0,
                                    7,
                                ) !== session.logged_on.slice(0, 7);
                            return (
                                <tr
                                    key={session.id}
                                    className="border-b border-white/10 align-top"
                                >
                                    <td className="hidden py-5 pr-3 md:table-cell">
                                        {monthStart && (
                                            <time
                                                dateTime={session.logged_on.slice(
                                                    0,
                                                    7,
                                                )}
                                                className="relative mt-1 flex w-16 flex-col items-center rounded-md border border-shadow bg-shadow/60 px-2 py-2.5 text-[#d5cec7] before:absolute before:-top-1.5 before:left-3 before:h-3 before:w-1 before:rounded before:bg-mustang after:absolute after:-top-1.5 after:right-3 after:h-3 after:w-1 after:rounded after:bg-mustang"
                                            >
                                                <span className="text-base tracking-wide uppercase">
                                                    {month}
                                                </span>
                                                <span className="mt-0.5 text-xs">
                                                    {session.logged_on.slice(
                                                        0,
                                                        4,
                                                    )}
                                                </span>
                                            </time>
                                        )}
                                    </td>
                                    <td className="py-5 pr-2">
                                        <time
                                            dateTime={session.logged_on}
                                            className="block text-center font-serif text-2xl text-[#bdb6b1] sm:text-3xl"
                                        >
                                            {session.logged_on.slice(8, 10)}
                                            <span className="mt-1 block font-sans text-[9px] leading-4 md:hidden">
                                                {month}
                                                <br />
                                                {session.logged_on.slice(0, 4)}
                                            </span>
                                        </time>
                                    </td>
                                    <td className="min-w-0 py-5 pr-2 sm:pr-4">
                                        <div className="flex min-w-0 items-start gap-2 sm:gap-4">
                                            <Link
                                                href={gameDetails(game.slug)}
                                                aria-label={`View ${game.name}`}
                                                className="group block w-9 shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 sm:w-12"
                                            >
                                                <GameCover
                                                    game={game}
                                                    compact
                                                    hideFallbackTitle
                                                    className="aspect-[2/3] rounded-sm"
                                                />
                                            </Link>
                                            <div className="min-w-0 flex-1">
                                                <h2 className="font-serif text-base leading-tight wrap-break-word sm:text-xl lg:text-2xl">
                                                    <Link
                                                        href={gameDetails(
                                                            game.slug,
                                                        )}
                                                        className="rounded-sm hover:underline focus-visible:outline-2"
                                                    >
                                                        {game.name}
                                                    </Link>
                                                </h2>
                                                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] leading-5 text-[#a9a19b] sm:text-xs">
                                                    <Link
                                                        href={show(run.id)}
                                                        className="rounded-sm hover:underline focus-visible:outline-2"
                                                    >
                                                        {run.label ||
                                                            'Playthrough'}
                                                    </Link>
                                                    <span>
                                                        {session.minutes_played ===
                                                        null
                                                            ? 'Duration not recorded'
                                                            : formatMinutes(
                                                                  session.minutes_played,
                                                              )}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                                                    {session.rating !==
                                                        null && (
                                                        <StarRating
                                                            value={
                                                                session.rating
                                                            }
                                                            compact
                                                        />
                                                    )}
                                                    {session.is_favorite && (
                                                        <Heart
                                                            className="size-3 fill-current text-[#bdb6b1]"
                                                            aria-label="Favorite game"
                                                        />
                                                    )}
                                                    {session.is_replay && (
                                                        <Repeat2
                                                            className="size-3 text-[#bdb6b1]"
                                                            aria-label="Additional playthrough"
                                                        />
                                                    )}
                                                    {session.has_review && (
                                                        <Link
                                                            href={gameDetails(
                                                                game.slug,
                                                            )}
                                                            aria-label={`Read your review of ${game.name}`}
                                                        >
                                                            <MessageSquareText className="size-3 text-[#bdb6b1]" />
                                                        </Link>
                                                    )}
                                                </div>
                                                {session.notes && (
                                                    <details className="mt-2">
                                                        <summary className="w-fit cursor-pointer rounded-sm text-[10px] leading-5 text-[#a9a19b] focus-visible:outline-2 sm:text-xs">
                                                            Session notes
                                                        </summary>
                                                        <p className="mt-2 text-xs leading-6 wrap-break-word whitespace-pre-wrap text-[#c5bfba]">
                                                            {session.notes}
                                                        </p>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden py-7 text-xs text-[#bdb6b1] lg:table-cell">
                                        {game.released_on?.slice(0, 4) ?? 'TBA'}
                                    </td>
                                    <td className="hidden py-7 md:table-cell">
                                        {session.rating !== null ? (
                                            <StarRating
                                                value={session.rating}
                                                compact
                                            />
                                        ) : (
                                            <span className="text-xs text-[#807d7d]">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="hidden py-7 text-center lg:table-cell">
                                        {session.is_favorite ? (
                                            <Heart
                                                className="mx-auto size-4 fill-current text-[#bdb6b1]"
                                                aria-label="Favorite game"
                                            />
                                        ) : (
                                            <span className="text-[#807d7d]">
                                                —
                                                <span className="sr-only">
                                                    Not a favorite
                                                </span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="hidden py-7 text-center lg:table-cell">
                                        {session.is_replay ? (
                                            <Repeat2
                                                className="mx-auto size-4 text-[#bdb6b1]"
                                                aria-label="Additional playthrough"
                                            />
                                        ) : (
                                            <span className="text-xs text-[#807d7d]">
                                                First
                                            </span>
                                        )}
                                    </td>
                                    <td className="hidden py-6 text-center lg:table-cell">
                                        {session.has_review ? (
                                            <Link
                                                href={gameDetails(game.slug)}
                                                aria-label={`Read your review of ${game.name}`}
                                                className="inline-flex size-9 items-center justify-center rounded-sm text-[#bdb6b1] hover:text-white focus-visible:outline-2"
                                            >
                                                <MessageSquareText
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                            </Link>
                                        ) : (
                                            <span className="text-[#807d7d]">
                                                —
                                                <span className="sr-only">
                                                    No review
                                                </span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="bg-rein/15 py-5 text-center">
                                        <Link
                                            href={`${show(run.id).url}?page=${session.session_page}#diary-session-${session.id}`}
                                            aria-label={`Edit session for ${game.name} on ${session.logged_on}`}
                                            className="inline-flex size-9 items-center justify-center rounded-sm text-[#bdb6b1] hover:bg-rein hover:text-white focus-visible:outline-2"
                                        >
                                            <Pencil
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <section className="border-y border-white/10 px-6 py-16 text-center">
                    <BookOpen
                        className="mx-auto mb-5 size-9 text-mustang"
                        strokeWidth={1}
                        aria-hidden="true"
                    />
                    <h2 className="font-serif text-3xl">
                        {filtered
                            ? 'No memories on these pages.'
                            : 'Every session has a story.'}
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#bdb6b1]">
                        {filtered
                            ? 'Try another title or date range to find your playing sessions.'
                            : 'Open a game in your library, start a playthrough, and log your first session.'}
                    </p>
                    <Button
                        asChild
                        variant="outline"
                        className="mt-6 border-shadow bg-rein/40"
                    >
                        <Link href={filtered ? index() : library()}>
                            {filtered ? 'View full diary' : 'Open your library'}
                        </Link>
                    </Button>
                </section>
            )}
            {sessions.data.length > 0 && (
                <p className="mt-4 text-xs leading-6 text-[#9e9690]">
                    Ratings and likes reflect your current library. The repeat
                    icon marks an additional playthrough.
                </p>
            )}
            <HistoryPagination pagination={sessions} label="Diary pagination" />
        </>
    );
}
