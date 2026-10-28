<?php

namespace App\Models;

use Database\Factories\RatingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use InvalidArgumentException;

/** @property int $score */
#[Fillable(['library_entry_id', 'score'])]
class Rating extends Model
{
    /** @use HasFactory<RatingFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'score' => 'integer',
        ];
    }

    /** @return BelongsTo<LibraryEntry, $this> */
    public function libraryEntry(): BelongsTo
    {
        return $this->belongsTo(LibraryEntry::class);
    }

    /** @return Attribute<float, never> */
    protected function stars(): Attribute
    {
        return Attribute::get(fn (): float => $this->score / 2);
    }

    public function setStars(float $stars): self
    {
        if (! is_finite($stars) || $stars < 0.5 || $stars > 5 || floor($stars * 2) !== $stars * 2) {
            throw new InvalidArgumentException('Ratings must be between 0.5 and 5 stars in half-star increments.');
        }

        $this->score = (int) ($stars * 2);

        return $this;
    }
}
