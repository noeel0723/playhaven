import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CatalogPagination } from '@/types/catalog';

export default function HistoryPagination({
    pagination,
    label,
    compact = false,
    preserveState = false,
}: {
    pagination: Pick<CatalogPagination, 'links' | 'meta'>;
    label: string;
    compact?: boolean;
    preserveState?: boolean;
}) {
    if (!pagination.links.prev && !pagination.links.next) return null;
    return (
        <nav
            aria-label={label}
            className={`flex flex-wrap items-center justify-between border-t border-white/10 ${compact ? 'mt-5 gap-3 pt-4' : 'mt-8 gap-4 pt-6'}`}
        >
            <p className="text-xs text-[#bdb6b1]">
                Page {pagination.meta.current_page} of{' '}
                {pagination.meta.last_page}
            </p>
            <div className="flex gap-3">
                {pagination.links.prev && (
                    <Button
                        asChild
                        variant="outline"
                        size={compact ? 'sm' : 'default'}
                        className={
                            compact
                                ? 'border-shadow bg-rein/30 text-[#f4f1ed] hover:bg-rein hover:text-white'
                                : undefined
                        }
                    >
                        <Link
                            href={pagination.links.prev}
                            preserveScroll={!compact}
                            preserveState={preserveState}
                        >
                            <ArrowLeft aria-hidden="true" />
                            Previous
                        </Link>
                    </Button>
                )}
                {pagination.links.next && (
                    <Button
                        asChild
                        variant="outline"
                        size={compact ? 'sm' : 'default'}
                        className={
                            compact
                                ? 'border-shadow bg-rein/30 text-[#f4f1ed] hover:bg-rein hover:text-white'
                                : undefined
                        }
                    >
                        <Link
                            href={pagination.links.next}
                            preserveScroll={!compact}
                            preserveState={preserveState}
                        >
                            Next
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                )}
            </div>
        </nav>
    );
}
