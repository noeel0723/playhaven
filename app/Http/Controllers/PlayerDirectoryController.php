<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommunityRequest;
use App\Http\Resources\NetworkPlayerResource;
use App\Services\PlayerDirectory;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class PlayerDirectoryController extends Controller
{
    public function index(CommunityRequest $request, PlayerDirectory $directory): Response
    {
        $search = trim($request->string('q')->value());
        $reviewers = $directory->players($request->user())->whereHas('reviews', fn (Builder $query) => $query->where('is_public', true))
            ->reorder()->orderByDesc('public_reviews_count')->orderByDesc('followers_count')->orderBy('users.id')->limit(5)->get();

        return Inertia::render('players/popular', [
            'players' => NetworkPlayerResource::collection($directory->players($request->user(), $search)->paginate(20)->withQueryString()),
            'reviewers' => NetworkPlayerResource::collection($reviewers)->resolve($request),
            'query' => $search,
        ]);
    }
}
