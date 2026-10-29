import { Star } from 'lucide-react';

export default function StarRating({
    value,
    compact = false,
}: {
    value: number;
    compact?: boolean;
}) {
    const size = compact ? 'size-2 sm:size-3' : 'size-4';
    return (
        <span
            role="img"
            aria-label={`${value} out of 5 stars`}
            className={`inline-flex items-center text-[#d5cec7] ${compact ? 'gap-0.5' : 'gap-1'}`}
        >
            {Array.from({ length: 5 }, (_, index) => (
                <span
                    key={index}
                    className={`relative inline-block ${size}`}
                    aria-hidden="true"
                >
                    <Star className={`absolute inset-0 ${size}`} />
                    <span
                        className="absolute inset-y-0 left-0 overflow-hidden"
                        style={{
                            width: `${Math.min(1, Math.max(0, value - index)) * 100}%`,
                        }}
                    >
                        <Star className={`${size} fill-current`} />
                    </span>
                </span>
            ))}
        </span>
    );
}
