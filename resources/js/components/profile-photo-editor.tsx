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
    horizontal = false,
}: {
    name: string;
    avatarUrl: string | null;
    embedded?: boolean;
    horizontal?: boolean;
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
                    : 'mt-9 scroll-mt-8 rounded-xl border border-shadow bg-rein/15 p-5 sm:p-6'
            }
            aria-busy={busy}
        >
            <h2
                id="profile-photo-title"
                className={
                    embedded
                        ? 'border-b border-shadow pb-3 text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm'
                        : 'font-serif text-2xl'
                }
            >
                Profile photo
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#bdb6b1]">
                A familiar face for your haven. Your photo follows your player
                profile visibility.
            </p>
            <div
                className={
                    horizontal
                        ? 'mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12'
                        : undefined
                }
            >
                <div
                    className={
                        horizontal
                            ? 'flex flex-wrap items-center gap-5'
                            : 'mt-6 flex flex-wrap items-center gap-5'
                    }
                >
                    <PlayerAvatar
                        key={preview ?? avatarUrl ?? 'initials'}
                        name={name}
                        src={preview ?? avatarUrl}
                        className="size-24 border-2 sm:size-28"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#e0d9d3]">
                            {preview
                                ? 'Preview · save to apply'
                                : avatarUrl
                                  ? 'Your current photo'
                                  : 'Make this profile yours'}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-[#bdb6b1]">
                            JPEG, PNG, or WebP. Up to 5 MB and 64–4096 pixels
                            per side. Saved as a centered square; a face near
                            the center works best.
                        </p>
                    </div>
                </div>
                <div className="min-w-0">
                    <form
                        className={horizontal ? 'space-y-4' : 'mt-6 space-y-4'}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(store().url, {
                                forceFormData: true,
                                preserveScroll: true,
                                onSuccess: clearSelection,
                            });
                        }}
                    >
                        <Label htmlFor="profile-photo-file">
                            Choose a photo
                        </Label>
                        <Input
                            ref={input}
                            id="profile-photo-file"
                            name="avatar"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={busy}
                            className="h-auto min-h-10 w-full min-w-0 border-shadow bg-rein text-xs file:mr-3 file:rounded file:border-0 file:bg-[#4e4949] file:px-3 file:py-2 file:text-xs file:text-white"
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
                            className="text-xs leading-6 text-[#bdb6b1]"
                        >
                            If your profile is private, only you can access the
                            photo. Turning the profile public shares it on your
                            profile and public contributions.
                        </p>
                        {form.errors.avatar && (
                            <p role="alert" className="text-sm text-red-300">
                                {form.errors.avatar}
                            </p>
                        )}
                        {form.progress?.percentage !== undefined && (
                            <p role="status" className="text-xs text-[#bdb6b1]">
                                {form.progress.percentage}% uploaded
                            </p>
                        )}
                        <div className="flex flex-wrap gap-3">
                            <Button
                                type="submit"
                                disabled={!form.data.avatar || busy}
                            >
                                <Camera aria-hidden="true" />
                                {form.processing ? 'Uploading…' : 'Save photo'}
                            </Button>
                            {preview && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={busy}
                                    onClick={clearSelection}
                                >
                                    Cancel selection
                                </Button>
                            )}
                        </div>
                    </form>
                    {avatarUrl && (
                        <form
                            className="mt-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                removal.delete(destroy().url, {
                                    preserveScroll: true,
                                    onSuccess: clearSelection,
                                });
                            }}
                        >
                            <Button
                                type="submit"
                                variant="ghost"
                                disabled={busy}
                                className="text-[#bdb6b1]"
                            >
                                <Trash2 aria-hidden="true" />
                                {removal.processing
                                    ? 'Removing…'
                                    : 'Remove photo'}
                            </Button>
                        </form>
                    )}
                    {Object.values(removal.errors).length > 0 && (
                        <p role="alert" className="mt-3 text-sm text-red-300">
                            {Object.values(removal.errors).join(' ')}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
