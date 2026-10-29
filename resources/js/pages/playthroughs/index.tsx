import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BookOpen, Plus } from 'lucide-react';
import HistoryPagination from '@/components/history-pagination';
import PlaythroughForm from '@/components/playthrough-form';
import { show as gameDetails } from '@/routes/games';
import { show } from '@/routes/playthroughs';
import {
    formatHistoryDate,
    formatMinutes,
    playthroughStatuses,
} from '@/types/history';
import type {
    HistoryGame,
    HistoryPagination as Pagination,
    HistoryPlatform,
    Playthrough,
} from '@/types/history';

export default function Playthroughs({
    game,
    platforms,
    playthroughs,
    today,
}: {
    game: HistoryGame;
    platforms: HistoryPlatform[];
    playthroughs: Pagination<Playthrough>;
    today: string;
}) {
    return (
        <>
            <Head title={`${game.name} · Playthroughs`} />
            <Link
                href={gameDetails(game.slug)}
                className="mb-8 inline-flex items-center gap-2 rounded-sm text-sm text-[#bdb6b1] hover:text-white focus-visible:outline-2"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to {game.name}
            </Link>
            <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                Your journeys, remembered
            </p>
            <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
                Every playthrough.
                <br />
                <span className="font-serif font-normal text-[#c5bfba] italic">
                    A different story.
                </span>
            </h1>
            <p className="mt-5 mb-10 text-sm leading-7 text-[#bdb6b1]">
                Your private playing history for{' '}
                <span className="font-medium text-[#f4f1ed]">{game.name}</span>.
            </p>
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <section
                    aria-labelledby="new-playthrough"
                    className="rounded-xl border border-shadow bg-rein/40 p-5 sm:p-7"
                >
                    <h2
                        id="new-playthrough"
                        className="mb-5 flex items-center gap-2 font-serif text-2xl"
                    >
                        <Plus className="size-5" aria-hidden="true" />
                        Start another chapter
                    </h2>
                    <PlaythroughForm
                        gameSlug={game.slug}
                        platforms={platforms}
                        today={today}
                    />
                </section>
                <section
                    aria-labelledby="your-playthroughs"
                    className="min-w-0"
                >
                    <h2
                        id="your-playthroughs"
                        className="mb-5 font-serif text-2xl"
                    >
                        Your playthroughs{' '}
                        <span className="text-base text-[#bdb6b1]">
                            ({playthroughs.meta.total})
                        </span>
                    </h2>
                    {playthroughs.data.length ? (
                        <div className="space-y-4">
                            {playthroughs.data.map((run) => (
                                <Link
                                    key={run.id}
                                    href={show(run.id)}
                                    className="group block rounded-xl border border-shadow bg-rein/20 p-5 hover:bg-rein/50 focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="min-w-0 font-medium break-words group-hover:underline">
                                            {run.label ||
                                                `Playthrough #${run.id}`}
                                        </h3>
                                        <ArrowRight
                                            className="size-4 shrink-0"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-[#c5bfba]">
                                        {
                                            playthroughStatuses.find(
                                                (status) =>
                                                    status.value === run.status,
                                            )?.label
                                        }{' '}
                                        ·{' '}
                                        {run.platform?.name ||
                                            'Platform unspecified'}
                                    </p>
                                    <p className="mt-3 text-xs text-[#bdb6b1]">
                                        {run.started_on
                                            ? formatHistoryDate(run.started_on)
                                            : 'Start unknown'}{' '}
                                        →{' '}
                                        {run.finished_on
                                            ? formatHistoryDate(run.finished_on)
                                            : 'Open-ended'}
                                    </p>
                                    <p className="mt-3 text-xs text-[#bdb6b1]">
                                        {run.sessions_count}{' '}
                                        {run.sessions_count === 1
                                            ? 'session'
                                            : 'sessions'}{' '}
                                        · {formatMinutes(run.minutes_played)}{' '}
                                        recorded
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-shadow px-6 py-10 text-center">
                            <BookOpen
                                className="mx-auto mb-4 size-8 text-mustang"
                                strokeWidth={1}
                                aria-hidden="true"
                            />
                            <h3 className="font-serif text-2xl">
                                A fresh page.
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-[#bdb6b1]">
                                Create a playthrough to start keeping a diary
                                for this game.
                            </p>
                        </div>
                    )}
                    <HistoryPagination
                        pagination={playthroughs}
                        label="Playthrough pagination"
                    />
                </section>
            </div>
        </>
    );
}
