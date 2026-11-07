<?php

namespace App\Services\TheGamesDb;

class CatalogImage
{
    public static function url(mixed $value): ?string
    {
        if (! is_string($value) || strlen($value) > 2048 || ! filter_var($value, FILTER_VALIDATE_URL)) {
            return null;
        }
        $parts = parse_url($value);
        $path = is_array($parts) ? ($parts['path'] ?? '') : '';
        if (! is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || ($parts['host'] ?? '') !== 'cdn.thegamesdb.net'
            || isset($parts['user']) || isset($parts['pass']) || isset($parts['port']) || isset($parts['query']) || isset($parts['fragment'])
            || ! preg_match('~^/images/(original|large|medium|small|thumb)/[a-zA-Z0-9_./% -]+\.(jpg|jpeg|png|webp)$~i', $path)
            || preg_match('~\.\.|%2e|%2f|%5c|%00~i', $path)) {
            return null;
        }

        return $value;
    }

    public static function filename(mixed $filename): ?string
    {
        if (! is_string($filename) || str_contains($filename, '..') || str_starts_with($filename, '/') || ! preg_match('~^[a-zA-Z0-9_./ -]+\.(jpg|jpeg|png|webp)$~i', $filename)) {
            return null;
        }

        return self::url('https://cdn.thegamesdb.net/images/original/'.implode('/', array_map('rawurlencode', explode('/', $filename))));
    }

    /** @param array<array-key, mixed> $images */
    public static function pick(array $images, bool $banner = false): ?string
    {
        foreach ($banner ? ['fanart', 'banner', 'screenshot'] : ['boxart'] as $type) {
            foreach ($images as $image) {
                if (! is_array($image) || ($image['type'] ?? null) !== $type || (! $banner && ($image['side'] ?? null) !== 'front')) {
                    continue;
                }
                if ($url = self::filename($image['filename'] ?? null)) {
                    return $url;
                }
            }
        }

        return null;
    }
}
