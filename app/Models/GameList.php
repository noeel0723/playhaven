<?php

namespace App\Models;

use App\Enums\ListVisibility;
use Database\Factories\GameListFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'slug', 'description', 'visibility'])]
class GameList extends Model
{
    /** @use HasFactory<GameListFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'visibility' => ListVisibility::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<GameListItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(GameListItem::class)->orderBy('position')->orderBy('id');
    }
}
