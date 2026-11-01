<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveProfileBannerRequest;
use App\Models\UserProfile;
use App\Services\ProfileBanners;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfileBannerController extends Controller
{
    public function store(SaveProfileBannerRequest $request, ProfileBanners $banners): RedirectResponse
    {
        $banners->replace($request->user(), $request->file('banner'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your profile banner has been updated.']);

        return to_route('players.edit')->withFragment('profile-banner');
    }

    public function destroy(Request $request, ProfileBanners $banners): RedirectResponse
    {
        $banners->remove($request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your profile banner has been removed.']);

        return to_route('players.edit')->withFragment('profile-banner');
    }

    public function show(Request $request, UserProfile $playerProfile, string $banner): StreamedResponse
    {
        $path = 'profile-banners/'.$banner.'.webp';
        abort_unless($playerProfile->banner_path === $path && ProfileBanners::validPath($path), 404);
        abort_unless(($playerProfile->is_public && $playerProfile->username) || $request->user()?->id === $playerProfile->user_id, 404);
        abort_unless(Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path, 'profile-banner.webp', [
            'Content-Type' => 'image/webp', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store',
            'Content-Security-Policy' => "default-src 'none'; sandbox", 'X-Robots-Tag' => 'noindex, nofollow',
        ], 'inline');
    }
}
