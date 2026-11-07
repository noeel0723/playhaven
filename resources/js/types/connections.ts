export const connectionTypes = [
    { value: 'prequel', label: 'Prequels & earlier stories' },
    { value: 'sequel', label: 'Sequels & later stories' },
    { value: 'universe', label: 'Shared universe' },
    { value: 'series', label: 'More in this series' },
    { value: 'addition', label: 'Expansions, editions & extras' },
    { value: 'parent', label: 'Parent games' },
] as const;

export type GameConnection = {
    id: number;
    rawg_id: number;
    name: string;
    released_on: string | null;
    cover_url: string | null;
    local_slug: string | null;
    type: (typeof connectionTypes)[number]['value'];
    source: 'rawg' | 'curated';
    note: string | null;
    source_url: string | null;
};
export type ConnectionState = {
    can_refresh: boolean;
    supported: boolean;
    synced_at: string | null;
    checked_at: string | null;
    truncated: boolean;
};
