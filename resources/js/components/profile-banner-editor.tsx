import { useForm } from '@inertiajs/react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store, destroy } from '@/routes/players/banner';

export default function ProfileBannerEditor({
    bannerUrl,
}: {
    bannerUrl: string | null;
}) {
    const form = useForm<{ banner: File | null }>({ banner: null });
    const removal = useForm({});
    const [preview, setPreview] = useState<string | null>(null);
    const [failed, setFailed] = useState<string | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const busy = form.processing || removal.processing;
    const source = preview ?? bannerUrl;
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
            id="profile-banner"
            aria-labelledby="profile-banner-title"
            aria-busy={busy}
            className="min-w-0 scroll-mt-8 font-sans"
        >
            <h2
                id="profile-banner-title"
                className="border-b border-shadow pb-3 text-xs font-medium tracking-[0.16em] text-[#c5bfba] uppercase sm:text-sm"
            >
                Profile banner
            </h2>
            <div className="mt-4 max-w-xl">
                <div
                    className="relative mb-3 aspect-[8/3] overflow-hidden rounded-md border border-white/10 bg-rein/40"
                    aria-label={preview ? 'Banner preview' : 'Current banner'}
                >
                    {source && source !== failed ? (
                        <img
                            src={source}
                            alt=""
                            onError={() => setFailed(source)}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center gap-2 text-xs text-[#bdb6b1]">
                            <ImagePlus className="size-5" aria-hidden="true" />{' '}
                            No banner yet
                        </div>
                    )}
                    {preview && (
                        <p className="absolute right-2 bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-[11px] text-white">
                            Preview · save to apply
                        </p>
                    )}
                </div>
                <form
                    className="space-y-2"
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
                        htmlFor="profile-banner-file"
                        className="text-xs text-[#bdb6b1]"
                    >
                        Choose a banner
                    </Label>
                    <Input
                        ref={input}
                        id="profile-banner-file"
                        name="banner"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy}
                        aria-invalid={Boolean(form.errors.banner)}
                        aria-describedby="profile-banner-help"
                        className="h-auto min-h-8 w-full min-w-0 border-shadow bg-rein px-2 py-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-[#4e4949] file:px-2 file:py-1 file:text-xs file:text-white"
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
                                    'banner',
                                    'Choose a JPEG, PNG, or WebP image up to 5 MB.',
                                );
                                return;
                            }
                            form.setData('banner', file);
                            setPreview(URL.createObjectURL(file));
                        }}
                    />
                    <p
                        id="profile-banner-help"
                        className="text-[11px] leading-5 text-[#bdb6b1]"
                    >
                        JPEG, PNG or WebP · Up to 5 MB · 600–5000 × 200–3000 px.
                        Center-cropped to 1600 × 600. Visible with your profile.
                    </p>
                    {form.errors.banner && (
                        <p role="alert" className="text-xs text-red-300">
                            {form.errors.banner}
                        </p>
                    )}
                    {form.progress?.percentage !== undefined && (
                        <p role="status" className="text-[11px] text-[#bdb6b1]">
                            {form.progress.percentage}% uploaded
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="submit"
                            disabled={!form.data.banner || busy}
                            className="h-7 gap-1.5 px-2.5 text-[11px] [&_svg]:size-3.5"
                        >
                            <ImagePlus aria-hidden="true" />
                            {form.processing ? 'Uploading…' : 'Save banner'}
                        </Button>
                        {preview && (
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={busy}
                                onClick={clearSelection}
                                className="h-7 px-2.5 text-[11px]"
                            >
                                Cancel selection
                            </Button>
                        )}
                        {bannerUrl && (
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={busy}
                                className="h-7 gap-1.5 px-2.5 text-[11px] text-[#bdb6b1] [&_svg]:size-3.5"
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
                                    : 'Remove banner'}
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
        </section>
    );
}
