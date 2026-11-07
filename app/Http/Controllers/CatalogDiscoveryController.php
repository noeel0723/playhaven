<?php

namespace App\Http\Controllers;

use App\Http\Requests\CatalogImportRequest;
use App\Http\Requests\CatalogSearchRequest;
use App\Models\Game;
use App\Services\TheGamesDb\CatalogImage;
use App\Services\TheGamesDb\CatalogSynchronizer;
use App\Services\TheGamesDb\TheGamesDbClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CatalogDiscoveryController extends Controller
{
    public function index(CatalogSearchRequest $request, TheGamesDbClient $client): Response
    {
        $query = trim($request->string('q')->value());
        $page = $request->integer('page', 1);
        $games = [];
        $hasNext = false;
        $error = null;
        if ($query !== '') {
            try {
                $result = $client->search($query, $page);
                $platforms = $result['games'] !== [] ? $client->terms('platforms') : [];
                $local = Game::whereIn('thegamesdb_id', array_column($result['games'], 'id'))->get()->keyBy('thegamesdb_id');
                foreach ($result['games'] as $game) {
                    $games[] = ['id' => $game['id'], 'name' => $game['game_title'], 'released_on' => $game['release_date'] ?? null,
                        'cover_url' => CatalogImage::pick($result['images'][(string) $game['id']] ?? []),
                        'local_slug' => $local->get($game['id'])?->slug,
                        'platform_name' => $platforms[(string) ($game['platform'] ?? '')]['name'] ?? null];
                }
                $hasNext = $result['has_next'] && $page < 1000;
            } catch (Throwable) {
                $error = 'Search is temporarily unavailable. Check the TheGamesDB API key, allowance, or connection and try again.';
            }
        }

        return Inertia::render('games/find', ['results' => $games, 'query' => $query, 'page' => $page, 'hasNext' => $hasNext, 'error' => $error]);
    }

    public function store(CatalogImportRequest $request, CatalogSynchronizer $synchronizer): RedirectResponse
    {
        try {
            $game = $synchronizer->syncGame($request->integer('thegamesdb_id'));
        } catch (Throwable) {
            throw ValidationException::withMessages(['import' => 'This game could not be imported. Check TheGamesDB credentials, allowance, or connection and try again.']);
        }
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Game saved to the catalog.']);

        return to_route('games.show', $game->slug);
    }
}
