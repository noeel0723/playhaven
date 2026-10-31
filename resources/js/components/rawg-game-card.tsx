import { Link, useForm, usePage } from '@inertiajs/react';
import GameCover from '@/components/game-cover';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { login } from '@/routes';
import { importMethod } from '@/routes/catalog';
import { show } from '@/routes/games';

export type RawgGamePreview = {
    id: number;
    name: string;
    released_on: string | null;
    cover_url: string | null;
    local_slug: string | null;
};

export default function RawgGameCard({
    game,
    compact = false,
    dense = false,
}: {
    game: RawgGamePreview;
    compact?: boolean;
    dense?: boolean;
}) {
    const { auth } = usePage().props;
    const form = useForm<{ rawg_id: number; import?: string }>({
        rawg_id: game.id,
    });
    const open = () => form.post(importMethod(game.id).url);
    const titleClass = dense
        ? 'mt-1.5 min-h-8 line-clamp-2 text-left text-xs leading-4 font-medium wrap-break-word'
        : compact
          ? 'mt-2 min-h-10 line-clamp-2 text-left text-xs leading-5 font-medium break-words'
          : 'mt-4 block text-left text-sm leading-6 font-semibold break-words';
    const buttonClass = dense
        ? 'mt-2 h-7 w-full border border-white/10 bg-rein/30 px-2 text-[11px] text-[#f4f1ed] hover:bg-shadow hover:text-white'
        : compact
          ? 'mt-2 h-8 w-full border border-shadow bg-rein/40 text-xs text-[#f4f1ed] hover:bg-shadow hover:text-white'
          : 'mt-4 w-full';
    return (
        <article className="min-w-0 font-sans">
            {game.local_slug ? (
                <Link
                    href={show(game.local_slug)}
                    className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    <GameCover
                        game={game}
                        compact={compact || dense}
                        hideFallbackTitle={dense}
                        className={
                            dense ? 'aspect-[2/3] rounded-sm' : undefined
                        }
                    />
                    <h3
                        title={game.name}
                        className={`${titleClass} group-hover:underline`}
                    >
                        {game.name}
                    </h3>
                </Link>
            ) : auth.user ? (
                <>
                    <button
                        type="button"
                        onClick={open}
                        disabled={form.processing}
                        aria-label={`Open ${game.name}`}
                        className="group block w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60"
                    >
                        <GameCover
                            game={game}
                            compact={compact || dense}
                            hideFallbackTitle={dense}
                            className={
                                dense ? 'aspect-[2/3] rounded-sm' : undefined
                            }
                        />
                    </button>
                    <h3 className={dense ? 'mt-1.5 min-h-8' : undefined}>
                        <button
                            type="button"
                            onClick={open}
                            disabled={form.processing}
                            title={game.name}
                            className={`${dense ? 'line-clamp-2 w-full text-left text-xs leading-4 font-medium wrap-break-word' : titleClass} rounded-sm hover:underline focus-visible:outline-2`}
                        >
                            {game.name}
                        </button>
                    </h3>
                </>
            ) : (
                <Link
                    href={login()}
                    className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    <GameCover
                        game={game}
                        compact={compact || dense}
                        hideFallbackTitle={dense}
                        className={
                            dense ? 'aspect-[2/3] rounded-sm' : undefined
                        }
                    />
                    <h3 title={game.name} className={titleClass}>
                        {game.name}
                    </h3>
                </Link>
            )}
            <p
                className={`${compact || dense ? 'mt-1' : 'mt-2'} ${dense ? 'text-[11px]' : 'text-xs'} text-[#bdb6b1]`}
            >
                {game.released_on?.slice(0, 4) ?? 'Release TBA'}
            </p>
            {game.local_slug ? (
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={buttonClass}
                >
                    <Link href={show(game.local_slug)}>Open game</Link>
                </Button>
            ) : auth.user ? (
                <Button
                    type="button"
                    size="sm"
                    disabled={form.processing}
                    className={buttonClass}
                    onClick={open}
                >
                    {form.processing ? 'Opening…' : 'Open game'}
                </Button>
            ) : (
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={buttonClass}
                >
                    <Link href={login()}>Log in to open</Link>
                </Button>
            )}
            <InputError
                message={form.errors.import}
                role="alert"
                className={
                    dense
                        ? 'mt-2 text-[11px] leading-4 wrap-break-word'
                        : 'mt-3'
                }
            />
        </article>
    );
}
