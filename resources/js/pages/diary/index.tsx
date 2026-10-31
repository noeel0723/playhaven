import { Form, Head, Link } from '@inertiajs/react';
import { BookOpen, Search } from 'lucide-react';
import ConfirmHistoryDelete from '@/components/confirm-history-delete';
import GameCover from '@/components/game-cover';
import GameDiaryDialog from '@/components/game-diary-dialog';
import HistoryPagination from '@/components/history-pagination';
import ReviewBody from '@/components/review-body';
import StarRating from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index, sessions } from '@/routes/diary';
import { destroy } from '@/routes/game-diary';
import { index as library } from '@/routes/library';
import { show as gameDetails } from '@/routes/games';
import { formatHistoryDate } from '@/types/history';
import type { HistoryPagination as Pagination } from '@/types/history';
import type { GameDiaryLog } from '@/types/game-diary';
import { libraryStatuses } from '@/types/library';

type Filters = { q: string; status: string; from: string; to: string };
const control =
    'h-7 min-w-0 w-full rounded border border-white/10 bg-rein/30 px-2 text-[11px] md:text-[11px] [color-scheme:dark]';
const action =
    'h-7 gap-1.5 border border-shadow bg-rein/30 px-2.5 text-[11px] text-[#f4f1ed] hover:bg-rein hover:text-white';
