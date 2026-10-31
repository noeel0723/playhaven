import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import GameCover from '@/components/game-cover';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { options, store } from '@/routes/game-diary';
import { index as playthroughs } from '@/routes/playthroughs';
import type { CatalogGame } from '@/types/catalog';
import { playthroughStatuses } from '@/types/history';

type DiaryOptions = {
    today: string;
    playthroughs: {
        id: number;
        label: string | null;
        status: string;
        platform: string | null;
        started_on: string | null;
        finished_on: string | null;
    }[];
};
type Props = {
    game: CatalogGame;
    onSaved: () => void;
    onCancel: () => void;
    onProcessing: (processing: boolean) => void;
};
const controlClass =
    'h-8 min-w-0 w-full rounded-md border border-shadow bg-rein/50 px-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';
const buttonClass = 'h-7 px-2.5 text-[11px]';

export default function GameDiaryForm(props: Props) {
    const [data, setData] = useState<DiaryOptions | null>(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        fetch(options(props.game.slug).url, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) throw new Error('Diary unavailable');
                const result: DiaryOptions = await response.json();
                if (!controller.signal.aborted) setData(result);
            })
            .catch(() => {
                if (!controller.signal.aborted) setFailed(true);
            });
        return () => controller.abort();
    }, [props.game.slug, attempt]);

    if (data) return <LoadedDiaryForm {...props} options={data} />;
    return (
        <div className="space-y-3 border-t border-white/10 pt-4 text-xs">
            <p role={failed ? 'alert' : 'status'} className="text-[#bdb6b1]">
                {failed
                    ? 'Could not load your playthroughs. Please try again.'
                    : 'Loading your diary…'}
            </p>
            {failed && (
                <Button
                    type="button"
                    variant="outline"
                    className={buttonClass}
                    onClick={() => {
                        setFailed(false);
                        setAttempt(attempt + 1);
                    }}
                >
                    Try again
                </Button>
            )}
        </div>
    );
}

