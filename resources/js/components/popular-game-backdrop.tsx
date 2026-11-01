import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { FeaturedWorld } from '@/types/home';

export default function PopularGameBackdrop({
    world,
}: {
    world: FeaturedWorld | null;
}) {
    const [failedImages, setFailedImages] = useState<string[]>([]);
    const image = [world?.banner_url, world?.cover_url].find(
        (source): source is string =>
            typeof source === 'string' &&
            source.length > 0 &&
            !failedImages.includes(source),
    );
    return (
        <>
            {image && (
                <Head>
                    <link
                        head-key="popular-game-image"
                        rel="preload"
                        as="image"
                        href={image}
                    />
                </Head>
            )}
            <div
                data-popular-game-banner
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[520px] max-w-[1800px] overflow-hidden sm:h-[600px] lg:h-[680px]"
            >
                {image && (
                    <img
                        src={image}
                        alt=""
                        width={1920}
                        height={1080}
                        fetchPriority="high"
                        loading="eager"
                        onError={() =>
                            setFailedImages((sources) =>
                                sources.includes(image)
                                    ? sources
                                    : [...sources, image],
                            )
                        }
                        className="h-full w-full object-cover object-center"
                    />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,1,1,0.68)_0%,rgba(1,1,1,0.08)_30%,rgba(1,1,1,0.12)_47%,rgba(1,1,1,0.7)_73%,#010101_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#010101_0%,rgba(1,1,1,0.2)_14%,transparent_35%,transparent_65%,rgba(1,1,1,0.2)_86%,#010101_100%)] opacity-45 sm:opacity-80" />
            </div>
        </>
    );
}
