<?php

namespace App\Http\Requests;

use App\Enums\ListVisibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GameListBrowseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['q' => ['nullable', 'string', 'max:100'], 'page' => ['nullable', 'integer', 'between:1,100000'], 'sort' => ['nullable', 'string', Rule::in(['recent', 'largest', 'name'])], 'visibility' => ['nullable', Rule::enum(ListVisibility::class)]];
    }
}
