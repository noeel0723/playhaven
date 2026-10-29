<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePlayerShowcaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'top_games' => ['present', 'array', 'list', 'max:4'],
            'top_games.*' => ['required', 'integer', 'min:1', 'distinct', Rule::exists('games', 'id')],
            'share_recent_completed' => ['required', 'boolean'],
        ];
    }
}
