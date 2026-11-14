<?php

namespace App\Http\Controllers;

use App\Http\Resources\GameResource;
use App\Models\Developer;
use App\Models\Genre;
use App\Models\Platform;
use App\Services\Rawg\CatalogImage;
use App\Services\Rawg\DeveloperSynchronizer;
use App\Services\Wikipedia\DeveloperBiography;
use App\Support\EmailVerification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DeveloperController extends Controller
{
    public function show(Request $request, Developer $developer): Response
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', Rule::in(['rating', 'recent', 'name', 'popular'])],
            'page' => ['nullable', 'integer', 'between:1,100000'],
        ]);
        $search = trim($validated['q'] ?? '');
        $sort = $validated['sort'] ?? 'rating';
        $query = $developer->games()->with(['genres', 'platforms', 'developers'])
            ->withCount(['ratings', 'libraryEntries as players_count', 'reviews as public_reviews_count' => fn ($query) => $query->where('reviews.is_public', true)])
            ->withAvg('ratings', 'score');
        if ($search !== '') {
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search));
            $query->whereRaw("LOWER(games.name) LIKE ? ESCAPE '!'", ['%'.$escaped.'%']);
        }
        match ($sort) {
            'name' => $query->orderBy('games.name'),
            'recent' => $query->orderByRaw('games.released_on DESC NULLS LAST'),
            'popular' => $query->orderByDesc('players_count'),
            default => $query->orderByRaw('ratings_avg_score DESC NULLS LAST')->orderByDesc('ratings_count'),
        };
        $fromDeveloper = fn (Builder $query) => $query->whereHas('developers', fn (Builder $studio) => $studio->where('developers.id', $developer->id));
        $image = CatalogImage::url($developer->image_url);
        $imageSource = $image ? 'developer' : 'game';
        if (! $image) {
            foreach ($developer->games()->orderByRaw('games.released_on DESC NULLS LAST')->orderBy('games.id')->limit(24)->get(['games.banner_url', 'games.cover_url']) as $game) {
                $image = CatalogImage::url($game->banner_url) ?? CatalogImage::url($game->cover_url);
                if ($image) {
                    break;
                }
            }
        }

        return Inertia::render('developers/show', [
            'developer' => ['name' => $developer->name, 'slug' => $developer->slug,
                'description' => $developer->description ? trim(html_entity_decode(strip_tags($developer->description), ENT_QUOTES | ENT_HTML5, 'UTF-8')) : null,
                'description_source' => in_array($developer->description_source, ['rawg', 'wikipedia'], true) ? $developer->description_source : null,
                'description_source_url' => DeveloperBiography::sourceUrl($developer->description_source_url, $developer->description_source),
                'image_url' => $image, 'image_source' => $image ? $imageSource : null,
                'games_count' => $developer->games()->count(),
                'first_release' => $this->releaseDate($developer->games()->min('games.released_on')), 'latest_release' => $this->releaseDate($developer->games()->max('games.released_on')),
                'details_synced_at' => $developer->details_synced_at?->toISOString()],
            'games' => GameResource::collection($query->orderBy('games.id')->paginate(24)->withQueryString()),
            'genres' => Genre::whereHas('games', $fromDeveloper)->orderBy('name')->get(['id', 'name', 'slug']),
            'platforms' => Platform::whereHas('games', $fromDeveloper)->orderBy('name')->get(['id', 'name', 'slug']),
            'filters' => ['q' => $search, 'sort' => $sort],
            'canRefresh' => $request->user() !== null && (! EmailVerification::required() || $request->user()->hasVerifiedEmail()) && $developer->rawg_id > 0,
        ]);
    }

    public function refresh(Developer $developer, DeveloperSynchronizer $synchronizer): RedirectResponse
    {
        try {
            $synchronizer->sync($developer);
        } catch (Throwable) {
            return to_route('developers.show', $developer->slug)->withErrors(['developer' => 'Developer details could not be updated. Saved information is still available. Please try again later.']);
        }
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Developer details updated.']);

        return to_route('developers.show', $developer->slug);
    }

    private function releaseDate(mixed $date): ?string
    {
        return is_string($date) ? substr($date, 0, 10) : null;
    }
}
