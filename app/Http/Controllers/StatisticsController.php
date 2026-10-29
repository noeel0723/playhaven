<?php

namespace App\Http\Controllers;

use App\Http\Requests\StatisticsRequest;
use App\Services\PlayerStatistics;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class StatisticsController extends Controller
{
    public function index(StatisticsRequest $request, PlayerStatistics $statistics): Response
    {
        $year = $request->filled('year') ? $request->integer('year') : now()->year;
        $response = Inertia::render('stats/index', ['stats' => $statistics->forUser($request->user(), $year)])->toResponse($request);
        $response->headers->set('Cache-Control', 'private, no-store');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }
}
