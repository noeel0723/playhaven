<?php

namespace App\Http\Requests;

use App\Enums\LibraryStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveLibraryEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(LibraryStatus::class)],
            'is_favorite' => ['required', 'boolean'],
        ];
    }
}
