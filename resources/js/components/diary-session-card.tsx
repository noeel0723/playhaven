import { Pencil } from 'lucide-react';
import { useState } from 'react';
import ConfirmHistoryDelete from '@/components/confirm-history-delete';
import DiarySessionForm from '@/components/diary-session-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { destroy } from '@/routes/sessions';
import { formatHistoryDate, formatMinutes } from '@/types/history';
import type { DiarySession, Playthrough } from '@/types/history';

export default function DiarySessionCard({
    session,
    run,
    today,
}: {
    session: DiarySession;
    run: Playthrough;
    today: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <article
            id={`diary-session-${session.id}`}
            className="min-w-0 scroll-mt-8 rounded-xl border border-shadow bg-rein/20 p-5 sm:p-6"
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-medium">
                    <time dateTime={session.logged_on}>
                        {formatHistoryDate(session.logged_on)}
                    </time>
                </h3>
                <span className="text-xs text-[#bdb6b1]">
                    {session.minutes_played === null
                        ? 'Duration not recorded'
                        : formatMinutes(session.minutes_played)}
                </span>
            </div>
            {session.notes ? (
                <p className="text-sm leading-7 break-words whitespace-pre-wrap text-[#c5bfba]">
                    {session.notes}
                </p>
            ) : (
                <p className="text-sm text-[#bdb6b1]">
                    No notes for this session.
                </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-[#bdb6b1]"
                        >
                            <Pencil aria-hidden="true" />
                            Edit session
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="dark max-h-[90svh] overflow-y-auto border-shadow bg-rein text-[#f4f1ed]">
                        <DialogHeader>
                            <DialogTitle>Edit playing session</DialogTitle>
                            <DialogDescription className="text-[#c5bfba]">
                                Update the date, duration, or notes for this
                                session.
                            </DialogDescription>
                        </DialogHeader>
                        <DiarySessionForm
                            key={session.updated_at}
                            run={run}
                            session={session}
                            today={today}
                            onSaved={() => setOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
                <ConfirmHistoryDelete
                    url={
                        destroy({ playthrough: run.id, diaryEntry: session.id })
                            .url
                    }
                    title="Delete this session?"
                    description="This diary session will be permanently removed. Your other sessions and playthrough will stay."
                    label="Delete session"
                />
            </div>
        </article>
    );
}
