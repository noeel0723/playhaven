import { Head, Link, useForm } from '@inertiajs/react';
import ProfileShowcaseEditor from '@/components/profile-showcase-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as community } from '@/routes/community';
import { update, show } from '@/routes/players';
import type { PlayerProfile } from '@/types/community';
import type { CatalogGame } from '@/types/catalog';

export default function EditPlayer({
    profile,
    topGames,
    availableGames,
    query,
}: {
    profile: PlayerProfile | null;
    topGames: CatalogGame[];
    availableGames: CatalogGame[];
    query: string;
}) {
    const form = useForm({
        username: profile?.username ?? '',
        display_name: profile?.display_name ?? '',
        bio: profile?.bio ?? '',
        is_public: profile?.is_public ?? false,
    });
    return (
        <>
            <Head title="Your player profile" />
            <div className="mx-auto max-w-2xl">
                <Link
                    href={community()}
                    className="mb-8 inline-block text-sm text-[#bdb6b1] underline underline-offset-4"
                >
                    Back to community
                </Link>
                <h1 className="text-4xl font-medium tracking-tight">
                    Your player profile
                </h1>
                <p className="mt-5 text-sm leading-7 text-[#bdb6b1]">
                    Choose how the community gets to know you. Your email and
                    account settings are never shown on this profile.
                </p>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put(update().url, { preserveScroll: true });
                    }}
                    className="mt-9 space-y-7"
                >
                    <div className="space-y-3">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            value={form.data.username}
                            onChange={(event) =>
                                form.setData('username', event.target.value)
                            }
                            required
                            minLength={3}
                            maxLength={30}
                            autoComplete="username"
                            className="border-shadow bg-rein"
                            aria-describedby="username-help"
                            aria-invalid={Boolean(form.errors.username)}
                        />
                        <p
                            id="username-help"
                            className="text-xs leading-6 text-[#bdb6b1]"
                        >
                            3–30 characters. Start with a letter; use letters,
                            numbers, and underscores. Saved in lowercase.
                            Changing it changes your profile link.
                        </p>
                        {form.errors.username && (
                            <p role="alert" className="text-sm text-red-300">
                                {form.errors.username}
                            </p>
                        )}
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="display-name">Display name</Label>
                        <Input
                            id="display-name"
                            name="display_name"
                            value={form.data.display_name}
                            onChange={(event) =>
                                form.setData('display_name', event.target.value)
                            }
                            required
                            maxLength={80}
                            className="border-shadow bg-rein"
                            aria-invalid={Boolean(form.errors.display_name)}
                        />
                        {form.errors.display_name && (
                            <p role="alert" className="text-sm text-red-300">
                                {form.errors.display_name}
                            </p>
                        )}
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="player-bio">Bio</Label>
                        <textarea
                            id="player-bio"
                            name="bio"
                            value={form.data.bio}
                            onChange={(event) =>
                                form.setData('bio', event.target.value)
                            }
                            maxLength={1000}
                            rows={4}
                            placeholder="The worlds you love, the stories you chase…"
                            className="w-full rounded-md border border-shadow bg-rein p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                            aria-invalid={Boolean(form.errors.bio)}
                        />
                        {form.errors.bio && (
                            <p role="alert" className="text-sm text-red-300">
                                {form.errors.bio}
                            </p>
                        )}
                    </div>
                    <div className="rounded-xl border border-shadow bg-rein/30 p-5">
                        <Label
                            htmlFor="public-profile"
                            className="flex items-start gap-3 leading-6"
                        >
                            <input
                                id="public-profile"
                                name="is_public"
                                type="checkbox"
                                checked={form.data.is_public}
                                onChange={(event) =>
                                    form.setData(
                                        'is_public',
                                        event.target.checked,
                                    )
                                }
                                className="mt-1 size-4 shrink-0 accent-[#807d7d]"
                            />
                            <span>Make my player profile public</span>
                        </Label>
                        <p className="mt-3 text-sm leading-7 text-[#bdb6b1]">
                            A public profile appears in player discovery and
                            community feeds with your public reviews and public
                            lists. Top 4 picks and recent completions are
                            managed below. Your diary, private reviews, and
                            private or unlisted lists stay off this profile.
                        </p>
                        <p className="mt-3 text-xs leading-6 text-[#bdb6b1]">
                            Switch this off to hide your player profile from the
                            community. Reviews and lists you already made public
                            remain accessible on their existing game and list
                            pages.
                        </p>
                        {form.errors.is_public && (
                            <p
                                role="alert"
                                className="mt-3 text-sm text-red-300"
                            >
                                {form.errors.is_public}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Saving…'
                                : 'Save player profile'}
                        </Button>
                        {profile?.is_public && profile.username && (
                            <Link
                                href={show(profile.username)}
                                className="text-sm underline underline-offset-4"
                            >
                                View public profile
                            </Link>
                        )}
                    </div>
                </form>
                {profile ? (
                    <ProfileShowcaseEditor
                        topGames={topGames}
                        shareRecentCompleted={profile.share_recent_completed}
                        availableGames={availableGames}
                        query={query}
                    />
                ) : (
                    <p className="mt-10 border-t border-white/10 pt-6 text-sm leading-7 text-[#bdb6b1]">
                        Save your player profile first to choose your Top 4
                        games and manage recent completions.
                    </p>
                )}
            </div>
        </>
    );
}
