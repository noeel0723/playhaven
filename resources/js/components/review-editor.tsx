import { useForm } from '@inertiajs/react';
import { Globe, LockKeyhole, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { destroy, update } from '@/routes/reviews';
import type { PersonalReview } from '@/types/reviews';

export default function ReviewEditor({
    gameSlug,
    review,
    onSaved,
}: {
    gameSlug: string;
    review: PersonalReview | null;
    onSaved?: () => void;
}) {
    const form = useForm({
        body: review?.body ?? '',
        contains_spoilers: review?.contains_spoilers ?? false,
        is_public: review?.is_public ?? false,
    });
    const deletion = useForm({ confirm: true });
    const [open, setOpen] = useState(false);
    const busy = form.processing || deletion.processing;
    return (
        <section
            aria-labelledby="your-review"
            className="my-9 rounded-xl border border-shadow bg-rein/40 p-5 sm:p-6"
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 id="your-review" className="font-serif text-2xl">
                    Your story
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#c5bfba]">
                    {review?.is_public ? (
                        <>
                            <Globe className="size-3.5" aria-hidden="true" />
                            Public review
                        </>
                    ) : (
                        <>
                            <LockKeyhole
                                className="size-3.5"
                                aria-hidden="true"
                            />
                            Only you
                        </>
                    )}
                </span>
            </div>
            <p
                id="review-help"
                className="mb-5 text-sm leading-6 text-[#bdb6b1]"
            >
                The moments that stayed. The things you loved. Write a review in
                your own words.
            </p>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(update(gameSlug).url, {
                        preserveScroll: true,
                        onSuccess: onSaved,
                    });
                }}
                className="space-y-4"
            >
                <div className="space-y-2">
                    <Label htmlFor="review-body">Your review</Label>
                    <textarea
                        id="review-body"
                        name="body"
                        value={form.data.body}
                        onChange={(event) =>
                            form.setData('body', event.target.value)
                        }
                        required
                        maxLength={10000}
                        rows={7}
                        disabled={busy}
                        aria-describedby="review-help review-length"
                        className="min-h-40 w-full rounded-md border border-shadow bg-rein px-3 py-2 text-sm leading-7 placeholder:text-[#a59d97] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                        placeholder="What made this game memorable?"
                    />
                    <div
                        id="review-length"
                        className="text-right text-xs text-[#bdb6b1]"
                    >
                        {form.data.body.length.toLocaleString()} / 10,000
                    </div>
                    <InputError message={form.errors.body} role="alert" />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                    <label className="flex min-h-8 items-center gap-2.5 text-sm">
                        <input
                            type="checkbox"
                            checked={form.data.contains_spoilers}
                            onChange={(event) =>
                                form.setData(
                                    'contains_spoilers',
                                    event.target.checked,
                                )
                            }
                            disabled={busy}
                            className="size-4 accent-[#c5bfba]"
                        />
                        Contains spoilers
                    </label>
                    <label className="flex min-h-8 items-center gap-2.5 text-sm">
                        <input
                            type="checkbox"
                            checked={form.data.is_public}
                            onChange={(event) =>
                                form.setData('is_public', event.target.checked)
                            }
                            disabled={busy}
                            className="size-4 accent-[#c5bfba]"
                        />
                        Share publicly
                    </label>
                </div>
                <p className="text-xs leading-5 text-[#bdb6b1]">
                    {form.data.is_public
                        ? 'Anyone can read this review with your account name. Spoilers stay collapsed until opened.'
                        : 'This review is visible only to you. Your rating is still included in the community average.'}
                </p>
                <InputError
                    message={
                        form.errors.contains_spoilers || form.errors.is_public
                    }
                    role="alert"
                />
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={busy}>
                        {form.processing
                            ? 'Saving…'
                            : form.data.is_public
                              ? 'Publish review'
                              : 'Save private review'}
                    </Button>
                </div>
            </form>
            {review && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            className="mt-4 text-xs text-[#bdb6b1]"
                        >
                            <Trash2 aria-hidden="true" />
                            Delete review
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="dark border-shadow bg-rein text-[#f4f1ed]">
                        <DialogHeader>
                            <DialogTitle>Delete your review?</DialogTitle>
                            <DialogDescription className="leading-6 text-[#c5bfba]">
                                Your review will be permanently deleted. Your
                                rating, library status, and playing history will
                                stay.
                            </DialogDescription>
                        </DialogHeader>
                        <InputError
                            message={deletion.errors.confirm}
                            role="alert"
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    disabled={deletion.processing}
                                >
                                    Keep review
                                </Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                disabled={busy}
                                onClick={() =>
                                    deletion.delete(destroy(gameSlug).url, {
                                        preserveScroll: true,
                                        onSuccess: () => setOpen(false),
                                    })
                                }
                            >
                                {deletion.processing
                                    ? 'Deleting…'
                                    : 'Delete review'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </section>
    );
}
