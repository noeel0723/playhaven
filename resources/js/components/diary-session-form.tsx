import { useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store, update } from '@/routes/sessions';
import type { DiarySession, Playthrough } from '@/types/history';

export default function DiarySessionForm({
    run,
    today,
    session,
    onSaved,
}: {
    run: Playthrough;
    today: string;
    session?: DiarySession;
    onSaved?: () => void;
}) {
    const form = useForm({
        logged_on: session?.logged_on ?? run.finished_on ?? today,
        minutes_played: session?.minutes_played?.toString() ?? '',
        notes: session?.notes ?? '',
    });
    const prefix = session ? `session-${session.id}` : 'new-session';
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                const options = {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (!session) form.reset('minutes_played', 'notes');
                        onSaved?.();
                    },
                };
                if (session)
                    form.put(
                        update({ playthrough: run.id, diaryEntry: session.id })
                            .url,
                        options,
                    );
                else form.post(store(run.id).url, options);
            }}
            className="space-y-5"
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}-date`}>Date played</Label>
                    <Input
                        id={`${prefix}-date`}
                        type="date"
                        name="logged_on"
                        required
                        min={run.started_on ?? '0001-01-01'}
                        max={run.finished_on ?? today}
                        value={form.data.logged_on}
                        onChange={(event) =>
                            form.setData('logged_on', event.target.value)
                        }
                        disabled={form.processing}
                        className="h-11 border-shadow bg-rein [color-scheme:dark]"
                    />
                    <InputError message={form.errors.logged_on} role="alert" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}-minutes`}>
                        Minutes played{' '}
                        <span className="text-[#bdb6b1]">(optional)</span>
                    </Label>
                    <Input
                        id={`${prefix}-minutes`}
                        type="number"
                        name="minutes_played"
                        min={0}
                        max={1440}
                        step={1}
                        placeholder="e.g. 90"
                        value={form.data.minutes_played}
                        onChange={(event) =>
                            form.setData('minutes_played', event.target.value)
                        }
                        disabled={form.processing}
                        className="h-11 border-shadow bg-rein"
                    />
                    <InputError
                        message={form.errors.minutes_played}
                        role="alert"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${prefix}-notes`}>
                    Session notes{' '}
                    <span className="text-[#bdb6b1]">(optional)</span>
                </Label>
                <textarea
                    id={`${prefix}-notes`}
                    name="notes"
                    rows={4}
                    maxLength={5000}
                    value={form.data.notes}
                    onChange={(event) =>
                        form.setData('notes', event.target.value)
                    }
                    disabled={form.processing}
                    placeholder="A boss finally beaten. A quiet side quest. A moment to remember."
                    className="min-h-28 w-full rounded-md border border-shadow bg-rein px-3 py-2 text-sm leading-7 placeholder:text-[#a59d97] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                />
                <InputError message={form.errors.notes} role="alert" />
            </div>
            <p className="text-xs leading-6 text-[#bdb6b1]">
                Only you can read this diary. Log up to 1,440 minutes per
                session, or leave duration blank if unknown. Multiple sessions
                on the same day are welcome.
            </p>
            <Button type="submit" disabled={form.processing}>
                {form.processing
                    ? 'Saving…'
                    : session
                      ? 'Save session'
                      : 'Log session'}
            </Button>
        </form>
    );
}
