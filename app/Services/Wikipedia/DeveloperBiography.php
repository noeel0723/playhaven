<?php

namespace App\Services\Wikipedia;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class DeveloperBiography
{
    /** @return array{text: string, title: string, page_id: int, revision: string|null, url: string}|null */
    public function find(string $name, ?string $savedTitle = null, ?int $pageId = null, bool $force = false): ?array
    {
        $title = $savedTitle ?: $name;
        if (trim($title) === '' || mb_strlen($title) > 255 || preg_match('/[\x00-\x1F\x7F]/', $title)) {
            return null;
        }
        $cacheKey = 'wikipedia.developer.'.hash('sha256', $name.'|'.$title.'|'.$pageId);
        if ($force) {
            Cache::forget($cacheKey);
        }
        $result = Cache::remember($cacheKey, now()->addDay(), function () use ($title, $name, $pageId): array {
            return Cache::lock('wikipedia.developer-requests', 20)->block(3, function () use ($title, $name, $pageId): array {
                try {
                    $response = Http::acceptJson()->withUserAgent('PlayHaven/1.0 (developer biography enrichment; '.config('app.url').')')
                        ->connectTimeout(4)->timeout(10)->withOptions(['allow_redirects' => false])
                        ->get('https://en.wikipedia.org/api/rest_v1/page/summary/'.rawurlencode(str_replace(' ', '_', $title)));
                } catch (Throwable) {
                    throw new RuntimeException('Wikipedia could not be reached. Saved biography was preserved.');
                }
                if ($response->status() === 404) {
                    return ['biography' => null];
                }
                if (! $response->successful()) {
                    throw new RuntimeException('Wikipedia biography request failed.');
                }
                $data = $response->json();
                if (! is_array($data)) {
                    throw new RuntimeException('Invalid Wikipedia response.');
                }
                if (($data['type'] ?? null) !== 'standard' || ($data['namespace']['id'] ?? null) !== 0
                    || ! is_int($data['pageid'] ?? null) || $data['pageid'] < 1
                    || ! is_string($data['title'] ?? null) || trim($data['title']) === '' || mb_strlen($data['title']) > 255
                    || ! is_string($data['extract'] ?? null) || mb_strlen($data['extract']) > 20000) {
                    return ['biography' => null];
                }
                if ($pageId !== null && $pageId !== $data['pageid']) {
                    return ['biography' => null];
                }
                $text = self::plainText($data['extract']);
                $shortDescription = is_string($data['description'] ?? null) ? $data['description'] : '';
                $context = mb_strtolower($shortDescription.' '.$text);
                // Exact article names or explicit aliases only: never use a first
                // search result, a disambiguation page, or an unrelated company.
                $normalizedName = $this->normalize($name);
                $sameName = $normalizedName !== '' && $normalizedName === $this->normalize($data['title']);
                $explicitAlias = mb_strlen($normalizedName) >= 4 && preg_match('/(?:^| )'.preg_quote($normalizedName, '/').'(?: |$)/', $this->normalize($text));
                if ((! $sameName && ! $explicitAlias) || mb_strlen($text) < 80
                    || ! preg_match('/\b(video game|computer game|game develop|game publish|interactive entertainment|video gaming)/i', $context)
                    || ! preg_match('/\b(company|developer|publisher|studio|division|subsidiary|corporation)\b/i', $context)) {
                    return ['biography' => null];
                }

                return ['biography' => ['text' => $text, 'title' => $data['title'], 'page_id' => $data['pageid'],
                    'revision' => (is_string($data['revision'] ?? null) || is_int($data['revision'] ?? null)) && preg_match('/^[0-9]{1,32}$/', (string) $data['revision']) ? (string) $data['revision'] : null,
                    'url' => 'https://en.wikipedia.org/wiki/'.rawurlencode(str_replace(' ', '_', $data['title']))]];
            });
        });

        return $result['biography'];
    }

    public static function plainText(?string $value): string
    {
        $paragraphs = preg_replace('~</(?:p|div)>|<br\s*/?>~i', "\n\n", $value ?? '') ?? '';
        $text = html_entity_decode(strip_tags($paragraphs), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/[^\S\n]+/u', ' ', $text) ?? '';

        return preg_replace('/^\s+|\s+$/u', '', $text) ?? '';
    }

    public static function sourceUrl(?string $url, ?string $source): ?string
    {
        if (! is_string($url) || strlen($url) > 2048 || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }
        $parts = parse_url($url);
        $host = $source === 'wikipedia' ? 'en.wikipedia.org' : ($source === 'rawg' ? 'rawg.io' : null);
        $prefix = $source === 'wikipedia' ? '/wiki/' : '/developers/';
        if (! is_array($parts) || $host === null || ($parts['scheme'] ?? null) !== 'https' || ($parts['host'] ?? null) !== $host
            || isset($parts['user']) || isset($parts['pass']) || isset($parts['port']) || isset($parts['query']) || isset($parts['fragment'])
            || ! str_starts_with($parts['path'] ?? '', $prefix)) {
            return null;
        }

        return $url;
    }

    private function normalize(string $value): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', ' ', strtolower(Str::ascii($value))) ?? '');
    }
}
