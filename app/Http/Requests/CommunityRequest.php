<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CommunityRequest extends FormRequest
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
            'feed' => ['nullable', Rule::in(['everyone', 'following'])],
            'page' => ['nullable', 'integer', 'between:1,100000'],
            'reviews_page' => ['nullable', 'integer', 'between:1,100000'],
            'lists_page' => ['nullable', 'integer', 'between:1,100000'],
        ];
    }
}
