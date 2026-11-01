<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommunityRequest;
use App\Http\Requests\PublicPlayerDiaryRequest;
use App\Http\Requests\PublicPlayerStatisticsRequest;
use App\Http\Resources\ProfileReviewResource;
use App\Http\Resources\PublicDiaryLogResource;
use App\Models\GameDiaryLog;
use App\Models\Review;
use App\Models\User;
use App\Services\PlayerStatistics;
use App\Services\ProfilePhotos;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class PlayerPagesController extends Controller
{
    public function reviews(CommunityRequest $request, string $username): Response
    {
        return $this->reviewPage($request, $this->publicPlayer($username));
    }

    public function myReviews(CommunityRequest $request): Response
    {
        return $this->reviewPage($request, $request->user(), true);
    }

    public function diary(PublicPlayerDiaryRequest $request, string $username): Response
    {
        $player = $this->publicPlayer($username);
        $query = GameDiaryLog::query()->whereHas('libraryEntry', fn (Builder $entry) => $entry->where('user_id', $player->id));
        $search = trim($request->string('q')->value());
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $query->whereHas('libraryEntry.game', fn (Builder $game) => $game->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%']));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        foreach (['from' => '>=', 'to' => '<='] as $field => $operator) {
            if ($request->filled($field)) {
                $query->whereDate('logged_on', $operator, $request->input($field));
            }
        }

        return $this->response($request, 'players/diary', [
            'playerPage' => $this->context($player),
            'logs' => PublicDiaryLogResource::collection($query->with(['libraryEntry.game', 'libraryEntry.rating', 'libraryEntry.review:id,library_entry_id,is_public'])
                ->orderByDesc('logged_on')->orderByDesc('id')->paginate(20)->withQueryString()),
            'filters' => ['q' => $search, 'status' => $request->string('status')->value(), 'from' => $request->string('from')->value(), 'to' => $request->string('to')->value()],
            'today' => now()->toDateString(),
        ]);
    }

    public function statistics(PublicPlayerStatisticsRequest $request, string $username, PlayerStatistics $statistics): Response
    {
        $player = $this->publicPlayer($username);

        return $this->response($request, 'stats/index', [
            'playerPage' => $this->context($player),
            'stats' => $statistics->forUser($player, $request->filled('year') ? $request->integer('year') : now()->year),
        ]);
    }

    private function publicPlayer(string $username): User
    {
        return User::publicPlayer()->with('profile')->whereHas('profile', fn (Builder $query) => $query->whereRaw('LOWER(username) = ?', [strtolower($username)]))->firstOrFail();
    }

    /** @return array<string, mixed> */
    private function context(User $player, bool $mine = false): array
    {
        $player->loadMissing('profile');
        $profile = $player->profile;

        return ['owner' => ['name' => $profile?->display_name ?: ($profile?->username ?: $player->name), 'username' => $profile?->username, 'avatar_url' => ProfilePhotos::url($profile, $mine)], 'isOwnPage' => $mine];
    }

    private function reviewPage(CommunityRequest $request, User $player, bool $mine = false): Response
    {
        $query = Review::query()->whereHas('libraryEntry', fn (Builder $entry) => $entry->where('user_id', $player->id));
        if (! $mine) {
            $query->where('is_public', true);
        }
        $search = trim($request->string('q')->value());
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $query->whereHas('libraryEntry.game', fn (Builder $game) => $game->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%']));
        }

        return $this->response($request, 'players/reviews', [
            'playerPage' => $this->context($player, $mine),
            'reviews' => ProfileReviewResource::collection($query->with(['libraryEntry.rating', 'libraryEntry.game.genres', 'libraryEntry.game.platforms'])
                ->orderByDesc('updated_at')->orderByDesc('id')->paginate(8)->withQueryString()),
            'query' => $search,
        ]);
    }

    /** @param array<string, mixed> $props */
    private function response(Request $request, string $component, array $props): Response
    {
        $response = Inertia::render($component, $props)->toResponse($request);
        $response->headers->set('Cache-Control', 'private, no-store');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }
}
