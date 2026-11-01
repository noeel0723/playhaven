import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import GameBanner from '@/components/game-banner';
import ProfileBanner from '@/components/profile-banner';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import type { CatalogGame } from '@/types/catalog';

export default function CatalogLayout({ children }: PropsWithChildren) {
    const page = usePage<{
        game?: CatalogGame;
        player?: { banner_url?: string | null };
    }>();
    const [failedSources, setFailedSources] = useState<string[]>([]);
    const game = page.component === 'games/show' ? page.props.game : undefined;
    const banner = [game?.banner_url, game?.cover_url].find(
        (source): source is string =>
            typeof source === 'string' &&
            source.length > 0 &&
            !failedSources.includes(source),
    );
    const profileSource = ['players/me', 'players/show'].includes(
        page.component,
    )
        ? page.props.player?.banner_url
        : null;
    const profileBanner =
        profileSource && !failedSources.includes(profileSource)
            ? profileSource
            : null;
    const hasBanner = Boolean(banner || profileBanner);
    function failSource(source: string) {
        setFailedSources((sources) =>
            sources.includes(source) ? sources : [...sources, source],
        );
    }
    return (
        <div className="dark relative isolate flex min-h-svh flex-col bg-caviar bg-[radial-gradient(ellipse_at_top,rgba(92,85,81,0.14),transparent_70%)] text-[#f4f1ed] selection:bg-mustang selection:text-caviar">
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
            {profileBanner && (
                <ProfileBanner
                    key={profileBanner}
                    src={profileBanner}
                    onError={() => failSource(profileBanner)}
                />
            )}
            <a
                href="#catalog-main"
                className="sr-only z-50 rounded-md bg-white p-3 text-black focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
            >
                Skip to content
            </a>
            <div
                className={`relative z-20 ${hasBanner ? '' : 'border-b border-white/10'}`}
            >
                <SiteHeader />
            </div>
            <main
                id="catalog-main"
                tabIndex={-1}
                className={`relative z-10 mx-auto w-full max-w-7xl flex-1 px-6 pb-10 sm:px-10 sm:pb-12 ${profileBanner ? 'pt-40 sm:pt-52 lg:pt-72' : banner ? 'pt-36 sm:pt-48 lg:pt-60' : 'pt-10 sm:pt-12'}`}
            >
                {children}
            </main>
            <SiteFooter />
        </div>
    );
}
