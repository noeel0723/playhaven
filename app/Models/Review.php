<?php

namespace App\Models;

use Database\Factories\ReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['library_entry_id', 'body', 'contains_spoilers', 'is_public'])]
class Review extends Model
{
    /** @use HasFactory<ReviewFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'contains_spoilers' => 'boolean',
            'is_public' => 'boolean',
        ];
    }

    /** @return BelongsTo<LibraryEntry, $this> */
    public function libraryEntry(): BelongsTo
    {
        return $this->belongsTo(LibraryEntry::class);
    }
}
