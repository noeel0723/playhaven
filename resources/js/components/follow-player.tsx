import { Form, Link, usePage } from '@inertiajs/react';
import { Check, Plus, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { login } from '@/routes';
import { store, destroy } from '@/routes/follows';
import { edit } from '@/routes/players';
import type { PublicPlayer } from '@/types/community';

export default function FollowPlayer({
    player,
    compact = false,
}: {
    player: PublicPlayer;
    compact?: boolean;
}) {
    const { auth } = usePage().props;
    const compactClass = compact
        ? 'size-10 rounded-full border-2 border-caviar bg-[#d5cec7] p-0 text-[#211d1a] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
        : undefined;
    if (player.is_self)
        return (
            <Button asChild>
                <Link href={edit()}>Edit your player profile</Link>
            </Button>
        );
    if (!auth.user)
        return (
            <Button asChild className={compactClass}>
                <Link
                    href={login()}
                    aria-label={
                        compact ? `Log in to follow ${player.name}` : undefined
                    }
                >
                    {compact && <Plus aria-hidden="true" />}
                    <span className={compact ? 'sr-only' : undefined}>
                        Log in to follow
                    </span>
                </Link>
            </Button>
        );
    return (
        <Form
            key={`${player.username}:${player.is_following}`}
            action={
                player.is_following
                    ? destroy(player.username)
                    : store(player.username)
            }
            method={player.is_following ? 'delete' : 'post'}
            options={{ preserveScroll: true }}
        >
            {({ processing, errors }) => (
                <div>
                    <Button
                        type="submit"
                        disabled={processing}
                        className={compactClass}
                        aria-label={`${player.is_following ? 'Unfollow' : 'Follow'} ${player.name}`}
                    >
                        {compact ? (
                            player.is_following ? (
                                <Check aria-hidden="true" />
                            ) : (
                                <Plus aria-hidden="true" />
                            )
                        ) : player.is_following ? (
                            <UserMinus aria-hidden="true" />
                        ) : (
                            <UserPlus aria-hidden="true" />
                        )}
                        <span className={compact ? 'sr-only' : undefined}>
                            {processing
                                ? 'Saving…'
                                : player.is_following
                                  ? 'Unfollow'
                                  : 'Follow'}
                        </span>
                    </Button>
                    {errors.follow && (
                        <p role="alert" className="mt-2 text-sm text-red-300">
                            {errors.follow}
                        </p>
                    )}
                </div>
            )}
        </Form>
    );
}
