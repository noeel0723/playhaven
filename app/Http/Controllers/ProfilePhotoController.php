<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveProfilePhotoRequest;
use App\Models\UserProfile;
use App\Services\ProfilePhotos;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfilePhotoController extends Controller
{
    public function store(SaveProfilePhotoRequest $request, ProfilePhotos $photos): RedirectResponse
    {
        $photos->replace($request->user(), $request->file('avatar'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your profile photo has been updated.']);

        return to_route('players.edit')->withFragment('profile-photo');
    }

    public function destroy(Request $request, ProfilePhotos $photos): RedirectResponse
    {
        $photos->remove($request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your profile photo has been removed.']);

        return to_route('players.edit')->withFragment('profile-photo');
    }

    public function show(Request $request, UserProfile $playerProfile, string $photo): StreamedResponse
    {
        $path = 'avatars/'.$photo.'.webp';
        abort_unless($playerProfile->avatar_path === $path && ProfilePhotos::validPath($path), 404);
        abort_unless(($playerProfile->is_public && $playerProfile->username) || $request->user()?->id === $playerProfile->user_id, 404);
        abort_unless(Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path, 'profile-photo.webp', [
            'Content-Type' => 'image/webp', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store',
            'Content-Security-Policy' => "default-src 'none'; sandbox", 'X-Robots-Tag' => 'noindex, nofollow',
        ], 'inline');
    }
}
