<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CatalogImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['thegamesdb_id' => $this->route('thegamesdbId')]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['thegamesdb_id' => ['required', 'integer', 'between:1,2147483647']];
    }
}
