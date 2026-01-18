<?php

declare(strict_types=1);

namespace App\Services;

use DateInterval;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class VideoMetadataService
{
    /**
     * Get video duration in minutes
     */
    public function getDuration(string $url): ?int
    {
        if (Str::contains($url, ['youtube.com', 'youtu.be'])) {
            return $this->getYouTubeDuration($url);
        }

        if (Str::contains($url, 'vimeo.com')) {
            return $this->getVimeoDuration($url);
        }

        return null;
    }

    private function getYouTubeDuration(string $url): ?int
    {
        $videoId = $this->extractYouTubeId($url);
        if (!$videoId) return null;

        $cacheKey = "youtube_duration_{$videoId}";

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($videoId) {
            $apiKey = config('services.youtube.key');
            if (!$apiKey) return null;

            try {
                $response = Http::get('https://www.googleapis.com/youtube/v3/videos', [
                    'id' => $videoId,
                    'part' => 'contentDetails',
                    'key' => $apiKey,
                ]);

                if ($response->successful()) {
                    $items = $response->json('items');
                    if (!empty($items)) {
                        $durationIso = $items[0]['contentDetails']['duration'];
                        return $this->parseIsoDuration($durationIso);
                    }
                }
            } catch (\Exception $e) {
                return null;
            }

            return null;
        });
    }

    private function getVimeoDuration(string $url): ?int
    {
        $cacheKey = "vimeo_duration_" . md5($url);

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($url) {
            try {
                $response = Http::get('https://vimeo.com/api/oembed.json', [
                    'url' => $url,
                ]);

                if ($response->successful()) {
                    $seconds = $response->json('duration');
                    return (int) ceil($seconds / 60);
                }
            } catch (\Exception $e) {
                return null;
            }
            return null;
        });
    }

    private function extractYouTubeId(string $url): ?string
    {
        preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i', $url, $matches);
        return $matches[1] ?? null;
    }

    private function parseIsoDuration(string $iso): int
    {
        try {
            $interval = new DateInterval($iso);
            $minutes = ($interval->h * 60) + $interval->i;
            if ($interval->s > 30) $minutes++; // Round up seconds
            return $minutes ?: 1; // Minimum 1 min
        } catch (\Exception $e) {
            return 0;
        }
    }
}