function LoadedDiaryForm({
    game,
    options,
    onSaved,
    onCancel,
    onProcessing,
}: Props & { options: DiaryOptions }) {
    const firstRun = options.playthroughs[0];
    const form = useForm({
        playthrough_id: firstRun ? String(firstRun.id) : '',
        logged_on: firstRun?.finished_on ?? options.today,
        minutes_played: '',
        notes: '',
        label: '',
        status: 'playing',
        platform_id: '',
    });
    const run = options.playthroughs.find(
        (item) => String(item.id) === form.data.playthrough_id,
    );
    const statusName = (status: string) =>
        playthroughStatuses.find((item) => item.value === status)?.label ??
        status;
    const error = (field: keyof typeof form.data) => (
        <InputError
            className="text-[11px]"
            message={form.errors[field]}
            role="alert"
        />
    );

    return (
        <form
            className="space-y-4 border-t border-white/10 pt-4"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(store(game.slug).url, {
                    preserveScroll: true,
                    errorBag: 'gameDiary',
                    onStart: () => onProcessing(true),
                    onFinish: () => onProcessing(false),
                    onSuccess: onSaved,
                });
            }}
        >
            <div className="flex items-center gap-3">
                <GameCover
                    game={game}
                    compact
                    hideFallbackTitle
                    className="w-12 shrink-0 rounded-sm sm:w-14"
                />
                <div className="min-w-0">
                    <h3 className="text-sm leading-5 font-medium wrap-break-word">
                        {game.name}
                    </h3>
                    <p className="mt-1 text-[11px] leading-4 text-[#bdb6b1]">
                        {game.developers
                            ?.map((developer) => developer.name)
                            .join(', ') || 'Developer not listed'}
                        {game.released_on
                            ? ` · ${game.released_on.slice(0, 4)}`
                            : ''}
                    </p>
                </div>
            </div>
            <fieldset disabled={form.processing} className="min-w-0 space-y-3">
                <legend className="sr-only">Diary session details</legend>
                <div className="space-y-1.5">
                    <Label htmlFor="game-diary-run" className="text-xs">
                        Playthrough
                    </Label>
                    <select
                        id="game-diary-run"
                        className={controlClass}
                        value={form.data.playthrough_id}
                        onChange={(event) => {
                            const selected = options.playthroughs.find(
                                (item) =>
                                    String(item.id) === event.target.value,
                            );
                            let date = form.data.logged_on;
                            if (
                                selected?.started_on &&
                                date < selected.started_on
                            )
                                date = selected.started_on;
                            if (
                                selected?.finished_on &&
                                date > selected.finished_on
                            )
                                date = selected.finished_on;
                            form.setData({
                                ...form.data,
                                playthrough_id: event.target.value,
                                logged_on: date,
                            });
                            form.clearErrors();
                        }}
                    >
                        {options.playthroughs.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.label || `Playthrough #${item.id}`} ·{' '}
                                {statusName(item.status)}
                                {item.platform ? ` · ${item.platform}` : ''}
                            </option>
                        ))}
                        <option value="">New playthrough</option>
                    </select>
                    {error('playthrough_id')}
                </div>
                {!run && (
                    <div className="space-y-3 rounded-md border border-white/10 p-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="game-diary-status"
                                    className="text-xs"
                                >
                                    Run status
                                </Label>
                                <select
                                    id="game-diary-status"
                                    value={form.data.status}
                                    className={controlClass}
                                    onChange={(event) =>
                                        form.setData(
                                            'status',
                                            event.target.value,
                                        )
                                    }
                                >
                                    {playthroughStatuses.map((status) => (
                                        <option
                                            key={status.value}
                                            value={status.value}
                                        >
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                                {error('status')}
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="game-diary-platform"
                                    className="text-xs"
                                >
                                    Platform{' '}
                                    <span className="sr-only">(optional)</span>
                                </Label>
                                <select
                                    id="game-diary-platform"
                                    value={form.data.platform_id}
                                    className={controlClass}
                                    onChange={(event) =>
                                        form.setData(
                                            'platform_id',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">Not specified</option>
                                    {game.platforms.map((platform) => (
                                        <option
                                            key={platform.id}
                                            value={platform.id}
                                        >
                                            {platform.name}
                                        </option>
                                    ))}
                                </select>
                                {error('platform_id')}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="game-diary-label"
                                className="text-xs"
                            >
                                Playthrough name{' '}
                                <span className="text-[#bdb6b1]">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="game-diary-label"
                                value={form.data.label}
                                maxLength={100}
                                placeholder="e.g. First playthrough"
                                className={controlClass}
                                onChange={(event) =>
                                    form.setData('label', event.target.value)
                                }
                            />
                            {error('label')}
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="game-diary-date" className="text-xs">
                            Date played
                        </Label>
                        <Input
                            id="game-diary-date"
                            type="date"
                            required
                            min={run?.started_on ?? '0001-01-01'}
                            max={run?.finished_on ?? options.today}
                            value={form.data.logged_on}
                            className={`${controlClass} [color-scheme:dark]`}
                            onChange={(event) =>
                                form.setData('logged_on', event.target.value)
                            }
                        />
                        {error('logged_on')}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="game-diary-minutes" className="text-xs">
                            Minutes{' '}
                            <span className="text-[#bdb6b1]">(optional)</span>
                        </Label>
                        <Input
                            id="game-diary-minutes"
                            type="number"
                            min={0}
                            max={1440}
                            step={1}
                            placeholder="e.g. 90"
                            value={form.data.minutes_played}
                            className={controlClass}
                            onChange={(event) =>
                                form.setData(
                                    'minutes_played',
                                    event.target.value,
                                )
                            }
                        />
                        {error('minutes_played')}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="game-diary-notes" className="text-xs">
                        Session notes{' '}
                        <span className="text-[#bdb6b1]">(optional)</span>
                    </Label>
                    <textarea
                        id="game-diary-notes"
                        rows={3}
                        maxLength={5000}
                        value={form.data.notes}
                        className={`${controlClass} h-auto min-h-20 resize-y py-2 leading-5`}
                        placeholder="Add a note about this session…"
                        onChange={(event) =>
                            form.setData('notes', event.target.value)
                        }
                    />
                    {error('notes')}
                </div>
            </fieldset>
            <p className="text-[11px] leading-4 text-[#bdb6b1]">
                Only you can read this diary. Your library status, rating, and
                review stay unchanged.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                {options.playthroughs.length > 0 ? (
                    <Link
                        href={playthroughs(game.slug)}
                        className="inline-flex min-h-7 items-center text-[11px] text-[#bdb6b1] underline underline-offset-4 hover:text-white"
                        onClick={(event) => {
                            if (form.processing) event.preventDefault();
                        }}
                    >
                        View history
                    </Link>
                ) : (
                    <span className="text-[11px] text-[#bdb6b1]">
                        Also adds this game to your library.
                    </span>
                )}
                <div className="ml-auto flex gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        className={buttonClass}
                        disabled={form.processing}
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className={buttonClass}
                        disabled={form.processing}
                    >
                        {form.processing ? 'Saving…' : 'Log session'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
