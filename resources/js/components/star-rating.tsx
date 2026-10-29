import { Star } from 'lucide-react';

export default function StarRating({ value }: { value: number }) {
    return (
        <span
            role="img"
            aria-label={`${value} out of 5 stars`}
            className="inline-flex items-center gap-1 text-[#d5cec7]"
        >
            {Array.from({ length: 5 }, (_, index) => (
                <span
                    key={index}
                    className="relative inline-block size-4"
                    aria-hidden="true"
                >
                    <Star className="absolute inset-0 size-4" />
                    <span
                        className="absolute inset-y-0 left-0 overflow-hidden"
                        style={{
                            width: `${Math.min(1, Math.max(0, value - index)) * 100}%`,
                        }}
                    >
                        <Star className="size-4 fill-current" />
                    </span>
                </span>
            ))}
        </span>
    );
}
