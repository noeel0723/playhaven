import type { PropsWithChildren } from 'react';
import SiteHeader from '@/components/site-header';

export default function CatalogLayout({ children }: PropsWithChildren) {
    return (
        <div className="dark min-h-svh bg-caviar bg-[radial-gradient(ellipse_at_top,rgba(92,85,81,0.14),transparent_70%)] text-[#f4f1ed] selection:bg-mustang selection:text-caviar">
            <a
                href="#catalog-main"
                className="sr-only z-50 rounded-md bg-white p-3 text-black focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
            >
                Skip to content
            </a>
            <div className="border-b border-white/10">
                <SiteHeader />
            </div>
            <main
                id="catalog-main"
                tabIndex={-1}
                className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-12"
            >
                {children}
            </main>
            <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-white/10 px-6 py-8 text-xs text-[#bdb6b1] sm:px-10">
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
