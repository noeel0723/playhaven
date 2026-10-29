<?php

namespace App\Http\Controllers;

use App\Enums\ListVisibility;
use App\Http\Requests\CommunityRequest;
use App\Http\Requests\SavePlayerProfileRequest;
use App\Http\Resources\CommunityReviewResource;
use App\Http\Resources\GameListResource;
use App\Http\Resources\PublicPlayerResource;
use App\Services\Community;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function index(CommunityRequest $request, Community $community): Response
    {
        $search = trim($request->string('q')->value());
        $players = $community->players($request->user());
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $players->whereHas('profile', fn (Builder $profile) => $profile->where(fn (Builder $query) => $query
                ->whereRaw("LOWER(username) LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])
                ->orWhereRaw("LOWER(display_name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])));
        }

        return Inertia::render('players/index', [
            'players' => PublicPlayerResource::collection($players->orderByDesc('followers_count')->orderBy('users.id')->paginate(18)->withQueryString()),
            'query' => $search,
        ]);
    }

    public function show(CommunityRequest $request, string $username, Community $community): Response
    {
        $user = $community->players($request->user())->whereHas('profile', fn (Builder $query) => $query->whereRaw('LOWER(username) = ?', [strtolower($username)]))->firstOrFail();

        return Inertia::render('players/show', [
            'player' => (new PublicPlayerResource($user))->resolve($request),
            'reviews' => CommunityReviewResource::collection($community->reviews()->whereHas('libraryEntry', fn (Builder $query) => $query->where('user_id', $user->id))->paginate(12, ['*'], 'reviews_page')->withQueryString()),
            'lists' => GameListResource::collection($user->gameLists()->where('visibility', ListVisibility::Public)->with('user.profile')->withCount('items')->orderByDesc('updated_at')->orderByDesc('id')->paginate(6, ['*'], 'lists_page')->withQueryString()),
        ]);
    }

    public function edit(Request $request): Response
    {
        return Inertia::render('players/edit', [
            'profile' => $request->user()->profile?->only(['username', 'display_name', 'bio', 'is_public']),
        ]);
    }

    public function update(SavePlayerProfileRequest $request): RedirectResponse
    {
        try {
            DB::transaction(fn () => $request->user()->profile()->updateOrCreate(['user_id' => $request->user()->id], $request->validated()));
        } catch (QueryException $exception) {
            if (in_array((string) $exception->getCode(), ['23505', '23000'], true)) {
                throw ValidationException::withMessages(['username' => 'This username is already taken.']);
            }
            throw $exception;
        }
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your player profile has been saved.']);

        return to_route('players.edit');
    }
}
