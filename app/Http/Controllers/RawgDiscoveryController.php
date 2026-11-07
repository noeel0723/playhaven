<?php

namespace App\Http\Controllers;

use App\Http\Requests\RawgImportRequest;
use App\Http\Requests\RawgSearchRequest;
use App\Models\Game;
use App\Services\Rawg\CatalogImage;
use App\Services\Rawg\CatalogSynchronizer;
use App\Services\Rawg\RawgClient;
use App\Services\Rawg\RawgRateLimited;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RawgDiscoveryController extends Controller
{
    public function index(RawgSearchRequest $request, RawgClient $client): Response
    {
        $query = trim($request->string('q')->value());
        $page = $request->integer('page', 1);
        $games = [];
        $hasNext = false;
        $error = null;
        if ($query !== '') {
            try {
                $result = $client->search($query, $page);
                $data = Validator::make($result, [
                    'results' => ['present', 'array', 'max:12'],
                    'results.*.id' => ['required', 'integer', 'between:1,2147483647'],
                    'results.*.name' => ['required', 'string', 'max:255'],
                    'results.*.released' => ['nullable', 'date_format:Y-m-d'],
                    'results.*.background_image' => ['nullable', 'string'],
                ])->validate();
                $local = Game::whereIn('rawg_id', array_column($data['results'], 'id'))->get()->keyBy('rawg_id');
                foreach ($data['results'] as $game) {
                    $games[] = [
                        'id' => (int) $game['id'], 'name' => $game['name'],
                        'released_on' => $game['released'] ?? null,
                        'cover_url' => CatalogImage::url($game['background_image'] ?? null),
                        'local_slug' => $local->get($game['id'])?->slug,
                    ];
                }
                $hasNext = $result['has_next'] && $page < 1000;
            } catch (RawgRateLimited) {
                $error = 'RAWG is busy. Wait a few seconds and search again.';
            } catch (Throwable) {
                $error = 'Search is temporarily unavailable. Check the RAWG connection or try again later.';
            }
        }

        return Inertia::render('games/find', ['results' => $games, 'query' => $query, 'page' => $page, 'hasNext' => $hasNext, 'error' => $error]);
    }

    public function store(RawgImportRequest $request, CatalogSynchronizer $synchronizer): RedirectResponse
    {
        try {
            $started = microtime(true);
            $attempt = 0;
            while (true) {
                try {
                    $synchronizer->syncGame($request->integer('rawg_id'));
                    break;
                } catch (RawgRateLimited $exception) {
                    if ($attempt++ >= 1 || $exception->retryAfter > 2 || microtime(true) - $started > 2) {
                        throw $exception;
                    }
                    usleep(1100000 * $exception->retryAfter);
                }
            }
            $game = Game::where('rawg_id', $request->integer('rawg_id'))->firstOrFail();
        } catch (RawgRateLimited) {
            throw ValidationException::withMessages(['import' => 'RAWG is busy. Wait a few seconds, then import again.']);
        } catch (Throwable) {
            throw ValidationException::withMessages(['import' => 'This game could not be imported. Please try again later.']);
        }
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Game saved to the catalog.']);

        return to_route('games.show', $game->slug);
    }
}
