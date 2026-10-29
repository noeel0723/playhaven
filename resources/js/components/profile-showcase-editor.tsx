import { Form, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Search, X } from 'lucide-react';
import GameCover from '@/components/game-cover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit, showcase } from '@/routes/players';
import type { CatalogGame } from '@/types/catalog';

export default function ProfileShowcaseEditor({
    topGames,
    shareRecentCompleted,
    availableGames,
    query,
}: {
    topGames: CatalogGame[];
    shareRecentCompleted: boolean;
    availableGames: CatalogGame[];
    query: string;
}) {
    const form = useForm({
        top_games: topGames,
        share_recent_completed: shareRecentCompleted,
    });
    function move(index: number, direction: number) {
        const picks = [...form.data.top_games];
        [picks[index], picks[index + direction]] = [
            picks[index + direction],
            picks[index],
        ];
        form.setData('top_games', picks);
    }
    return (
        <section
            id="profile-shelves"
            aria-labelledby="profile-shelves-title"
            className="mt-12 scroll-mt-8 border-t border-white/10 pt-9"
        >
            <h2 id="profile-shelves-title" className="font-serif text-3xl">
                Your profile shelves
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#bdb6b1]">
                Pick up to four games, then arrange them in your order. These
                picks appear on your public profile and do not change your
                library favorites.
            </p>
            <div className="mt-7 grid grid-cols-4 items-start gap-2 sm:gap-4">
                {Array.from({ length: 4 }, (_, index) => {
                    const game = form.data.top_games[index];
                    return (
                        <div
                            key={game?.id ?? `empty-${index}`}
                            className="min-w-0"
                        >
                            {game ? (
                                <>
                                    <GameCover
                                        game={game}
                                        compact
                                        className="aspect-[2/3] rounded-md"
                                    />
                                    <p className="mt-2 line-clamp-2 text-xs leading-5 wrap-break-word text-[#c5bfba]">
                                        {index + 1}. {game.name}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-7"
                                            disabled={
                                                index === 0 || form.processing
                                            }
                                            aria-label={`Move ${game.name} left`}
                                            onClick={() => move(index, -1)}
                                        >
                                            <ArrowLeft
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-7"
                                            disabled={
                                                index ===
                                                    form.data.top_games.length -
                                                        1 || form.processing
                                            }
                                            aria-label={`Move ${game.name} right`}
                                            onClick={() => move(index, 1)}
                                        >
                                            <ArrowRight
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-7"
                                            disabled={form.processing}
                                            aria-label={`Remove ${game.name}`}
                                            onClick={() =>
                                                form.setData(
                                                    'top_games',
                                                    form.data.top_games.filter(
                                                        (pick) =>
                                                            pick.id !== game.id,
                                                    ),
                                                )
                                            }
                                        >
                                            <X
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex aspect-[2/3] items-center justify-center rounded-md border border-dashed border-shadow bg-rein/10 text-sm text-[#807d7d]">
                                    {index + 1}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <Form
                key={query}
                action={edit()}
                method="get"
                options={{ preserveScroll: true, preserveState: true }}
                className="mt-7"
            >
                {({ processing, errors }) => (
                    <>
                        <Label htmlFor="top-game-search" className="mb-3">
                            Find a game for your Top 4
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="top-game-search"
                                name="q"
                                defaultValue={query}
                                maxLength={100}
                                placeholder="Search your local catalog…"
                                className="min-w-0 border-shadow bg-rein"
                            />
                            <Button type="submit" disabled={processing}>
                                <Search aria-hidden="true" />
                                <span className="sr-only">
                                    Search games for Top 4
                                </span>
                            </Button>
                        </div>
                        {errors.q && (
                            <p
                                role="alert"
                                className="mt-3 text-sm text-red-300"
                            >
                                {errors.q}
                            </p>
                        )}
                    </>
                )}
            </Form>
            {query && (
                <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-shadow">
                    {availableGames.length ? (
                        availableGames.map((game) => {
                            const selected = form.data.top_games.some(
                                (pick) => pick.id === game.id,
                            );
                            return (
                                <div
                                    key={game.id}
                                    className="flex items-center justify-between gap-3 border-b border-white/10 p-3 last:border-b-0"
                                >
                                    <span className="min-w-0 text-sm leading-6 wrap-break-word text-[#d5cec7]">
                                        {game.name}
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={
                                            selected ||
                                            form.data.top_games.length >= 4 ||
                                            form.processing
                                        }
                                        aria-label={`Add ${game.name} to Top 4`}
                                        onClick={() =>
                                            form.setData('top_games', [
                                                ...form.data.top_games,
                                                game,
                                            ])
                                        }
                                    >
                                        <Plus aria-hidden="true" />
                                        {selected ? 'Added' : 'Add'}
                                    </Button>
                                </div>
                            );
                        })
                    ) : (
                        <p className="p-4 text-sm leading-7 text-[#bdb6b1]">
                            No matching games. Import a game through Find more
                            games in the catalog, then search again here.
                        </p>
                    )}
                </div>
            )}
            <form
                className="mt-7"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({
                        top_games: data.top_games.map((game) => game.id),
                        share_recent_completed: data.share_recent_completed,
                    }));
                    form.put(showcase().url, { preserveScroll: true });
                }}
            >
                <div className="rounded-xl border border-shadow bg-rein/30 p-5">
                    <Label
                        htmlFor="share-recent-completed"
                        className="flex items-start gap-3 leading-6"
                    >
                        <input
                            id="share-recent-completed"
                            type="checkbox"
                            checked={form.data.share_recent_completed}
                            onChange={(event) =>
                                form.setData(
                                    'share_recent_completed',
                                    event.target.checked,
                                )
                            }
                            className="mt-1 size-4 shrink-0 accent-[#807d7d]"
                        />
                        <span>Show my recent completed games</span>
                    </Label>
                    <p className="mt-3 text-sm leading-7 text-[#bdb6b1]">
                        Share your latest four completed library games, their
                        ratings, and completion dates on your public profile.
                        Other library statuses, favorites, diary entries, and
                        private reviews stay private.
                    </p>
                    <p className="mt-3 text-xs leading-6 text-[#bdb6b1]">
                        Completion dates are recorded when you mark a game
                        Completed. Older entries may have no recorded date.
                    </p>
                </div>
                {Object.values(form.errors).length > 0 && (
                    <p role="alert" className="mt-4 text-sm text-red-300">
                        {Object.values(form.errors).join(' ')}
                    </p>
                )}
                <Button
                    type="submit"
                    disabled={form.processing}
                    className="mt-5"
                >
                    {form.processing ? 'Saving…' : 'Save profile shelves'}
                </Button>
            </form>
        </section>
    );
}
