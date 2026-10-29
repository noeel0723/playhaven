<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommunityRequest;
use App\Http\Resources\CommunityReviewResource;
use App\Services\Community;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    public function index(CommunityRequest $request, Community $community): Response|RedirectResponse
    {
        $feed = $request->input('feed') ?: 'everyone';
        if ($feed === 'following' && $request->user() === null) {
            return to_route('login');
        }
        $reviews = $community->reviews();
        if ($feed === 'following') {
            $reviews->whereHas('libraryEntry.user.followers', fn (Builder $query) => $query->where('follows.follower_id', $request->user()->id));
        }

        return Inertia::render('community/index', [
            'reviews' => CommunityReviewResource::collection($reviews->paginate(12)->withQueryString()),
            'feed' => $feed,
        ]);
    }
}
