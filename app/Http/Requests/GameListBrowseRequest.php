<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GameListBrowseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['q' => ['nullable', 'string', 'max:100'], 'page' => ['nullable', 'integer', 'between:1,100000']];
    }
}
