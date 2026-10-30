<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommunityRequest;
use App\Http\Resources\CommunityReviewResource;
use App\Services\Community;
use App\Services\FriendGameShelves;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CommunityController extends Controller
{
    public function index(CommunityRequest $request, Community $community, FriendGameShelves $friends): Response
    {
        $feed = $request->input('feed') ?: 'everyone';
        if ($feed === 'following' && $request->user() === null) {
            return to_route('login');
        }
        $reviews = $community->reviews();
        if ($feed === 'following') {
            $reviews->whereHas('libraryEntry.user.followers', fn (Builder $query) => $query->where('follows.follower_id', $request->user()->id));
        }

        $reviewPage = $reviews->paginate(8)->withQueryString();
        $response = Inertia::render('community/index', [
            'reviews' => CommunityReviewResource::collection($reviewPage),
            'feed' => $feed,
            'friendShelves' => $request->user() && $reviewPage->currentPage() === 1 ? $friends->forUser($request->user()) : null,
        ])->toResponse($request);
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }
}
