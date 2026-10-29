import { Form, Link, usePage } from '@inertiajs/react';
import { UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { login } from '@/routes';
import { store, destroy } from '@/routes/follows';
import { edit } from '@/routes/players';
import type { PublicPlayer } from '@/types/community';

export default function FollowPlayer({ player }: { player: PublicPlayer }) {
    const { auth } = usePage().props;
    if (player.is_self)
        return (
            <Button asChild>
                <Link href={edit()}>Edit your player profile</Link>
            </Button>
        );
    if (!auth.user)
        return (
            <Button asChild>
                <Link href={login()}>Log in to follow</Link>
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
                        aria-label={`${player.is_following ? 'Unfollow' : 'Follow'} ${player.name}`}
                    >
                        {player.is_following ? (
                            <UserMinus aria-hidden="true" />
                        ) : (
                            <UserPlus aria-hidden="true" />
                        )}
                        {processing
                            ? 'Saving…'
                            : player.is_following
                              ? 'Unfollow'
                              : 'Follow'}
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
