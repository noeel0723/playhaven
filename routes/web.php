<?php

use App\Http\Controllers\DiaryController;
use App\Http\Controllers\GameCatalogController;
use App\Http\Controllers\GameConnectionController;
use App\Http\Controllers\GameExperienceController;
use App\Http\Controllers\GameListController;
use App\Http\Controllers\GameListItemController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\PlaythroughController;
use App\Http\Controllers\RawgDiscoveryController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::pattern('playthrough', '[1-9][0-9]{0,17}');
Route::pattern('diaryEntry', '[1-9][0-9]{0,17}');
Route::pattern('gameList', '[1-9][0-9]{0,17}');
Route::pattern('listItem', '[1-9][0-9]{0,17}');
Route::pattern('listOwner', '[1-9][0-9]{0,17}');
Route::pattern('rawgId', '[1-9][0-9]{0,9}');

Route::get('/games', [GameCatalogController::class, 'index'])->name('games.index');
Route::get('/games/{game:slug}', [GameCatalogController::class, 'show'])->name('games.show');
Route::get('lists/discover', [GameListController::class, 'discover'])->name('lists.discover');
Route::get('lists/{listOwner}/{listSlug}', [GameListController::class, 'show'])->name('lists.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('games/{game:slug}/connections/refresh', [GameConnectionController::class, 'refresh'])->middleware('throttle:rawg-connections')->name('games.connections.refresh');
    Route::get('lists', [GameListController::class, 'index'])->name('lists.index');
    Route::post('my-lists', [GameListController::class, 'store'])->name('lists.store');
    Route::put('my-lists/{gameList}', [GameListController::class, 'update'])->name('lists.update');
    Route::delete('my-lists/{gameList}', [GameListController::class, 'destroy'])->name('lists.destroy');
    Route::post('my-lists/{gameList}/items', [GameListItemController::class, 'store'])->name('list-items.store');
    Route::put('my-lists/{gameList}/items/{listItem}', [GameListItemController::class, 'update'])->name('list-items.update');
    Route::delete('my-lists/{gameList}/items/{listItem}', [GameListItemController::class, 'destroy'])->name('list-items.destroy');
    Route::get('discover/rawg', [RawgDiscoveryController::class, 'index'])->middleware('throttle:rawg-search')->name('catalog.search');
    Route::post('discover/rawg/{rawgId}', [RawgDiscoveryController::class, 'store'])->middleware('throttle:rawg-import')->name('catalog.import');
    Route::get('dashboard', [LibraryController::class, 'dashboard'])->name('dashboard');
    Route::get('library', [LibraryController::class, 'index'])->name('library.index');
    Route::put('library/{game:slug}', [LibraryController::class, 'save'])->name('library.save');
    Route::delete('library/{game:slug}', [LibraryController::class, 'destroy'])->name('library.destroy');
    Route::put('library/{game:slug}/rating', [GameExperienceController::class, 'rate'])->name('ratings.update');
    Route::put('library/{game:slug}/review', [GameExperienceController::class, 'review'])->name('reviews.update');
    Route::delete('library/{game:slug}/review', [GameExperienceController::class, 'destroyReview'])->name('reviews.destroy');
    Route::get('library/{game:slug}/playthroughs', [PlaythroughController::class, 'index'])->name('playthroughs.index');
    Route::post('library/{game:slug}/playthroughs', [PlaythroughController::class, 'store'])->name('playthroughs.store');
    Route::get('playthroughs/{playthrough}', [PlaythroughController::class, 'show'])->name('playthroughs.show');
    Route::put('playthroughs/{playthrough}', [PlaythroughController::class, 'update'])->name('playthroughs.update');
    Route::delete('playthroughs/{playthrough}', [PlaythroughController::class, 'destroy'])->name('playthroughs.destroy');
    Route::get('diary', [DiaryController::class, 'index'])->name('diary.index');
    Route::post('playthroughs/{playthrough}/sessions', [DiaryController::class, 'store'])->name('sessions.store');
    Route::put('playthroughs/{playthrough}/sessions/{diaryEntry}', [DiaryController::class, 'update'])->name('sessions.update');
    Route::delete('playthroughs/{playthrough}/sessions/{diaryEntry}', [DiaryController::class, 'destroy'])->name('sessions.destroy');
});

require __DIR__.'/settings.php';
