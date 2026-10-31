<?php

namespace App\Http\Requests;

use App\Enums\LibraryStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LogGameDiaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('review_body'))) {
            $this->merge(['review_body' => preg_replace('/^[\s\p{Z}]+|[\s\p{Z}]+$/u', '', $this->input('review_body'))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(LibraryStatus::class)],
            'logged_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:0001-01-01', 'before_or_equal:today'],
            'completed_on' => ['exclude_unless:status,completed', 'required', 'date_format:Y-m-d', 'after_or_equal:0001-01-01', 'before_or_equal:today', 'before_or_equal:logged_on'],
            'review_body' => ['nullable', 'string', 'max:10000'],
            'stars' => ['sometimes', 'nullable', 'numeric', 'between:0.5,5', 'multiple_of:0.5'],
            'contains_spoilers' => ['required', 'boolean'],
            'is_public' => ['required', 'boolean'],
            'return_to_diary' => ['sometimes', 'boolean'],
        ];
    }
}
