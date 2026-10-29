import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import RawgGameCard from '@/components/rawg-game-card';
import { refresh } from '@/routes/games/connections';
import { connectionTypes } from '@/types/connections';
import type { ConnectionState, GameConnection } from '@/types/connections';

function ConnectionCard({ connection }: { connection: GameConnection }) {
    return (
        <div className="min-w-0">
            <RawgGameCard
                game={{
                    id: connection.rawg_id,
                    name: connection.name,
                    released_on: connection.released_on,
                    cover_url: connection.cover_url,
                    local_slug: connection.local_slug,
                }}
            />
            <p className="mt-3 text-xs text-[#bdb6b1]">
                {connection.source === 'curated'
                    ? 'PlayHaven curation'
                    : 'From RAWG'}
            </p>
            {connection.note && (
                <p className="mt-2 text-xs leading-6 break-words text-[#c5bfba]">
                    {connection.note}
                </p>
            )}
            {connection.source_url && (
                <a
                    href={connection.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block rounded-sm text-xs text-[#c5bfba] underline underline-offset-4 focus-visible:outline-2"
                >
                    Relationship source
                </a>
            )}
        </div>
    );
}

export default function GameConnections({
    gameSlug,
    connections,
    state,
    reviewsPage,
}: {
    gameSlug: string;
    connections: GameConnection[];
    state: ConnectionState;
    reviewsPage: number;
}) {
    const attempted = useRef(false);
    const { post, processing, errors } = useForm<{
        connections?: string;
        reviews_page: number;
    }>({ reviews_page: reviewsPage });
    useEffect(() => {
        if (state.can_refresh && !attempted.current) {
            attempted.current = true;
            post(refresh(gameSlug).url, { preserveScroll: true });
        }
    }, [state.can_refresh, gameSlug, post]);
    if (!state.supported && connections.length === 0) return null;
    return (
        <section
            aria-labelledby="connected-worlds"
            className="my-12 border-t border-white/10 pt-9"
        >
            <h2 id="connected-worlds" className="font-serif text-3xl">
                Connected worlds
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#bdb6b1]">
                Follow a continuing story, explore a shared world, or discover
                more of the series.
            </p>
            {processing && (
                <p
                    role="status"
                    className="mt-5 flex items-center gap-2 text-sm text-[#c5bfba]"
                >
                    <LoaderCircle
                        className="size-4 motion-safe:animate-spin"
                        aria-hidden="true"
                    />
                    Finding connected games…
                </p>
            )}
            {errors.connections && (
                <p
                    role="alert"
                    className="mt-5 text-sm leading-6 text-[#d8bcb2]"
                >
                    {errors.connections}
                </p>
            )}
            {!processing && connections.length === 0 && (
                <p className="mt-5 text-sm leading-7 text-[#bdb6b1]">
                    {state.synced_at
                        ? 'No connections are available for this game yet.'
                        : state.checked_at
                          ? 'Connection data is temporarily unavailable. It can refresh again in a few minutes.'
                          : 'Connection data will load when you open this game while logged in.'}
                </p>
            )}
            {connectionTypes.map((type) => {
                const group = connections.filter(
                    (connection) => connection.type === type.value,
                );
                if (!group.length) return null;
                return (
                    <section
                        key={type.value}
                        aria-labelledby={`connections-${type.value}`}
                        className="mt-9"
                    >
                        <h3
                            id={`connections-${type.value}`}
                            className="mb-5 font-serif text-2xl"
                        >
                            {type.label}
                        </h3>
                        {type.value === 'series' && (
                            <p className="mb-5 text-xs leading-6 text-[#bdb6b1]">
                                Series entries are shown by release date. Their
                                story order may differ.
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3">
                            {group.slice(0, 6).map((connection) => (
                                <ConnectionCard
                                    key={connection.id}
                                    connection={connection}
                                />
                            ))}
                        </div>
                        {group.length > 6 && (
                            <details className="mt-6">
                                <summary className="cursor-pointer rounded-sm text-sm text-[#c5bfba] underline underline-offset-4 focus-visible:outline-2">
                                    Show {group.length - 6} more connected games
                                </summary>
                                <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3">
                                    {group.slice(6).map((connection) => (
                                        <ConnectionCard
                                            key={connection.id}
                                            connection={connection}
                                        />
                                    ))}
                                </div>
                            </details>
                        )}
                    </section>
                );
            })}
            {state.truncated && (
                <p className="mt-6 text-xs leading-6 text-[#bdb6b1]">
                    RAWG has additional related entries beyond this selection.
                </p>
            )}
        </section>
    );
}
