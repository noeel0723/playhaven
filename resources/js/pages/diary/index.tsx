import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, LockKeyhole, Search } from 'lucide-react';
import HistoryPagination from '@/components/history-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/diary';
import { index as library } from '@/routes/library';
import { show } from '@/routes/playthroughs';
import { formatHistoryDate, formatMinutes } from '@/types/history';
import type {
    DiarySession,
    HistoryPagination as Pagination,
} from '@/types/history';

export default function Diary({
    sessions,
    totals,
    filters,
    today,
}: {
    sessions: Pagination<DiarySession>;
    totals: { sessions: number; minutes: number };
    filters: { q: string; from: string; to: string };
    today: string;
}) {
    const filtered = Boolean(filters.q || filters.from || filters.to);
    return (
        <>
            <Head title="Your diary" />
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="mb-4 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                        <LockKeyhole className="size-3.5" aria-hidden="true" />
                        For your eyes only
                    </p>
                    <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
                        The days.
                        <br />
                        <span className="font-serif font-normal text-[#c5bfba] italic">
                            The worlds. The memories.
                        </span>
                    </h1>
                    <p className="mt-5 max-w-xl text-sm leading-7 text-[#bdb6b1]">
                        Your playing sessions, one page at a time. Open a
                        playthrough to add or edit its memories.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href={library()}>
                        Your library <ArrowRight aria-hidden="true" />
                    </Link>
                </Button>
            </div>
            <Form
                action={index()}
                method="get"
                key={JSON.stringify(filters)}
                options={{ preserveScroll: true }}
            >
                {({ processing, errors }) => (
                    <div className="mb-8 rounded-xl border border-white/10 bg-rein/40 p-5 sm:p-6">
                        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
                            <div className="space-y-2">
                                <Label htmlFor="diary-search">
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
                                        defaultValue={filters.q}
                                        maxLength={100}
                                        placeholder="Find a world you’ve visited…"
                                        className="h-11 border-shadow bg-rein pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="diary-from">From</Label>
                                <Input
                                    id="diary-from"
                                    name="from"
                                    type="date"
                                    min="0001-01-01"
                                    max={today}
                                    defaultValue={filters.from}
                                    className="h-11 border-shadow bg-rein [color-scheme:dark]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="diary-to">To</Label>
                                <Input
                                    id="diary-to"
                                    name="to"
                                    type="date"
                                    min="0001-01-01"
                                    max={today}
                                    defaultValue={filters.to}
                                    className="h-11 border-shadow bg-rein [color-scheme:dark]"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11"
                            >
                                {processing ? 'Searching…' : 'Apply'}
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
                    </div>
                )}
            </Form>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <p aria-live="polite" className="text-sm text-[#c5bfba]">
                    {totals.sessions}{' '}
                    {totals.sessions === 1 ? 'session' : 'sessions'}
                    {filtered ? ' found' : ' in your diary'} ·{' '}
                    {formatMinutes(totals.minutes)} recorded
                </p>
                {filtered && (
                    <Link
                        href={index()}
                        className="rounded-sm text-xs underline underline-offset-4 focus-visible:outline-2"
                    >
                        Clear filters
                    </Link>
                )}
            </div>
            {sessions.data.length ? (
                <div className="space-y-5">
                    {sessions.data.map(
                        (session) =>
                            session.playthrough && (
                                <article
                                    key={session.id}
                                    className="grid min-w-0 gap-5 rounded-xl border border-shadow bg-rein/20 p-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:p-7"
                                >
                                    <div>
                                        <time
                                            dateTime={session.logged_on}
                                            className="block text-sm text-[#d5cec7]"
                                        >
                                            {formatHistoryDate(
                                                session.logged_on,
                                            )}
                                        </time>
                                        <p className="mt-2 text-xs text-[#bdb6b1]">
                                            {session.minutes_played === null
                                                ? 'Duration not recorded'
                                                : formatMinutes(
                                                      session.minutes_played,
                                                  )}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <Link
                                            href={show(session.playthrough.id)}
                                            className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                                        >
                                            <h2 className="text-lg font-medium break-words group-hover:underline">
                                                {session.playthrough.game.name}
                                            </h2>
                                            <p className="mt-1 text-xs text-[#bdb6b1]">
                                                {session.playthrough.label ||
                                                    `Playthrough #${session.playthrough.id}`}
                                            </p>
                                        </Link>
                                        {session.notes ? (
                                            <p className="mt-4 line-clamp-4 text-sm leading-7 break-words whitespace-pre-wrap text-[#c5bfba]">
                                                {session.notes}
                                            </p>
                                        ) : (
                                            <p className="mt-4 text-sm text-[#bdb6b1]">
                                                No notes for this session.
                                            </p>
                                        )}
                                        <Link
                                            href={show(session.playthrough.id)}
                                            className="mt-4 inline-flex items-center gap-2 rounded-sm text-xs text-[#d5cec7] underline underline-offset-4 focus-visible:outline-2"
                                        >
                                            Open playthrough{' '}
                                            <ArrowRight
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </div>
                                </article>
                            ),
                    )}
                </div>
            ) : (
                <section className="rounded-xl border border-dashed border-shadow px-6 py-14 text-center">
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
                    <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#bdb6b1]">
                        {filtered
                            ? 'Try another title or date range to find your playing sessions.'
                            : 'Open a game in your library, start a playthrough, and log your first session.'}
                    </p>
                    <Button asChild variant="outline" className="mt-6">
                        <Link href={filtered ? index() : library()}>
                            {filtered ? 'View full diary' : 'Open your library'}
                        </Link>
                    </Button>
                </section>
            )}
            <HistoryPagination pagination={sessions} label="Diary pagination" />
        </>
    );
}
