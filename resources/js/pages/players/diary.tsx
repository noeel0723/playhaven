import { Form, Head, Link } from '@inertiajs/react';
import GameCover from '@/components/game-cover';
import HistoryPagination from '@/components/history-pagination';
import PlayerPageNavigation from '@/components/player-page-navigation';
import StarRating from '@/components/star-rating';
import { diary, reviews } from '@/routes/players';
import { show } from '@/routes/games';
import type { PlayerPageContext } from '@/types/community';
import type { CatalogGame } from '@/types/catalog';
import type { HistoryPagination as Pagination } from '@/types/history';
import { formatHistoryDate } from '@/types/history';
import { libraryStatuses } from '@/types/library';
import type { LibraryStatus } from '@/types/library';

type PublicLog = {
    id: number;
    logged_on: string;
    status: LibraryStatus;
    completed_on: string | null;
    rating: number | null;
    has_public_review: boolean;
    game: Pick<
        CatalogGame,
        'id' | 'name' | 'slug' | 'cover_url' | 'released_on'
    >;
};
const control =
    'h-7 min-w-0 w-full rounded border border-white/10 bg-rein/30 px-2 font-sans text-[11px] [color-scheme:dark] focus-visible:outline-2';
export default function PlayerDiary({
    playerPage,
    logs,
    filters,
    today,
}: {
    playerPage: PlayerPageContext;
    logs: Pagination<PublicLog>;
    filters: { q: string; status: string; from: string; to: string };
    today: string;
}) {
    const username = playerPage.owner.username!;
    const filtered = Object.values(filters).some(Boolean);
    return (
        <div className="mx-auto max-w-4xl font-sans">
            <Head title={`Diary · ${playerPage.owner.name}`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <PlayerPageNavigation context={playerPage} current="diary" />
            <div className="mb-4 flex items-baseline gap-2 border-b border-white/10 pb-3">
                <h1 className="text-base font-medium">Diary</h1>
                <span className="text-[11px] text-[#a9a19b]">
                    {logs.meta.total} game logs
                </span>
            </div>
            <Form
                action={diary(username)}
                method="get"
                key={JSON.stringify(filters)}
                options={{ preserveScroll: true }}
                role="search"
                aria-label="Filter player diary"
            >
                {({ processing, errors }) => (
                    <div className="mb-4">
                        <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                            <label className="col-span-2 grid min-w-0 gap-1 text-[11px] text-[#bdb6b1] sm:col-span-1">
                                Game
                                <input
                                    type="search"
                                    name="q"
                                    defaultValue={filters.q}
                                    placeholder="Find a game…"
                                    maxLength={100}
                                    className={control}
                                />
                            </label>
                            <label className="grid min-w-0 gap-1 text-[11px] text-[#bdb6b1]">
                                Status
                                <select
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
                            </label>
                            <label className="grid min-w-0 gap-1 text-[11px] text-[#bdb6b1]">
                                From
                                <input
                                    type="date"
                                    name="from"
                                    defaultValue={filters.from}
                                    min="0001-01-01"
                                    max={today}
                                    className={control}
                                />
                            </label>
                            <label className="grid min-w-0 gap-1 text-[11px] text-[#bdb6b1]">
                                To
                                <input
                                    type="date"
                                    name="to"
                                    defaultValue={filters.to}
                                    min="0001-01-01"
                                    max={today}
                                    className={control}
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={processing}
                                className="h-7 rounded border border-white/15 bg-rein/30 px-2.5 text-[11px] text-[#d5cec7] hover:bg-rein/50 focus-visible:outline-2 disabled:opacity-50"
                            >
                                Filter
                            </button>
                        </div>
                        {Object.keys(errors).length > 0 && (
                            <p
                                role="alert"
                                className="mt-2 text-[11px] text-red-300"
                            >
                                {Object.values(errors).join(' ')}
                            </p>
                        )}
                    </div>
                )}
            </Form>
            {logs.data.length ? (
                <div aria-label="Player diary logs">
                    {logs.data.map((log) => (
                        <article
                            key={log.id}
                            className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)] gap-2.5 border-b border-white/10 py-3 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-3"
                        >
                            <Link
                                href={show(log.game.slug)}
                                aria-label={`View ${log.game.name}`}
                                className="group h-fit rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
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
                                    <h2 className="text-sm font-medium wrap-break-word">
                                        <Link
                                            href={show(log.game.slug)}
                                            className="rounded-sm hover:underline focus-visible:outline-2"
                                        >
                                            {log.game.name}
                                        </Link>
                                    </h2>
                                    <time
                                        dateTime={log.logged_on}
                                        className="text-[11px] text-[#a9a19b]"
                                    >
                                        {formatHistoryDate(log.logged_on)}
                                    </time>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#bdb6b1]">
                                    <span className="rounded border border-white/10 bg-rein/30 px-1.5 py-0.5">
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
                                        <StarRating
                                            value={log.rating}
                                            compact
                                        />
                                    )}
                                </div>
                                {log.has_public_review && (
                                    <Link
                                        href={reviews(username, {
                                            query: {
                                                q: log.game.name.slice(0, 100),
                                            },
                                        })}
                                        className="mt-1 inline-flex min-h-7 items-center rounded-sm text-[11px] text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2"
                                    >
                                        Read public review
                                    </Link>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="border-y border-white/10 py-8 text-center text-xs text-[#a9a19b]">
                    {filtered
                        ? 'No game logs match these filters.'
                        : 'No game logs to show yet.'}
                </p>
            )}
            {filtered && (
                <Link
                    href={diary(username)}
                    className="mt-2 inline-flex min-h-7 items-center rounded-sm text-[11px] text-[#bdb6b1] underline underline-offset-4 focus-visible:outline-2"
                >
                    Full diary
                </Link>
            )}
            <HistoryPagination
                pagination={logs}
                label="Player diary pages"
                compact
                dense
            />
        </div>
    );
}
