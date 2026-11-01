<?php

namespace App\Http\Requests;

class PublicPlayerDiaryRequest extends GameDiaryFilterRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
