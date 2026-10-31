<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FollowPlayerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'return_to_players' => ['sometimes', 'boolean'],
            'q' => [Rule::excludeIf(! $this->boolean('return_to_players')), 'nullable', 'string', 'max:100'],
            'page' => [Rule::excludeIf(! $this->boolean('return_to_players')), 'nullable', 'integer', 'between:1,100000'],
        ];
    }
}
