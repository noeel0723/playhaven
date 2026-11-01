<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveProfileBannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['banner' => ['required', 'file', 'image', 'mimetypes:image/jpeg,image/png,image/webp', 'extensions:jpg,jpeg,png,webp', 'max:5120', 'dimensions:min_width=600,min_height=200,max_width=5000,max_height=3000']];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return ['banner' => 'profile banner'];
    }
}
