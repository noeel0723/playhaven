<?php

use App\Http\Controllers\GameCatalogController;
use App\Http\Controllers\LibraryController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/games', [GameCatalogController::class, 'index'])->name('games.index');
Route::get('/games/{game:slug}', [GameCatalogController::class, 'show'])->name('games.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [LibraryController::class, 'dashboard'])->name('dashboard');
    Route::get('library', [LibraryController::class, 'index'])->name('library.index');
    Route::put('library/{game:slug}', [LibraryController::class, 'save'])->name('library.save');
    Route::delete('library/{game:slug}', [LibraryController::class, 'destroy'])->name('library.destroy');
});

require __DIR__.'/settings.php';
