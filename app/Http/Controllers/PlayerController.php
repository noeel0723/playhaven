<?php

namespace App\Http\Controllers;

use App\Enums\ListVisibility;
use App\Http\Requests\CommunityRequest;
use App\Http\Requests\SavePlayerProfileRequest;
use App\Http\Requests\SavePlayerShowcaseRequest;
use App\Http\Resources\CommunityReviewResource;
use App\Http\Resources\CompletedGameResource;
use App\Http\Resources\GameListResource;
use App\Http\Resources\GameResource;
use App\Http\Resources\PublicPlayerResource;
use App\Services\Community;
use App\Services\PlayerShowcase;
use App\Services\ProfilePhotos;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
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

    public function show(CommunityRequest $request, string $username, Community $community, PlayerShowcase $showcase): Response
    {
        $user = $community->players($request->user())->whereHas('profile', fn (Builder $query) => $query->whereRaw('LOWER(username) = ?', [strtolower($username)]))->firstOrFail();

        return Inertia::render('players/show', [
            'player' => (new PublicPlayerResource($user))->resolve($request),
            'topGames' => GameResource::collection($showcase->topGames($user->profile))->resolve($request),
            'recentCompleted' => $user->profile->share_recent_completed ? CompletedGameResource::collection($showcase->completed($user))->resolve($request) : [],
            'recentCompletedShared' => (bool) $user->profile->share_recent_completed,
            'reviews' => CommunityReviewResource::collection($community->reviews()->whereHas('libraryEntry', fn (Builder $query) => $query->where('user_id', $user->id))->paginate(12, ['*'], 'reviews_page')->withQueryString()),
            'lists' => GameListResource::collection($user->gameLists()->where('visibility', ListVisibility::Public)->with('user.profile')->withCount('items')->orderByDesc('updated_at')->orderByDesc('id')->paginate(6, ['*'], 'lists_page')->withQueryString()),
        ]);
    }

    public function edit(CommunityRequest $request, PlayerShowcase $showcase): Response
    {
        $profile = $request->user()->profile()->first();
        $search = trim($request->string('q')->value());

        return Inertia::render('players/edit', [
            'profile' => $profile ? [...$profile->only(['username', 'display_name', 'bio', 'is_public', 'share_recent_completed']), 'avatar_url' => ProfilePhotos::url($profile, true)] : null,
            'topGames' => $profile ? GameResource::collection($showcase->topGames($profile))->resolve($request) : [],
            'availableGames' => $search !== '' ? GameResource::collection($showcase->search($search))->resolve($request) : [],
            'query' => $search,
        ]);
    }

    public function showcase(SavePlayerShowcaseRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $profile = $request->user()->profile()->lockForUpdate()->firstOrFail();
            $profile->update(['share_recent_completed' => $request->boolean('share_recent_completed')]);
            $profile->topGames()->detach();
            foreach ($request->validated('top_games') as $position => $gameId) {
                $profile->topGames()->attach($gameId, ['position' => $position + 1]);
            }
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your profile shelves have been saved.']);

        return to_route('players.edit')->withFragment('profile-shelves');
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
