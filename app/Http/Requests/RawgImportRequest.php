<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RawgImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['rawg_id' => $this->route('rawgId')]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['rawg_id' => ['required', 'integer', 'between:1,2147483647']];
    }
}
