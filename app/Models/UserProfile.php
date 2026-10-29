<?php

namespace App\Models;

use App\Services\ProfilePhotos;
use Database\Factories\UserProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;

#[Fillable(['user_id', 'username', 'display_name', 'bio', 'avatar_path', 'is_public', 'share_recent_completed'])]
class UserProfile extends Model
{
    /** @use HasFactory<UserProfileFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::deleted(function (UserProfile $profile): void {
            $path = $profile->avatar_path;
            DB::afterCommit(fn () => ProfilePhotos::deleteFile($path));
        });
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['is_public' => 'boolean', 'share_recent_completed' => 'boolean'];
    }

    /** @return BelongsToMany<Game, $this> */
    public function topGames(): BelongsToMany
    {
        return $this->belongsToMany(Game::class, 'profile_game_favorites')->withPivot('position')->orderByPivot('position');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
