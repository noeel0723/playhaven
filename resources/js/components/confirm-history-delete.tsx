import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function ConfirmHistoryDelete({
    url,
    title,
    description,
    label,
    data,
    iconOnly = false,
    disabled = false,
}: {
    url: string;
    title: string;
    description: string;
    label: string;
    data?: Record<string, string | number | boolean>;
    iconOnly?: boolean;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({ ...data, confirm: true });
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className={`${iconOnly ? 'size-8 p-0' : ''} text-xs text-[#bdb6b1]`}
                >
                    <Trash2 aria-hidden="true" />
                    <span className={iconOnly ? 'sr-only' : undefined}>
                        {label}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="dark border-shadow bg-rein text-[#f4f1ed]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="leading-6 text-[#c5bfba]">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <InputError message={form.errors.confirm} role="alert" />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={form.processing}>
                            Keep it
                        </Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        disabled={form.processing}
                        onClick={() =>
                            form.delete(url, {
                                preserveScroll: true,
                                onSuccess: () => setOpen(false),
                            })
                        }
                    >
                        {form.processing ? 'Deleting…' : label}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
