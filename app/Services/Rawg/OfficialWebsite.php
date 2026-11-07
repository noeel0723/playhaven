<?php

namespace App\Services\Rawg;

class OfficialWebsite
{
    public static function url(mixed $value): ?string
    {
        if (! is_string($value) || strlen($value) > 2048 || ! filter_var($value, FILTER_VALIDATE_URL)) {
            return null;
        }
        $url = parse_url($value);
        if (! is_array($url) || ! in_array(strtolower($url['scheme'] ?? ''), ['https', 'http'], true) || isset($url['user']) || isset($url['pass']) || (isset($url['port']) && ! in_array($url['port'], [80, 443], true))) {
            return null;
        }
        $host = strtolower($url['host'] ?? '');
        $ip = trim($host, '[]');
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) ? $value : null;
        }
        if (! str_contains($host, '.') || preg_match('/\.(localhost|local|test|internal|invalid)$/', $host) || preg_match('/^[0-9.]+$/', $host)) {
            return null;
        }

        return $value;
    }
}
