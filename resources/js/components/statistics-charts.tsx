import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function StatSection({
    id,
    title,
    children,
    controls,
    detail,
}: {
    id: string;
    title: string;
    children: ReactNode;
    controls?: ReactNode;
    detail?: string;
}) {
    return (
        <section aria-labelledby={id} className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <h2
                    id={id}
                    className="text-xs font-medium tracking-[0.08em] text-[#e0d9d3] uppercase"
                >
                    {title}
                </h2>
                <span
                    className="h-px min-w-4 flex-1 bg-white/15"
                    aria-hidden="true"
                />
                {controls}
            </div>
            {children}
            {detail && (
                <p className="mt-3 text-[11px] leading-4 text-[#a9a19b]">
                    {detail}
                </p>
            )}
        </section>
    );
}

export function StatMetricTabs<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
}) {
    return (
        <div role="group" aria-label={label} className="flex flex-wrap gap-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                    className="min-h-7 rounded-sm px-2 text-[11px] text-[#a9a19b] transition-colors hover:bg-rein/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:bg-rein/50 aria-pressed:text-[#f4f1ed]"
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

type Bar = { label: string; value: number | null; description: string };
export function StatColumns({
    data,
    max,
    label,
    color = '#b8a795',
}: {
    data: Bar[];
    max?: number;
    label: string;
    color?: string;
}) {
    const ceiling = max ?? Math.max(1, ...data.map((item) => item.value ?? 0));
    const sparseLabels =
        data.length > 16 ||
        (data.length > 8 && data.some((item) => item.label.length > 3));
    return (
        <figure aria-label={label}>
            <ol
                className="grid h-36 items-end gap-1 border-b border-white/15 bg-[linear-gradient(to_top,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-size-[100%_25%] sm:h-44 sm:gap-1.5"
                style={{
                    gridTemplateColumns: `repeat(${Math.max(1, data.length)}, minmax(0, 1fr))`,
                    columnGap:
                        data.length > 120
                            ? 0
                            : data.length > 48
                              ? 1
                              : data.length > 24
                                ? 2
                                : undefined,
                }}
            >
                {data.map((item, position) => (
                    <li key={item.label} className="relative h-full min-w-0">
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <div
                                    tabIndex={item.value ? 0 : -1}
                                    role="img"
                                    aria-label={item.description}
                                    className="flex h-full items-end justify-center rounded-t-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#d5cec7]"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="w-full max-w-8 rounded-t-sm transition-opacity hover:opacity-80"
                                        style={{
                                            height: `${Math.min(100, Math.max(0, ((item.value ?? 0) / ceiling) * 100))}%`,
                                            backgroundColor: color,
                                        }}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="max-w-56 border border-white/15 bg-[#312e2e] text-center font-sans text-[11px] text-[#f4f1ed] [&_svg]:bg-[#312e2e] [&_svg]:fill-[#312e2e]"
                            >
                                {item.description}
                            </TooltipContent>
                        </Tooltip>
                        <span
                            aria-hidden="true"
                            className={`absolute -bottom-5 text-[9px] text-[#a9a19b] sm:text-[10px] ${sparseLabels ? (position === 0 ? 'left-0 w-max text-left' : position === data.length - 1 ? 'right-0 w-max text-right' : 'sr-only') : 'left-0 w-full text-center'}`}
                        >
                            {item.label}
                        </span>
                    </li>
                ))}
            </ol>
            <figcaption className="sr-only">{label}</figcaption>
            <details className="mt-8 text-[11px]">
                <summary className="min-h-7 w-fit cursor-pointer rounded-sm py-1 text-[#a9a19b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2">
                    View chart data
                </summary>
                <table className="mt-1 w-full text-left text-[11px]">
                    <caption className="sr-only">{label} data</caption>
                    <thead className="sr-only">
                        <tr>
                            <th scope="col">Category</th>
                            <th scope="col">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr
                                key={item.label}
                                className="border-t border-white/10"
                            >
                                <th
                                    scope="row"
                                    className="py-1.5 pr-3 font-normal text-[#e0d9d3]"
                                >
                                    {item.label}
                                </th>
                                <td className="py-1.5 text-right text-[#bdb6b1]">
                                    {item.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    );
}

export function StatRows({
    rows,
    color = '#b8a795',
    empty,
}: {
    rows: {
        key: string | number;
        name: string;
        value: number;
        detail: string;
        href?: string;
    }[];
    color?: string;
    empty: string;
}) {
    const max = Math.max(1, ...rows.map((row) => row.value));
    if (!rows.length)
        return <p className="py-4 text-xs leading-5 text-[#a9a19b]">{empty}</p>;
    return (
        <ol className="min-w-0 space-y-1.5">
            {rows.map((row) => {
                const content = (
                    <>
                        <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 rounded-sm opacity-15"
                            style={{
                                width: `${(row.value / max) * 100}%`,
                                backgroundColor: color,
                            }}
                        />
                        <span className="relative min-w-0 truncate text-xs text-[#d5cec7]">
                            {row.name}
                        </span>
                        <span className="relative shrink-0 text-[10px] text-[#bdb6b1] tabular-nums">
                            {row.detail}
                        </span>
                    </>
                );
                const className =
                    'relative flex min-h-8 min-w-0 items-center justify-between gap-2 rounded-sm px-2 focus-visible:outline-2 focus-visible:outline-offset-2';
                return (
                    <li key={row.key}>
                        {row.href ? (
                            <Link
                                href={row.href}
                                className={`${className} hover:bg-rein/30`}
                                title={`${row.name}: ${row.detail}`}
                            >
                                {content}
                            </Link>
                        ) : (
                            <div
                                className={className}
                                title={`${row.name}: ${row.detail}`}
                            >
                                {content}
                            </div>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
