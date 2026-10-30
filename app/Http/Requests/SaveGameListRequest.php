<?php

namespace App\Http\Requests;

use App\Enums\ListVisibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveGameListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('name'))) {
            $this->merge(['name' => preg_replace('/^[\s\p{Z}]+|[\s\p{Z}]+$/u', '', $this->input('name'))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:150'], 'description' => ['nullable', 'string', 'max:5000'], 'visibility' => ['required', Rule::enum(ListVisibility::class)], 'return_to_edit' => ['sometimes', 'boolean']];
    }
}
