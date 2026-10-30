<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class GameListItemController extends Controller
{
    public function store(Request $request, GameList $gameList): RedirectResponse
    {
        $data = $request->validate(['game_id' => ['required', 'integer', 'exists:games,id'], 'notes' => ['nullable', 'string', 'max:2000'], 'return_to_game' => ['sometimes', 'boolean']]);
        $list = DB::transaction(function () use ($request, $gameList, $data): GameList {
            $list = $request->user()->gameLists()->whereKey($gameList->id)->lockForUpdate()->firstOrFail();
            $list->items()->firstOrCreate(['game_id' => $data['game_id']], ['position' => (int) $list->items()->max('position') + 1, 'notes' => $data['notes'] ?? null]);
            $list->touch();

            return $list;
        });

        if ($request->boolean('return_to_game')) {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Game added to your list.']);

            return to_route('games.show', Game::whereKey($data['game_id'])->firstOrFail()->slug);
        }

        return $this->redirect($list, 'Game added to your list.');
    }

    public function update(Request $request, GameList $gameList, GameListItem $listItem): RedirectResponse
    {
        $data = $request->validate(['notes' => ['present', 'nullable', 'string', 'max:2000'], 'position' => ['required', 'integer', 'min:1']]);
        $list = DB::transaction(function () use ($request, $gameList, $listItem, $data): GameList {
            $list = $request->user()->gameLists()->whereKey($gameList->id)->lockForUpdate()->firstOrFail();
            $item = $list->items()->whereKey($listItem->id)->firstOrFail();
            $ids = $list->items()->pluck('id')->all();
            if ($data['position'] > count($ids)) {
                throw ValidationException::withMessages(['position' => 'Choose a position within this list.']);
            }
            $ids = array_values(array_filter($ids, fn ($id) => $id !== $item->id));
            array_splice($ids, (int) $data['position'] - 1, 0, [$item->id]);
            foreach ($ids as $index => $id) {
                $list->items()->whereKey($id)->update(['position' => $index + 1]);
            }
            $item->update(['notes' => $data['notes']]);
            $list->touch();

            return $list;
        });

        return $this->redirect($list, 'List order and notes saved.');
    }

    public function destroy(Request $request, GameList $gameList, GameListItem $listItem): RedirectResponse
    {
        $request->validate(['confirm' => ['required', 'accepted']]);
        $list = DB::transaction(function () use ($request, $gameList, $listItem): GameList {
            $list = $request->user()->gameLists()->whereKey($gameList->id)->lockForUpdate()->firstOrFail();
            $list->items()->whereKey($listItem->id)->firstOrFail()->delete();
            foreach ($list->items()->pluck('id') as $index => $id) {
                $list->items()->whereKey($id)->update(['position' => $index + 1]);
            }
            $list->touch();

            return $list;
        });

        return $this->redirect($list, 'Game removed from this list.');
    }

    private function redirect(GameList $list, string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('lists.show', ['listOwner' => $list->user_id, 'listSlug' => $list->slug]);
    }
}
