export default function DeveloperBanner({
    src,
    onError,
}: {
    src: string;
    onError: () => void;
}) {
    return (
        <div
            aria-hidden="true"
            data-developer-banner
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[520px] max-w-[1800px] overflow-hidden sm:h-[600px] lg:h-[680px]"
        >
            <img
                src={src}
                alt=""
                width={1800}
                height={1012}
                fetchPriority="high"
                decoding="async"
                onError={onError}
                className="h-full w-full object-cover object-[center_35%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,1,1,0.68)_0%,rgba(1,1,1,0.08)_28%,rgba(1,1,1,0.15)_45%,rgba(1,1,1,0.78)_70%,rgba(1,1,1,0.96)_88%,#010101_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#010101_0%,rgba(1,1,1,0.2)_14%,transparent_35%,transparent_65%,rgba(1,1,1,0.2)_86%,#010101_100%)] opacity-45 sm:opacity-80" />
        </div>
    );
}
