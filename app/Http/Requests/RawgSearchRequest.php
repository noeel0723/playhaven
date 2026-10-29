<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RawgSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['q' => ['nullable', 'string', 'min:2', 'max:100'], 'page' => ['nullable', 'integer', 'between:1,1000']];
    }
}
