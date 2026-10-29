import { useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store, update } from '@/routes/lists';
import { listVisibilities } from '@/types/lists';
import type { GameList } from '@/types/lists';

export default function GameListForm({ list }: { list?: GameList }) {
    const form = useForm({
        name: list?.name ?? '',
        description: list?.description ?? '',
        visibility: list?.visibility ?? 'private',
    });
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                if (list)
                    form.put(update(list.id).url, { preserveScroll: true });
                else form.post(store().url);
            }}
            className="space-y-5"
        >
            <div className="space-y-2">
                <Label htmlFor="list-name">List name</Label>
                <Input
                    id="list-name"
                    name="name"
                    required
                    maxLength={150}
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                    disabled={form.processing}
                    placeholder="Worlds worth getting lost in"
                    className="h-11 border-shadow bg-rein"
                />
                <InputError message={form.errors.name} role="alert" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="list-description">
                    Description{' '}
                    <span className="text-[#bdb6b1]">(optional)</span>
                </Label>
                <textarea
                    id="list-description"
                    rows={4}
                    maxLength={5000}
                    value={form.data.description}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                    disabled={form.processing}
                    className="w-full rounded-md border border-shadow bg-rein px-3 py-2 text-sm leading-7 focus-visible:outline-2 focus-visible:outline-offset-2"
                    placeholder="What brings these games together?"
                />
                <InputError message={form.errors.description} role="alert" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="list-visibility">Who can see this list?</Label>
                <select
                    id="list-visibility"
                    value={form.data.visibility}
                    onChange={(event) =>
                        form.setData(
                            'visibility',
                            event.target.value as GameList['visibility'],
                        )
                    }
                    disabled={form.processing}
                    className="h-11 w-full rounded-md border border-shadow bg-rein px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    {listVisibilities.map((visibility) => (
                        <option key={visibility.value} value={visibility.value}>
                            {visibility.label}
                        </option>
                    ))}
                </select>
                <InputError message={form.errors.visibility} role="alert" />
            </div>
            <p className="text-xs leading-6 text-[#bdb6b1]">
                {form.data.visibility === 'private'
                    ? 'Only you can open this list.'
                    : form.data.visibility === 'unlisted'
                      ? 'Anyone you share the link with can open it. It stays out of community discovery.'
                      : 'This list, its notes, and your account name will be visible in community discovery.'}
            </p>
            <Button type="submit" disabled={form.processing}>
                {form.processing
                    ? 'Saving…'
                    : list
                      ? 'Save list'
                      : 'Create list'}
            </Button>
        </form>
    );
}
