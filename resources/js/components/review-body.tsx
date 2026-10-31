import { useId, useState } from 'react';

export default function ReviewBody({ body }: { body: string }) {
    const id = useId();
    const [expanded, setExpanded] = useState(false);
    const expandable = body.length > 180 || body.split(/\r?\n/).length > 3;
    return (
        <div className="mt-2">
            <p
                id={id}
                className={`text-xs leading-5 wrap-break-word whitespace-pre-wrap text-[#c5bfba] ${expandable && !expanded ? 'line-clamp-3' : ''}`}
            >
                {body}
            </p>
            {expandable && (
                <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={id}
                    onClick={() => setExpanded(!expanded)}
                    className="mt-1 inline-flex h-7 items-center rounded px-1.5 text-[11px] text-[#bdb6b1] underline underline-offset-4 hover:bg-rein/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    {expanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </div>
    );
}
