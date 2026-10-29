<?php

use App\Http\Controllers\DiaryController;
use App\Http\Controllers\GameCatalogController;
use App\Http\Controllers\GameExperienceController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\PlaythroughController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::pattern('playthrough', '[1-9][0-9]{0,17}');
Route::pattern('diaryEntry', '[1-9][0-9]{0,17}');

Route::get('/games', [GameCatalogController::class, 'index'])->name('games.index');
Route::get('/games/{game:slug}', [GameCatalogController::class, 'show'])->name('games.show');

Route::middleware(['auth', 'verified'])->group(function () {
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
