export default function ProfileBanner({
    src,
    onError,
}: {
    src: string;
    onError: () => void;
}) {
    return (
        <div
            aria-hidden="true"
            data-profile-banner
            className="pointer-events-none absolute inset-x-0 top-0 h-[clamp(22rem,42vw,38rem)] overflow-hidden"
        >
            <div className="relative mx-auto h-full max-w-[1600px]">
                <img
                    src={src}
                    alt=""
                    width={1600}
                    height={600}
                    fetchPriority="high"
                    decoding="async"
                    onError={onError}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(1,1,1,0.55)_0%,rgba(1,1,1,0.08)_28%,rgba(1,1,1,0.3)_52%,rgba(1,1,1,0.92)_82%,#010101_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#010101_0%,transparent_18%,transparent_82%,#010101_100%)]" />
            </div>
        </div>
    );
}
