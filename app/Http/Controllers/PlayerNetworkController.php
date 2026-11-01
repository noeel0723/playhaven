<?php

namespace App\Http\Controllers;

use App\Enums\ListVisibility;
use App\Http\Requests\PlayerNetworkRequest;
use App\Http\Resources\NetworkPlayerResource;
use App\Models\User;
use App\Services\Community;
use App\Services\ProfilePhotos;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\JoinClause;
use Inertia\Inertia;
use Inertia\Response;

class PlayerNetworkController extends Controller
{
    public function followers(PlayerNetworkRequest $request, Community $community, string $username): Response
    {
        return $this->network($request, $community, $this->publicPlayer($request, $community, $username), 'followers');
    }

    public function following(PlayerNetworkRequest $request, Community $community, string $username): Response
    {
        return $this->network($request, $community, $this->publicPlayer($request, $community, $username), 'following');
    }

    public function myFollowers(PlayerNetworkRequest $request, Community $community): Response
    {
        return $this->network($request, $community, $request->user(), 'followers', true);
    }

    public function myFollowing(PlayerNetworkRequest $request, Community $community): Response
    {
        return $this->network($request, $community, $request->user(), 'following', true);
    }

    private function publicPlayer(PlayerNetworkRequest $request, Community $community, string $username): User
    {
        return $community->players($request->user())->whereHas('profile', fn (Builder $query) => $query->whereRaw('LOWER(username) = ?', [strtolower($username)]))->firstOrFail();
    }

    private function network(PlayerNetworkRequest $request, Community $community, User $owner, string $direction, bool $mine = false): Response
    {
        $owner->loadMissing('profile')->loadCount(['followers', 'following']);
        $profile = $owner->profile;
        $sort = $request->input('sort') ?: 'recent';
        $memberColumn = $direction === 'followers' ? 'follower_id' : 'followed_id';
        $ownerColumn = $direction === 'followers' ? 'followed_id' : 'follower_id';
        $players = $community->players($request->user())
            ->join('follows as network_follow', fn (JoinClause $join) => $join
                ->on('network_follow.'.$memberColumn, '=', 'users.id')->where('network_follow.'.$ownerColumn, $owner->id))
            ->withCount([
                'reviews as public_reviews_count' => fn (Builder $query) => $query->where('is_public', true),
                'gameLists as public_lists_count' => fn (Builder $query) => $query->where('visibility', ListVisibility::Public),
            ]);
        if ($sort === 'name') {
            $players->join('user_profiles as network_profile', 'network_profile.user_id', '=', 'users.id')
                ->orderByRaw("LOWER(COALESCE(NULLIF(network_profile.display_name, ''), network_profile.username))");
        } else {
            $players->orderByDesc('network_follow.created_at');
        }

        return Inertia::render('players/network', [
            'owner' => [
                'name' => $profile?->display_name ?: ($profile?->username ?: $owner->name),
                'username' => $profile?->username,
                'avatar_url' => $profile ? ProfilePhotos::url($profile, $mine) : null,
                'followers_count' => (int) $owner->getAttribute('followers_count'),
                'following_count' => (int) $owner->getAttribute('following_count'),
            ],
            'direction' => $direction,
            'isOwnNetwork' => $mine,
            'sort' => $sort,
            'players' => NetworkPlayerResource::collection($players->orderBy('users.id')->paginate(20)->withQueryString()),
        ]);
    }
}
