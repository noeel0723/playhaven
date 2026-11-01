<?php

namespace App\Http\Requests;

class PublicPlayerStatisticsRequest extends StatisticsRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
