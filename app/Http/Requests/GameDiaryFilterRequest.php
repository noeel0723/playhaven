<?php

namespace App\Http\Requests;

use App\Enums\LibraryStatus;
use Illuminate\Validation\Rule;

class GameDiaryFilterRequest extends HistoryRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [...parent::rules(), 'status' => ['nullable', Rule::enum(LibraryStatus::class)]];
    }
}
