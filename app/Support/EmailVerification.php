<?php

namespace App\Support;

class EmailVerification
{
    public static function required(): bool
    {
        return ! app()->environment('local') || (bool) config('auth.require_email_verification', true);
    }
}
