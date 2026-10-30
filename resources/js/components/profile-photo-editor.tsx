import { useForm } from '@inertiajs/react';
import { Camera, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PlayerAvatar from '@/components/player-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store, destroy } from '@/routes/players/photo';

export default function ProfilePhotoEditor({
    name,
    avatarUrl,
    embedded = false,
}: {
    name: string;
    avatarUrl: string | null;
    embedded?: boolean;
}) {
    const form = useForm<{ avatar: File | null }>({ avatar: null });
    const removal = useForm({});
    const [preview, setPreview] = useState<string | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const busy = form.processing || removal.processing;
    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview],
    );
    function clearSelection() {
        form.reset();
        form.clearErrors();
        setPreview(null);
        if (input.current) input.current.value = '';
    }
    return (
        <section
            id="profile-photo"
            aria-labelledby="profile-photo-title"
            className={
                embedded
                    ? 'scroll-mt-8'
                    : 'mt-9 scroll-mt-8 rounded-lg border border-shadow p-4'
            }
            aria-busy={busy}
        >
            <h2
                id="profile-photo-title"
                className={
                    embedded
                        ? 'border-b border-shadow pb-3 text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm'
                        : 'text-sm font-medium'
                }
            >
                Profile photo
            </h2>
            <div className="mt-4 flex max-w-xl items-start gap-4">
                <PlayerAvatar
                    key={preview ?? avatarUrl ?? 'initials'}
                    name={name}
                    src={preview ?? avatarUrl}
                    className="size-16 shrink-0 border sm:size-20"
                />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#e0d9d3]">
                        {preview
                            ? 'Preview · save to apply'
                            : avatarUrl
                              ? 'Your current photo'
                              : 'Add your profile photo'}
                    </p>
                    <form
                        className="mt-2 space-y-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(store().url, {
                                forceFormData: true,
                                preserveScroll: true,
                                onSuccess: clearSelection,
                            });
                        }}
                    >
                        <Label
                            htmlFor="profile-photo-file"
                            className="text-xs text-[#bdb6b1]"
                        >
                            Choose a photo
                        </Label>
                        <Input
                            ref={input}
                            id="profile-photo-file"
                            name="avatar"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={busy}
                            className="h-auto min-h-8 w-full min-w-0 border-shadow bg-rein px-2 py-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-[#4e4949] file:px-2 file:py-1 file:text-xs file:text-white"
                            aria-invalid={Boolean(form.errors.avatar)}
                            aria-describedby="profile-photo-help"
                            onChange={(event) => {
                                form.clearErrors();
                                removal.clearErrors();
                                const file = event.target.files?.[0] ?? null;
                                if (!file) {
                                    clearSelection();
                                    return;
                                }
                                if (
                                    ![
                                        'image/jpeg',
                                        'image/png',
                                        'image/webp',
                                    ].includes(file.type) ||
                                    file.size > 5 * 1024 * 1024
                                ) {
                                    clearSelection();
                                    form.setError(
                                        'avatar',
                                        'Choose a JPEG, PNG, or WebP image up to 5 MB.',
                                    );
                                    return;
                                }
                                form.setData('avatar', file);
                                setPreview(URL.createObjectURL(file));
                            }}
                        />
                        <p
                            id="profile-photo-help"
                            className="text-[11px] leading-5 text-[#bdb6b1]"
                        >
                            JPEG, PNG or WebP · Up to 5 MB · 64–4096 px. Cropped
                            to a square.
                        </p>
                        {form.errors.avatar && (
                            <p role="alert" className="text-xs text-red-300">
                                {form.errors.avatar}
                            </p>
                        )}
                        {form.progress?.percentage !== undefined && (
                            <p role="status" className="text-xs text-[#bdb6b1]">
                                {form.progress.percentage}% uploaded
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!form.data.avatar || busy}
                                className="h-8 text-xs"
                            >
                                <Camera aria-hidden="true" />
                                {form.processing ? 'Uploading…' : 'Save photo'}
                            </Button>
                            {preview && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={busy}
                                    onClick={clearSelection}
                                    className="h-8 text-xs"
                                >
                                    Cancel selection
                                </Button>
                            )}
                            {avatarUrl && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={busy}
                                    className="h-8 text-xs text-[#bdb6b1]"
                                    onClick={() =>
                                        removal.delete(destroy().url, {
                                            preserveScroll: true,
                                            onSuccess: clearSelection,
                                        })
                                    }
                                >
                                    <Trash2 aria-hidden="true" />
                                    {removal.processing
                                        ? 'Removing…'
                                        : 'Remove photo'}
                                </Button>
                            )}
                        </div>
                    </form>
                    {Object.values(removal.errors).length > 0 && (
                        <p role="alert" className="mt-2 text-xs text-red-300">
                            {Object.values(removal.errors).join(' ')}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
