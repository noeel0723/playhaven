import { useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import StarRating from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { update } from '@/routes/ratings';

export default function RatingEditor({
    gameSlug,
    rating,
}: {
    gameSlug: string;
    rating: number | null;
}) {
    const form = useForm<{ stars: number | null }>({ stars: rating });
    return (
        <section
            aria-labelledby="your-rating"
            className="mb-8 rounded-xl border border-shadow bg-rein/40 p-5 sm:p-6"
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 id="your-rating" className="font-serif text-2xl">
                    Your rating
                </h2>
                {rating !== null && <StarRating value={rating} />}
            </div>
            <p
                id="rating-help"
                className="mb-5 text-sm leading-6 text-[#bdb6b1]"
            >
                How did this world stay with you? Ratings are public and count
                toward the community average.
            </p>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(update(gameSlug).url, { preserveScroll: true });
                }}
            >
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-40 flex-1 space-y-2">
                        <Label htmlFor="personal-rating">Score out of 5</Label>
                        <select
                            id="personal-rating"
                            name="stars"
                            aria-describedby="rating-help"
                            value={form.data.stars ?? ''}
                            onChange={(event) =>
                                form.setData(
                                    'stars',
                                    event.target.value === ''
                                        ? null
                                        : Number(event.target.value),
                                )
                            }
                            disabled={form.processing}
                            className="h-11 w-full rounded-md border border-shadow bg-rein px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <option value="">Not rated</option>
                            {Array.from(
                                { length: 10 },
                                (_, index) => (index + 1) / 2,
                            ).map((stars) => (
                                <option key={stars} value={stars}>
                                    {stars.toFixed(1)}{' '}
                                    {stars === 1 ? 'star' : 'stars'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="h-11"
                    >
                        {form.processing ? 'Saving…' : 'Save rating'}
                    </Button>
                </div>
                <InputError
                    message={form.errors.stars}
                    role="alert"
                    className="mt-3"
                />
                {rating !== null && (
                    <p className="mt-3 text-xs text-[#bdb6b1]">
                        Choose Not rated and save to remove your rating. Your
                        review will stay.
                    </p>
                )}
            </form>
        </section>
    );
}
