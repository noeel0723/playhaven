import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, LockKeyhole } from 'lucide-react';
import ConfirmHistoryDelete from '@/components/confirm-history-delete';
import DiarySessionCard from '@/components/diary-session-card';
import DiarySessionForm from '@/components/diary-session-form';
import HistoryPagination from '@/components/history-pagination';
import PlaythroughForm from '@/components/playthrough-form';
import { index as diary } from '@/routes/diary';
import { destroy, index } from '@/routes/playthroughs';
import { formatMinutes } from '@/types/history';
import type {
    DiarySession,
    HistoryGame,
    HistoryPagination as Pagination,
    HistoryPlatform,
    Playthrough,
} from '@/types/history';

export default function PlaythroughDetails({
    game,
    platforms,
    playthrough,
    sessions,
    today,
}: {
    game: HistoryGame;
    platforms: HistoryPlatform[];
    playthrough: Playthrough;
    sessions: Pagination<DiarySession>;
    today: string;
}) {
    return (
        <>
            <Head
                title={`${playthrough.label || 'Playthrough'} · ${game.name}`}
            />
            <Link
                href={index(game.slug)}
                className="mb-8 inline-flex items-center gap-2 rounded-sm text-sm text-[#bdb6b1] hover:text-white focus-visible:outline-2"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                All playthroughs for {game.name}
            </Link>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
                <div className="min-w-0">
                    <p className="mb-4 text-xs tracking-[0.2em] text-[#bdb6b1] uppercase">
                        {game.name}
                    </p>
                    <h1 className="font-serif text-4xl break-words sm:text-5xl">
                        {playthrough.label || `Playthrough #${playthrough.id}`}
                    </h1>
                    <p className="mt-4 text-sm text-[#bdb6b1]">
                        {playthrough.sessions_count} sessions ·{' '}
                        {formatMinutes(playthrough.minutes_played)} recorded
                    </p>
                </div>
                <Link
                    href={diary()}
                    className="inline-flex items-center gap-2 rounded-sm text-xs text-[#c5bfba] underline underline-offset-4 focus-visible:outline-2"
                >
                    <LockKeyhole className="size-3.5" aria-hidden="true" />
                    Your private diary
                </Link>
            </div>
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-6">
                    <section
                        aria-labelledby="log-session"
                        className="rounded-xl border border-shadow bg-rein/40 p-5 sm:p-7"
                    >
                        <h2
                            id="log-session"
                            className="mb-5 font-serif text-2xl"
                        >
                            Log a playing session
                        </h2>
                        <DiarySessionForm
                            key={`${playthrough.id}:${playthrough.started_on}:${playthrough.finished_on}`}
                            run={playthrough}
                            today={today}
                        />
                    </section>
                    <details className="rounded-xl border border-shadow bg-rein/20 p-5 sm:p-7">
                        <summary className="cursor-pointer rounded-sm font-serif text-2xl focus-visible:outline-2 focus-visible:outline-offset-4">
                            Playthrough details
                        </summary>
                        <div className="mt-6">
                            <PlaythroughForm
                                key={`${playthrough.id}:${playthrough.updated_at}`}
                                gameSlug={game.slug}
                                platforms={platforms}
                                today={today}
                                run={playthrough}
                            />
                            <div className="mt-5 border-t border-white/10 pt-4">
                                <ConfirmHistoryDelete
                                    url={destroy(playthrough.id).url}
                                    title="Delete this playthrough?"
                                    description="This playthrough and all of its diary sessions will be permanently deleted. Your other playthroughs, library status, rating, and review will stay."
                                    label="Delete playthrough"
                                />
                            </div>
                        </div>
                    </details>
                </div>
                <section aria-labelledby="playing-sessions" className="min-w-0">
                    <h2
                        id="playing-sessions"
                        className="mb-5 font-serif text-2xl"
                    >
                        The moments along the way
                    </h2>
                    {sessions.data.length ? (
                        <div className="space-y-4">
                            {sessions.data.map((session) => (
                                <DiarySessionCard
                                    key={`${session.id}:${session.updated_at}`}
                                    session={session}
                                    run={playthrough}
                                    today={today}
                                />
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
                                Your next memory starts here.
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-[#bdb6b1]">
                                Log a session to record where this journey takes
                                you.
                            </p>
                        </div>
                    )}
                    <HistoryPagination
                        pagination={sessions}
                        label="Session pagination"
                    />
                </section>
            </div>
        </>
    );
}
