<?php

declare(strict_types=1);

namespace App\Services;

use DateInterval;
use Exception;
use Illuminate\Http\Client\Response;
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

    public function fetchDetails(string $url): ?array
    {
        $videoId = $this->extractYouTubeId($url);
        if (!$videoId) return null;

        $apiKey = config('services.youtube.key');
        if (!$apiKey) return null;

        return Cache::remember("youtube_details_{$videoId}", now()->addDays(30), function () use ($videoId, $apiKey) {
            try {
                /** @var Response $response */
                $response = Http::get('https://www.googleapis.com/youtube/v3/videos', [
                    'id' => $videoId,
                    'part' => 'snippet,contentDetails',
                    'key' => $apiKey,
                ]);

                if ($response->successful()) {
                    $items = $response->json('items');
                    if (!empty($items)) {
                        $item = $items[0];
                        $snippet = $item['snippet'];
                        $contentDetails = $item['contentDetails'];

                        return [
                            'title' => $snippet['title'],
                            'description' => $snippet['description'],
                            'thumbnail_url' => $snippet['thumbnails']['maxres']['url'] 
                                ?? $snippet['thumbnails']['high']['url'] 
                                ?? $snippet['thumbnails']['default']['url'],
                            'duration' => $this->parseIsoDuration($contentDetails['duration']),
                            'tags' => $snippet['tags'] ?? [],
                            'channel_title' => $snippet['channelTitle'],
                            'published_at' => $snippet['publishedAt'],
                        ];
                    }
                }
            } catch (Exception $e) {
                return null;
            }

            return null;
        });
    }

    private function getYouTubeDuration(string $url): ?int
    {
        $details = $this->fetchDetails($url);
        return $details['duration'] ?? null;
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
            } catch (Exception $e) {
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

    public function getTranscript(string $url): ?string
    {
        if (!Str::contains($url, ['youtube.com', 'youtu.be'])) {
            return null;
        }

        $videoId = $this->extractYouTubeId($url);
        if (!$videoId) return null;

        return Cache::remember("youtube_transcript_{$videoId}", now()->addDays(7), function () use ($videoId) {
            try {
                /** @var Response $response */
                $response = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language' => 'en-US,en;q=0.9',
                ])->get("https://www.youtube.com/watch?v={$videoId}");
                
                if ($response->failed()) return null;

                $html = $response->body();
                
                // Extract player response
                if (!preg_match('/ytInitialPlayerResponse\s*=\s*({.+?});/s', $html, $matches)) {
                    return null;
                }

                $json = json_decode($matches[1], true);
                $captionTracks = $json['captions']['playerCaptionsTracklistRenderer']['captionTracks'] ?? [];

                if (empty($captionTracks)) return null;

                // Prefer English, then first available
                $trackUrl = $captionTracks[0]['baseUrl'];
                foreach ($captionTracks as $track) {
                    if (str_contains($track['languageCode'] ?? '', 'en')) {
                        $trackUrl = $track['baseUrl'];
                        break;
                    }
                }

                // Fetch transcript XML
                $transcriptResponse = Http::get($trackUrl);
                if ($transcriptResponse->failed()) return null;

                $xml = simplexml_load_string($transcriptResponse->body());
                if (!$xml) return null;

                $text = [];
                foreach ($xml->text as $line) {
                    $text[] = html_entity_decode((string)$line);
                }

                return implode(' ', $text);

            } catch (Exception $e) {
                return null;
            }
        });
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
