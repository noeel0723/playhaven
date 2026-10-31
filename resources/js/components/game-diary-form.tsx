import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import GameCover from '@/components/game-cover';
import InputError from '@/components/input-error';
import RatingEditor from '@/components/rating-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { options, store } from '@/routes/game-diary';
import { index as diary } from '@/routes/diary';
import { libraryStatuses } from '@/types/library';
import type { LibraryStatus } from '@/types/library';
import type { CatalogGame } from '@/types/catalog';

type DiaryOptions = {
    today: string;
    status: LibraryStatus | null;
    completed_on: string | null;
    stars: number | null;
    review: {
        body: string;
        contains_spoilers: boolean;
        is_public: boolean;
    } | null;
};
type Props = {
    game: CatalogGame;
    onSaved: () => void;
    onCancel: () => void;
    onProcessing: (processing: boolean) => void;
    returnToDiary?: boolean;
};
const controlClass =
    'h-8 min-w-0 w-full rounded-md border border-shadow bg-rein/50 px-2 text-xs md:text-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';
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
                    ? 'Could not load your game details. Please try again.'
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
    returnToDiary = false,
}: Props & { options: DiaryOptions }) {
    const form = useForm({
        status: options.status ?? 'playing',
        logged_on: options.today,
        completed_on: options.completed_on ?? options.today,
        stars: options.stars,
        review_body: options.review?.body ?? '',
        contains_spoilers: options.review?.contains_spoilers ?? false,
        is_public: options.review?.is_public ?? false,
        return_to_diary: returnToDiary,
    });
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
                    <p className="mt-1 text-[11px] text-[#bdb6b1]">
                        {game.released_on?.slice(0, 4) ?? 'Release TBA'}
                    </p>
                </div>
            </div>
            <fieldset disabled={form.processing} className="min-w-0 space-y-3">
                <legend className="sr-only">Game diary details</legend>
                <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="game-diary-status" className="text-xs">
                            Game status
                        </Label>
                        <select
                            id="game-diary-status"
                            value={form.data.status}
                            className={controlClass}
                            onChange={(event) =>
                                form.setData(
                                    'status',
                                    event.target.value as LibraryStatus,
                                )
                            }
                        >
                            {libraryStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                        {error('status')}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="game-diary-date" className="text-xs">
                            Log date
                        </Label>
                        <Input
                            id="game-diary-date"
                            type="date"
                            required
                            min="0001-01-01"
                            max={options.today}
                            value={form.data.logged_on}
                            className={controlClass + ' [color-scheme:dark]'}
                            onChange={(event) =>
                                form.setData('logged_on', event.target.value)
                            }
                        />
                        {error('logged_on')}
                    </div>
                </div>
                {form.data.status === 'completed' && (
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="game-diary-completed"
                            className="text-xs"
                        >
                            Completed on
                        </Label>
                        <Input
                            id="game-diary-completed"
                            type="date"
                            required
                            min="0001-01-01"
                            max={form.data.logged_on || options.today}
                            value={form.data.completed_on}
                            className={controlClass + ' [color-scheme:dark]'}
                            onChange={(event) =>
                                form.setData('completed_on', event.target.value)
                            }
                        />
                        {error('completed_on')}
                    </div>
                )}
                <div>
                    <RatingEditor
                        rating={form.data.stars}
                        onChange={(stars) => form.setData('stars', stars)}
                        disabled={form.processing}
                        compact
                        deferred
                    />
                    {error('stars')}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="game-diary-review" className="text-xs">
                        Review{' '}
                        <span className="text-[#bdb6b1]">(optional)</span>
                    </Label>
                    <textarea
                        id="game-diary-review"
                        rows={4}
                        maxLength={10000}
                        value={form.data.review_body}
                        className={
                            controlClass +
                            ' h-auto min-h-24 resize-y py-2 leading-5'
                        }
                        placeholder="Write your review…"
                        onChange={(event) =>
                            form.setData('review_body', event.target.value)
                        }
                    />
                    {error('review_body')}
                    {options.review && !form.data.review_body.trim() && (
                        <p className="text-[11px] leading-4 text-[#bdb6b1]">
                            Leaving this blank keeps your existing game review.
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-[#bdb6b1]">
                        <input
                            type="checkbox"
                            checked={form.data.contains_spoilers}
                            onChange={(event) =>
                                form.setData(
                                    'contains_spoilers',
                                    event.target.checked,
                                )
                            }
                        />{' '}
                        Contains spoilers
                    </label>
                    <div className="flex items-center gap-2">
                        <Label
                            htmlFor="game-diary-visibility"
                            className="text-[11px]"
                        >
                            Review visibility
                        </Label>
                        <select
                            id="game-diary-visibility"
                            className="h-7 rounded border border-shadow bg-rein/50 px-2 text-[11px]"
                            value={form.data.is_public ? 'public' : 'private'}
                            onChange={(event) =>
                                form.setData(
                                    'is_public',
                                    event.target.value === 'public',
                                )
                            }
                        >
                            <option value="private">Private</option>
                            <option value="public">Public</option>
                        </select>
                    </div>
                </div>
                {error('contains_spoilers')}
                {error('is_public')}
            </fieldset>
            <p className="text-[11px] leading-4 text-[#bdb6b1]">
                Saving updates your current library status, rating, and review.
                Diary logs stay private; publishing shares the review on the
                game page.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                {!returnToDiary && (
                    <Link
                        href={diary()}
                        className="inline-flex min-h-7 items-center text-[11px] text-[#bdb6b1] underline underline-offset-4 hover:text-white"
                        onClick={(event) => {
                            if (form.processing) event.preventDefault();
                        }}
                    >
                        Open diary
                    </Link>
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
                        {form.processing ? 'Saving…' : 'Save game log'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
