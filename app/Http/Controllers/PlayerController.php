<?php

namespace App\Http\Controllers;

use App\Enums\ListVisibility;
use App\Http\Requests\CommunityRequest;
use App\Http\Requests\SavePlayerProfileRequest;
use App\Http\Requests\SavePlayerShowcaseRequest;
use App\Http\Resources\CommunityReviewResource;
use App\Http\Resources\CompletedGameResource;
use App\Http\Resources\DiscoveredPlayerResource;
use App\Http\Resources\GameListResource;
use App\Http\Resources\GameResource;
use App\Http\Resources\ProfileActivityResource;
use App\Http\Resources\ProfileReviewResource;
use App\Http\Resources\PublicPlayerResource;
use App\Services\Community;
use App\Services\PlayerShowcase;
use App\Services\ProfileActivity;
use App\Services\ProfilePhotos;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function mine(CommunityRequest $request, PlayerShowcase $showcase, ProfileActivity $activity): Response
    {
        $user = $request->user()->load('profile')->loadCount(['followers', 'following', 'libraryEntries']);
        $profile = $user->profile;
        $reviews = $user->reviews()->with(['libraryEntry.rating', 'libraryEntry.game' => fn (BelongsTo $query) => $query->with(['genres', 'platforms'])])
            ->orderByDesc('reviews.updated_at')->orderByDesc('reviews.id')->paginate(4, ['reviews.*'], 'reviews_page')->withQueryString();

        return Inertia::render('players/me', [
            'player' => [
                'name' => $profile?->display_name ?: ($profile?->username ?: $user->name),
                'username' => $profile?->username,
                'bio' => $profile?->bio,
                'avatar_url' => $profile ? ProfilePhotos::url($profile, true) : null,
                'is_public' => (bool) $profile?->is_public,
                'followers_count' => (int) $user->getAttribute('followers_count'),
                'following_count' => (int) $user->getAttribute('following_count'),
                'games_count' => (int) $user->getAttribute('library_entries_count'),
            ],
            'topGames' => $profile ? GameResource::collection($showcase->topGames($profile))->resolve($request) : [],
            'activities' => ProfileActivityResource::collection($activity->recent($user))->resolve($request),
            'reviews' => ProfileReviewResource::collection($reviews),
        ]);
    }

    public function index(CommunityRequest $request, Community $community): Response
    {
        $search = trim($request->string('q')->value());
        $players = $community->players($request->user());
        if ($request->user() !== null) {
            $players->whereKeyNot($request->user()->id);
        }
        $hasDiscoverablePlayers = (clone $players)->exists();
        $players->with(['profile.topGames.genres', 'profile.topGames.platforms'])
            ->withCount(['reviews as public_reviews_count' => fn (Builder $query) => $query->where('is_public', true)]);
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $players->whereHas('profile', fn (Builder $profile) => $profile->where(fn (Builder $query) => $query
                ->whereRaw("LOWER(username) LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])
                ->orWhereRaw("LOWER(display_name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])));
        }

        return Inertia::render('players/index', [
            'players' => DiscoveredPlayerResource::collection($players->orderByDesc('followers_count')->orderBy('users.id')->paginate(18)->withQueryString()),
            'query' => $search,
            'hasDiscoverablePlayers' => $hasDiscoverablePlayers,
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
