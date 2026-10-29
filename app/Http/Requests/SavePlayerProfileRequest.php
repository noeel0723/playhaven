<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePlayerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('username'))) {
            $this->merge(['username' => strtolower(trim($this->input('username')))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'min:3', 'max:30', 'regex:/^[a-z][a-z0-9_]{2,29}$/', Rule::unique('user_profiles', 'username')->ignore($this->user()->profile()->value('id'))],
            'display_name' => ['required', 'string', 'max:80'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'is_public' => ['required', 'boolean'],
        ];
    }
}
