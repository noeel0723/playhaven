<?php

namespace App\Models;

use Database\Factories\DiaryEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['playthrough_id', 'logged_on', 'minutes_played', 'notes'])]
class DiaryEntry extends Model
{
    /** @use HasFactory<DiaryEntryFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'logged_on' => 'immutable_date',
            'minutes_played' => 'integer',
        ];
    }

    /** @return BelongsTo<Playthrough, $this> */
    public function playthrough(): BelongsTo
    {
        return $this->belongsTo(Playthrough::class);
    }
}
