<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'genre' => ['nullable', 'string', 'max:255'],
            'developer' => ['nullable', 'string', 'max:255'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'between:1970,2100'],
            'sort' => ['nullable', Rule::in(['recent', 'name', 'popular', 'rating'])],
            'page' => ['nullable', 'integer', 'min:1', 'max:100000'],
        ];
    }
}
