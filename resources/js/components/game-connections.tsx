import CatalogGameCard from '@/components/catalog-game-card';
import { connectionTypes } from '@/types/connections';
import type { ConnectionState, GameConnection } from '@/types/connections';

function ConnectionCard({ connection }: { connection: GameConnection }) {
    return (
        <div className="min-w-0">
            <CatalogGameCard
                compact
                dense
                game={{
                    id: connection.thegamesdb_id,
                    name: connection.name,
                    released_on: connection.released_on,
                    cover_url: connection.cover_url,
                    local_slug: connection.local_slug,
                }}
            />
            <p className="mt-1.5 text-[11px] leading-4 text-[#bdb6b1]">
                PlayHaven curation
            </p>
            {(connection.note || connection.source_url) && (
                <details className="mt-1 text-[11px]">
                    <summary className="min-h-7 cursor-pointer rounded-sm py-1.5 text-[#bdb6b1] focus-visible:outline-2 focus-visible:outline-offset-2">
                        Relationship details
                    </summary>
                    {connection.note && (
                        <p className="mt-1 leading-4 wrap-break-word text-[#c5bfba]">
                            {connection.note}
                        </p>
                    )}
                    {connection.source_url && (
                        <a
                            href={connection.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex min-h-7 items-center rounded-sm text-[11px] text-[#c5bfba] underline underline-offset-4 focus-visible:outline-2"
                        >
                            Relationship source
                        </a>
                    )}
                </details>
            )}
        </div>
    );
}

export default function GameConnections({
    connections,
}: {
    gameSlug: string;
    connections: GameConnection[];
    state: ConnectionState;
    reviewsPage: number;
}) {
    if (connections.length === 0) return null;
    return (
        <section
            aria-labelledby="connected-worlds"
            className="border-t border-white/10 pt-4 font-sans"
        >
            <h2
                id="connected-worlds"
                className="text-xs font-medium tracking-[0.1em] uppercase"
            >
                Connected worlds
            </h2>
            {connectionTypes.map((type) => {
                const group = connections.filter(
                    (connection) => connection.type === type.value,
                );
                if (!group.length) return null;
                return (
                    <section
                        key={type.value}
                        aria-labelledby={`connections-${type.value}`}
                        className="mt-4"
                    >
                        <h3
                            id={`connections-${type.value}`}
                            className="mb-2 text-xs font-medium text-[#d5cec7]"
                        >
                            {type.label}
                        </h3>
                        {type.value === 'series' && (
                            <p className="mb-2 text-[11px] leading-4 text-[#bdb6b1]">
                                Series entries are shown by release date. Their
                                story order may differ.
                            </p>
                        )}
                        <div className="grid max-w-[268px] grid-cols-2 gap-x-3 gap-y-4 sm:max-w-none sm:grid-cols-[repeat(auto-fill,128px)]">
                            {group.slice(0, 6).map((connection) => (
                                <ConnectionCard
                                    key={connection.id}
                                    connection={connection}
                                />
                            ))}
                        </div>
                        {group.length > 6 && (
                            <details className="mt-3">
                                <summary className="min-h-7 cursor-pointer rounded-sm py-1.5 text-[11px] text-[#c5bfba] underline underline-offset-4 focus-visible:outline-2">
                                    Show {group.length - 6} more connected games
                                </summary>
                                <div className="mt-3 grid max-w-[268px] grid-cols-2 gap-x-3 gap-y-4 sm:max-w-none sm:grid-cols-[repeat(auto-fill,128px)]">
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
        </section>
    );
}
