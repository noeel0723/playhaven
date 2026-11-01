<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlayerNetworkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'sort' => ['nullable', Rule::in(['recent', 'name'])],
            'page' => ['nullable', 'integer', 'between:1,100000'],
        ];
    }
}
