import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

type FilterValues = Record<string, string | number | boolean | null>;

/** Submit complete filter state, cancel stale searches, and keep keyboard focus. */
export function useAutoFilters<T extends FilterValues>(
    url: string,
    filters: T,
    validate?: (values: T) => boolean,
) {
    const [values, setValues] = useState(filters);
    const latest = useRef(filters);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const cancel = useRef<(() => void) | undefined>(undefined);
    const pending = useRef(false);
    const sequence = useRef(0);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!pending.current) {
            latest.current = filters;
            setValues(filters);
        }
    }, [filters]);
    useEffect(
        () => () => {
            clearTimeout(timer.current);
            cancel.current?.();
        },
        [],
    );

    function apply(next = latest.current, delay = 0, valid = true) {
        valid = valid && (validate?.(next) ?? true);
        const visit = ++sequence.current;
        clearTimeout(timer.current);
        cancel.current?.();
        cancel.current = undefined;
        latest.current = next;
        setValues(next);
        setErrors({});
        pending.current = valid;
        setProcessing(valid);
        if (!valid) return;

        const query = Object.fromEntries(
            Object.entries(next).map(([key, value]) => [
                key,
                typeof value === 'boolean' ? Number(value) : value,
            ]),
        );
        const submit = () =>
            router.get(url, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onCancelToken: (token) => {
                    cancel.current = () => token.cancel();
                },
                onError: (validationErrors) => {
                    if (visit === sequence.current) setErrors(validationErrors);
                },
                onFinish: () => {
                    if (visit === sequence.current) {
                        pending.current = false;
                        cancel.current = undefined;
                        setProcessing(false);
                    }
                },
            });
        if (delay) timer.current = setTimeout(submit, delay);
        else submit();
    }

    function change(patch: Partial<T>, delay = 0, valid = true) {
        apply({ ...latest.current, ...patch }, delay, valid);
    }
    return { values, change, apply, processing, errors };
}
