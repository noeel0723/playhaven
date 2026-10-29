<?php

namespace App\Http\Requests;

use App\Enums\LibraryStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LibraryFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(LibraryStatus::class)],
            'favorite' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['updated', 'name'])],
            'page' => ['nullable', 'integer', 'min:1', 'max:100000'],
        ];
    }
}
