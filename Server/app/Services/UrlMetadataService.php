<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UrlMetadataService
{
    public function fetchMetadata(string $url): array
    {
        try {
            /** @var Response $response */
            $response = Http::timeout(5)->get($url);
            
            if ($response->failed()) {
                return $this->getFallbackMetadata($url);
            }

            $html = $response->body();
            $domain = parse_url($url, PHP_URL_HOST);

            return [
                'title' => $this->extractTitle($html) ?? $url,
                'description' => $this->extractMeta($html, 'description') ?? $this->extractMeta($html, 'og:description'),
                'image' => $this->extractMeta($html, 'og:image'),
                'domain' => str_replace('www.', '', $domain),
                'type' => $this->detectType($url, $html),
            ];
        } catch (\Exception $e) {
            return $this->getFallbackMetadata($url);
        }
    }

    public function detectType(string $url, string $html = ''): string
    {
        $domain = parse_url($url, PHP_URL_HOST);
        
        if (Str::contains($domain, ['youtube.com', 'youtu.be', 'vimeo.com'])) {
            return RESOURCE_TYPE_VIDEO;
        }

        if (Str::endsWith($url, ['.pdf', '.doc', '.docx'])) {
            return RESOURCE_TYPE_DOCUMENT;
        }

        if (Str::endsWith($url, ['.png', '.jpg', '.jpeg', '.gif', '.webp'])) {
            return RESOURCE_TYPE_IMAGE;
        }

        // Simple heuristic for documentation
        if (Str::contains($url, ['docs.', 'documentation', '/docs/']) || 
            Str::contains($html, ['<article', 'Documentation', 'API Reference'])) {
            return RESOURCE_TYPE_DOCUMENTATION;
        }

        return RESOURCE_TYPE_ARTICLE;
    }

    private function extractTitle(string $html): ?string
    {
        if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $matches)) {
            return trim($matches[1]);
        }
        return $this->extractMeta($html, 'og:title');
    }

    private function extractMeta(string $html, string $name): ?string
    {
        if (preg_match('/<meta[^>]+(?:name|property)="'.preg_quote($name, '/').'"[^>]+content="([^"]+)"/i', $html, $matches)) {
            return html_entity_decode($matches[1]);
        }
        return null;
    }

    private function getFallbackMetadata(string $url): array
    {
        $domain = parse_url($url, PHP_URL_HOST);
        return [
            'title' => $url,
            'description' => null,
            'image' => null,
            'domain' => str_replace('www.', '', $domain ?? ''),
            'type' => $this->detectType($url),
        ];
    }
}
