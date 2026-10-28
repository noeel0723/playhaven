<?php

use App\Http\Controllers\GameCatalogController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/games', [GameCatalogController::class, 'index'])->name('games.index');
Route::get('/games/{game:slug}', [GameCatalogController::class, 'show'])->name('games.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
