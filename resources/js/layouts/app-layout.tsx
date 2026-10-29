import { Breadcrumbs } from '@/components/breadcrumbs';
import SiteHeader from '@/components/site-header';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-svh bg-background text-foreground">
            <a
                href="#app-main"
                className="sr-only z-50 rounded-md bg-white p-3 text-black focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
            >
                Skip to content
            </a>
            <div className="dark border-b border-white/10 bg-caviar text-[#f4f1ed]">
                <SiteHeader />
            </div>
            <main
                id="app-main"
                tabIndex={-1}
                className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-12"
            >
                {breadcrumbs.length > 0 && (
                    <div className="mb-8">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                )}
                {children}
            </main>
        </div>
    );
}
