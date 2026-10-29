import { useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store, update } from '@/routes/playthroughs';
import { playthroughStatuses } from '@/types/history';
import type { HistoryPlatform, Playthrough } from '@/types/history';

export default function PlaythroughForm({
    gameSlug,
    platforms,
    today,
    run,
}: {
    gameSlug: string;
    platforms: HistoryPlatform[];
    today: string;
    run?: Playthrough;
}) {
    const form = useForm({
        label: run?.label ?? '',
        status: run?.status ?? 'playing',
        platform_id: run?.platform_id?.toString() ?? '',
        started_on: run ? (run.started_on ?? '') : today,
        finished_on: run?.finished_on ?? '',
    });
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                const options = { preserveScroll: true };
                if (run) form.put(update(run.id).url, options);
                else form.post(store(gameSlug).url, options);
            }}
            className="space-y-5"
        >
            <div className="space-y-2">
                <Label htmlFor="run-label">
                    Playthrough name{' '}
                    <span className="text-[#bdb6b1]">(optional)</span>
                </Label>
                <Input
                    id="run-label"
                    name="label"
                    value={form.data.label}
                    onChange={(event) =>
                        form.setData('label', event.target.value)
                    }
                    maxLength={100}
                    placeholder="First journey, New Game+, a fresh start…"
                    className="h-11 border-shadow bg-rein"
                    disabled={form.processing}
                />
                <InputError message={form.errors.label} role="alert" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="run-status">Playthrough status</Label>
                    <select
                        id="run-status"
                        name="status"
                        value={form.data.status}
                        onChange={(event) =>
                            form.setData(
                                'status',
                                event.target.value as Playthrough['status'],
                            )
                        }
                        disabled={form.processing}
                        className="h-11 w-full rounded-md border border-shadow bg-rein px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        {playthroughStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    <InputError message={form.errors.status} role="alert" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="run-platform">
                        Platform{' '}
                        <span className="text-[#bdb6b1]">(optional)</span>
                    </Label>
                    <select
                        id="run-platform"
                        name="platform_id"
                        value={form.data.platform_id}
                        onChange={(event) =>
                            form.setData('platform_id', event.target.value)
                        }
                        disabled={form.processing}
                        className="h-11 w-full rounded-md border border-shadow bg-rein px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <option value="">Not specified</option>
                        {platforms.map((platform) => (
                            <option key={platform.id} value={platform.id}>
                                {platform.name}
                            </option>
                        ))}
                    </select>
                    <InputError
                        message={form.errors.platform_id}
                        role="alert"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="run-started">
                        Started on{' '}
                        <span className="text-[#bdb6b1]">(optional)</span>
                    </Label>
                    <Input
                        id="run-started"
                        name="started_on"
                        type="date"
                        min="0001-01-01"
                        max={today}
                        value={form.data.started_on}
                        onChange={(event) =>
                            form.setData('started_on', event.target.value)
                        }
                        disabled={form.processing}
                        className="h-11 border-shadow bg-rein [color-scheme:dark]"
                    />
                    <InputError message={form.errors.started_on} role="alert" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="run-finished">
                        Finished on{' '}
                        <span className="text-[#bdb6b1]">(optional)</span>
                    </Label>
                    <Input
                        id="run-finished"
                        name="finished_on"
                        type="date"
                        min={form.data.started_on || '0001-01-01'}
                        max={today}
                        value={form.data.finished_on}
                        onChange={(event) =>
                            form.setData('finished_on', event.target.value)
                        }
                        disabled={form.processing}
                        className="h-11 border-shadow bg-rein [color-scheme:dark]"
                    />
                    <InputError
                        message={form.errors.finished_on}
                        role="alert"
                    />
                </div>
            </div>
            <p className="text-xs leading-6 text-[#bdb6b1]">
                These details belong to this playthrough. Your library status
                and rating stay as you saved them. Leave unknown dates blank.
            </p>
            <Button type="submit" disabled={form.processing}>
                {form.processing
                    ? 'Saving…'
                    : run
                      ? 'Save playthrough'
                      : 'Start a playthrough'}
            </Button>
        </form>
    );
}
