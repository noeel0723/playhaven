import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CatalogPagination } from '@/types/catalog';

export default function HistoryPagination({
    pagination,
    label,
}: {
    pagination: Pick<CatalogPagination, 'links' | 'meta'>;
    label: string;
}) {
    if (!pagination.links.prev && !pagination.links.next) return null;
    return (
        <nav
            aria-label={label}
            className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6"
        >
            <p className="text-xs text-[#bdb6b1]">
                Page {pagination.meta.current_page} of{' '}
                {pagination.meta.last_page}
            </p>
            <div className="flex gap-3">
                {pagination.links.prev && (
                    <Button asChild variant="outline">
                        <Link href={pagination.links.prev} preserveScroll>
                            <ArrowLeft aria-hidden="true" />
                            Previous
                        </Link>
                    </Button>
                )}
                {pagination.links.next && (
                    <Button asChild variant="outline">
                        <Link href={pagination.links.next} preserveScroll>
                            Next
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                )}
            </div>
        </nav>
    );
}
