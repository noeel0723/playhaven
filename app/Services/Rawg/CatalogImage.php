<?php

namespace App\Services\Rawg;

class CatalogImage
{
    public static function url(mixed $url): ?string
    {
        if (! is_string($url) || strlen($url) > 2048 || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }
        $parts = parse_url($url);
        if (! is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || ($parts['host'] ?? '') !== 'media.rawg.io'
            || isset($parts['user']) || isset($parts['pass']) || isset($parts['port'])
            || isset($parts['query']) || isset($parts['fragment']) || ! str_starts_with($parts['path'] ?? '', '/media/')) {
            return null;
        }

        return $url;
    }
}
