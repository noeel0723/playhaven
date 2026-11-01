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
            'return_to_network' => ['sometimes', Rule::in(['followers', 'following'])],
            'network_owner' => [Rule::excludeIf(! $this->filled('return_to_network')), 'sometimes', 'boolean'],
            'network_username' => [Rule::excludeIf(! $this->filled('return_to_network')), Rule::requiredIf($this->filled('return_to_network') && ! $this->boolean('network_owner')), 'nullable', 'string', 'regex:/^[A-Za-z][A-Za-z0-9_]{2,29}$/'],
            'sort' => [Rule::excludeIf(! $this->filled('return_to_network')), 'nullable', Rule::in(['recent', 'name'])],
            'q' => [Rule::excludeIf(! $this->boolean('return_to_players')), 'nullable', 'string', 'max:100'],
            'page' => [Rule::excludeIf(! $this->boolean('return_to_players') && ! $this->filled('return_to_network')), 'nullable', 'integer', 'between:1,100000'],
        ];
    }
}
