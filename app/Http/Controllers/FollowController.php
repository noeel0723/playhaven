<?php

namespace App\Http\Controllers;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class FollowController extends Controller
{
    public function store(Request $request, string $username): RedirectResponse
    {
        $player = $this->player($username);
        if ($player->id === $request->user()->id) {
            throw ValidationException::withMessages(['follow' => 'You cannot follow yourself.']);
        }
        Follow::firstOrCreate(['follower_id' => $request->user()->id, 'followed_id' => $player->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'You are now following this player.']);

        return to_route('players.show', ['username' => $player->profile->username]);
    }

    public function destroy(Request $request, string $username): RedirectResponse
    {
        $player = $this->player($username);
        Follow::where('follower_id', $request->user()->id)->where('followed_id', $player->id)->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'You have unfollowed this player.']);

        return to_route('players.show', ['username' => $player->profile->username]);
    }

    private function player(string $username): User
    {
        return User::publicPlayer()->with('profile')->whereHas('profile', fn (Builder $query) => $query->whereRaw('LOWER(username) = ?', [strtolower($username)]))->firstOrFail();
    }
}
