import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import GameBanner from '@/components/game-banner';
import SiteHeader from '@/components/site-header';
import type { CatalogGame } from '@/types/catalog';

export default function CatalogLayout({ children }: PropsWithChildren) {
    const page = usePage<{ game?: CatalogGame }>();
    const [failedSources, setFailedSources] = useState<string[]>([]);
    const game = page.component === 'games/show' ? page.props.game : undefined;
    const banner = [game?.banner_url, game?.cover_url].find(
        (source): source is string =>
            typeof source === 'string' &&
            source.length > 0 &&
            !failedSources.includes(source),
    );
    return (
        <div className="dark relative isolate min-h-svh bg-caviar bg-[radial-gradient(ellipse_at_top,rgba(92,85,81,0.14),transparent_70%)] text-[#f4f1ed] selection:bg-mustang selection:text-caviar">
            {banner && (
                <GameBanner
                    key={banner}
                    src={banner}
                    onError={() =>
                        setFailedSources((sources) =>
                            sources.includes(banner)
                                ? sources
                                : [...sources, banner],
                        )
                    }
                />
            )}
            <a
                href="#catalog-main"
                className="sr-only z-50 rounded-md bg-white p-3 text-black focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
            >
                Skip to content
            </a>
            <div
                className={`relative z-20 ${banner ? '' : 'border-b border-white/10'}`}
            >
                <SiteHeader />
            </div>
            <main
                id="catalog-main"
                tabIndex={-1}
                className={`relative z-10 mx-auto max-w-7xl px-6 pb-10 sm:px-10 sm:pb-12 ${banner ? 'pt-36 sm:pt-48 lg:pt-60' : 'pt-10 sm:pt-12'}`}
            >
                {children}
            </main>
            <footer className="relative z-10 mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-white/10 px-6 py-8 text-xs text-[#bdb6b1] sm:px-10">
                <span>PlayHaven · Your Games. Your Stories.</span>
                <span>
                    Game metadata and artwork from{' '}
                    <a
                        href="https://rawg.io"
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 hover:text-white"
                    >
                        RAWG
                    </a>
                    .
                </span>
            </footer>
        </div>
    );
}
