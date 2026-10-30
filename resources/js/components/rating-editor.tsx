import { Star } from 'lucide-react';
import { useId, useRef, useState } from 'react';

export default function RatingEditor({
    rating,
    onChange,
    disabled = false,
}: {
    rating: number | null;
    onChange: (stars: number | null) => void;
    disabled?: boolean;
}) {
    const [preview, setPreview] = useState<number | null>(null);
    const choices = useRef<(HTMLButtonElement | null)[]>([]);
    const helpId = useId();
    const shown = preview ?? rating ?? 0;
    return (
        <div className="border-t border-white/10 px-4 py-4 text-center">
            <p className="mb-3 text-xs text-[#bdb6b1]">Your rating</p>
            <div
                role="group"
                aria-label="Rate this game"
                aria-describedby={helpId}
                aria-busy={disabled}
                className="mx-auto flex w-fit touch-manipulation gap-1"
                onPointerLeave={() => setPreview(null)}
                onPointerCancel={() => setPreview(null)}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                        setPreview(null);
                }}
            >
                {Array.from({ length: 5 }, (_, index) => (
                    <span key={index} className="relative block h-11 w-8">
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-x-0 top-1.5 h-8 ${preview !== null ? 'text-white' : 'text-[#d5cec7]'}`}
                        >
                            <Star className="absolute inset-0 size-8 text-[#807d7d]" />
                            <span
                                className="absolute inset-y-0 left-0 overflow-hidden"
                                style={{
                                    width: `${Math.min(1, Math.max(0, shown - index)) * 100}%`,
                                }}
                            >
                                <Star className="size-8 fill-current" />
                            </span>
                        </span>
                        {[0.5, 1].map((half, side) => {
                            const score = index + half;
                            const choiceIndex = index * 2 + side;
                            return (
                                <button
                                    key={half}
                                    ref={(node) => {
                                        choices.current[choiceIndex] = node;
                                    }}
                                    type="button"
                                    aria-label={`Rate ${score} out of 5 stars`}
                                    aria-pressed={rating === score}
                                    tabIndex={
                                        score === (rating ?? 0.5) ? 0 : -1
                                    }
                                    disabled={disabled}
                                    className={`absolute inset-y-0 w-1/2 cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait ${side === 0 ? 'left-0' : 'right-0'}`}
                                    onPointerEnter={(event) => {
                                        if (
                                            !disabled &&
                                            event.pointerType !== 'touch'
                                        )
                                            setPreview(score);
                                    }}
                                    onFocus={() => setPreview(score)}
                                    onClick={() => {
                                        setPreview(null);
                                        onChange(score);
                                    }}
                                    onKeyDown={(event) => {
                                        const next =
                                            event.key === 'ArrowRight' ||
                                            event.key === 'ArrowUp'
                                                ? Math.min(9, choiceIndex + 1)
                                                : event.key === 'ArrowLeft' ||
                                                    event.key === 'ArrowDown'
                                                  ? Math.max(0, choiceIndex - 1)
                                                  : event.key === 'Home'
                                                    ? 0
                                                    : event.key === 'End'
                                                      ? 9
                                                      : null;
                                        if (next !== null) {
                                            event.preventDefault();
                                            choices.current[next]?.focus();
                                        }
                                    }}
                                />
                            );
                        })}
                    </span>
                ))}
            </div>
            <p
                className="mt-2 min-h-5 text-xs text-[#bdb6b1]"
                aria-hidden="true"
            >
                {disabled
                    ? 'Saving…'
                    : shown
                      ? `${shown.toFixed(1)} / 5`
                      : 'Not rated'}
            </p>
            <p id={helpId} className="sr-only">
                Choose half or full stars. Use arrow keys to preview a score,
                then Enter or Space to save.
                {rating === null
                    ? ' No rating saved.'
                    : ` Saved rating: ${rating} out of 5 stars.`}
            </p>
            {rating !== null && (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                        setPreview(null);
                        onChange(null);
                    }}
                    className="mt-1 min-h-8 rounded-sm px-2 text-[11px] text-[#bdb6b1] underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                >
                    Clear rating
                </button>
            )}
        </div>
    );
}