export default function Diary({
    logs,
    filters,
    today,
}: {
    logs: Pagination<GameDiaryLog>;
    filters: Filters;
    today: string;
}) {
    const filtered = Object.values(filters).some(Boolean);
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title="Diary">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-xl font-medium tracking-tight">
                        Diary
                    </h1>
                    <p
                        className="text-[11px] text-[#bdb6b1]"
                        aria-live="polite"
                    >
                        {logs.meta.total} game{' '}
                        {logs.meta.total === 1 ? 'log' : 'logs'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="ghost" className={action}>
                        <Link href={sessions()}>Playing sessions</Link>
                    </Button>
                    <Button asChild variant="outline" className={action}>
                        <Link href={library()}>Library</Link>
                    </Button>
                </div>
            </header>
            <Form
                action={index()}
                method="get"
                key={JSON.stringify(filters)}
                options={{ preserveScroll: true, preserveState: 'errors' }}
                role="search"
                aria-label="Filter game diary"
            >
                {({ processing, errors }) => (
                    <div className="mb-4">
                        <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                            <div className="col-span-2 min-w-0 sm:col-span-1">
                                <Label
                                    htmlFor="diary-search"
                                    className="mb-1 text-[11px]"
                                >
                                    Game
                                </Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-2 left-2 size-3 text-[#bdb6b1]" />
                                    <Input
                                        id="diary-search"
                                        name="q"
                                        type="search"
                                        defaultValue={filters.q}
                                        maxLength={100}
                                        placeholder="Find a game…"
                                        className={control + ' pl-7'}
                                    />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <Label
                                    htmlFor="diary-status"
                                    className="mb-1 text-[11px]"
                                >
                                    Status
                                </Label>
                                <select
                                    id="diary-status"
                                    name="status"
                                    defaultValue={filters.status}
                                    className={control}
                                >
                                    <option value="">All statuses</option>
                                    {libraryStatuses.map((status) => (
                                        <option
                                            key={status.value}
                                            value={status.value}
                                        >
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-0">
                                <Label
                                    htmlFor="diary-from"
                                    className="mb-1 text-[11px]"
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
                                    className={control}
                                />
                            </div>
                            <div className="min-w-0">
                                <Label
                                    htmlFor="diary-to"
                                    className="mb-1 text-[11px]"
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
                                    className={control}
                                />
                            </div>
                            <Button
                                type="submit"
                                className={action}
                                disabled={processing}
                            >
                                {processing ? 'Searching…' : 'Filter'}
                            </Button>
                        </div>
                        {Object.values(errors).length > 0 && (
                            <p
                                role="alert"
                                className="mt-2 text-[11px] text-red-300"
                            >
                                {Object.values(errors).join(' ')}
                            </p>
                        )}
                        {filtered && (
                            <Link
                                href={index()}
                                className="mt-2 inline-flex min-h-7 items-center text-[11px] text-[#bdb6b1] underline underline-offset-4"
                            >
                                Clear filters
                            </Link>
                        )}
                    </div>
                )}
            </Form>
            <p className="mb-3 text-[11px] leading-4 text-[#bdb6b1]">
                Private status history and review snapshots. New logs update
                your current Library status and game review.
            </p>
            {logs.data.length ? (
                <section
                    aria-label="Game diary logs"
                    className="border-t border-white/10"
                >
                    {logs.data.map((log) => (
                        <article
                            key={log.id}
                            aria-label={'Game log for ' + log.game.name}
                            className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)] gap-2.5 border-b border-white/10 py-3 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-3"
                        >
                            <Link
                                href={gameDetails(log.game.slug)}
                                aria-label={'View ' + log.game.name}
                                className="h-fit rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                <GameCover
                                    game={log.game}
                                    compact
                                    hideFallbackTitle
                                    className="aspect-[2/3] rounded-sm"
                                />
                            </Link>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                    <h2 className="text-sm leading-5 font-medium wrap-break-word">
                                        <Link
                                            href={gameDetails(log.game.slug)}
                                            className="rounded-sm hover:underline focus-visible:outline-2"
                                        >
                                            {log.game.name}
                                        </Link>
                                    </h2>
                                    <time
                                        dateTime={log.logged_on}
                                        className="text-[11px] text-[#bdb6b1]"
                                    >
                                        {formatHistoryDate(log.logged_on)}
                                    </time>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#bdb6b1]">
                                    <span className="rounded border border-white/10 bg-rein/30 px-1.5 py-0.5 text-[#e0d9d3]">
                                        {
                                            libraryStatuses.find(
                                                (status) =>
                                                    status.value === log.status,
                                            )?.label
                                        }
                                    </span>
                                    {log.completed_on && (
                                        <span>
                                            Completed{' '}
                                            <time dateTime={log.completed_on}>
                                                {formatHistoryDate(
                                                    log.completed_on,
                                                )}
                                            </time>
                                        </span>
                                    )}
                                    {log.rating !== null && (
                                        <span title="Current personal rating">
                                            <StarRating
                                                value={log.rating}
                                                compact
                                            />
                                        </span>
                                    )}
                                </div>
                                {log.review_body &&
                                    (log.contains_spoilers ? (
                                        <details className="mt-1.5">
                                            <summary className="min-h-7 w-fit cursor-pointer rounded-sm py-1.5 text-[11px] text-[#bdb6b1]">
                                                Contains spoilers · Show review
                                            </summary>
                                            <ReviewBody
                                                body={log.review_body}
                                            />
                                        </details>
                                    ) : (
                                        <ReviewBody body={log.review_body} />
                                    ))}
                                <div className="mt-2 flex items-center gap-2">
                                    <GameDiaryDialog game={log.game} />
                                    <ConfirmHistoryDelete
                                        url={destroy(log.id).url}
                                        title="Delete this diary log?"
                                        description="Only this history entry is removed. Your Library status, game review, playthroughs, and playing sessions stay unchanged."
                                        label="Delete log"
                                        iconOnly
                                    />
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            ) : (
                <div className="rounded-md border border-dashed border-shadow px-4 py-7 text-center">
                    <BookOpen className="mx-auto mb-2 size-5 text-mustang" />
                    <h2 className="text-sm font-medium">
                        {filtered
                            ? 'No matching game logs.'
                            : 'No game logs yet.'}
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-[#bdb6b1]">
                        {filtered
                            ? 'Try another game, status, or date range.'
                            : 'Open a game and use Diary to save its status, review, and completion date.'}
                    </p>
                    <Button
                        asChild
                        variant="outline"
                        className={action + ' mt-3'}
                    >
                        <Link href={filtered ? index() : library()}>
                            {filtered ? 'View full diary' : 'Open Library'}
                        </Link>
                    </Button>
                </div>
            )}
            <HistoryPagination
                pagination={logs}
                label="Diary pagination"
                dense
                preserveState
            />
        </div>
    );
}
