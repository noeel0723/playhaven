<?php

namespace App\Services\Rawg;

use RuntimeException;

class RawgRateLimited extends RuntimeException
{
    public function __construct(public int $retryAfter = 1)
    {
        parent::__construct('RAWG requests are temporarily rate limited.');
    }
}
