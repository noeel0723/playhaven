export default function GameBanner({
    src,
    onError,
}: {
    src: string;
    onError: () => void;
}) {
    return (
        <div
            aria-hidden="true"
            data-game-banner
            className="pointer-events-none absolute inset-x-0 top-0 h-[clamp(24rem,50vw,40rem)] overflow-hidden"
        >
            <div className="relative mx-auto h-full max-w-[1600px]">
                <img
                    src={src}
                    alt=""
                    width={1600}
                    height={900}
                    fetchPriority="high"
                    decoding="async"
                    onError={onError}
                    className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(1,1,1,0.55)_0%,rgba(1,1,1,0.1)_25%,rgba(1,1,1,0.35)_50%,rgba(1,1,1,0.9)_78%,#010101_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#010101_0%,transparent_20%,transparent_80%,#010101_100%)]" />
            </div>
        </div>
    );
}
