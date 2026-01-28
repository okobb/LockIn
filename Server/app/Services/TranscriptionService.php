<?php

declare(strict_types=1);

namespace App\Services;

use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TranscriptionService
{
    public function transcribe(string $path): ?string
    {
        $apiKey = config('services.openai.key');

        if (! $apiKey) {
            Log::warning('OpenAI API key not configured.');
            return null;
        }

        if (! Storage::exists($path)) {
            Log::error("Transcription failed: File not found at {$path}");
            return null;
        }

        try {
            $fileContent = Storage::get($path);

            $filename = basename($path);

            /** @var Response $response */
            $response = Http::withToken($apiKey)
                ->attach('file', $fileContent, $filename)
                ->post('https://api.openai.com/v1/audio/transcriptions', [
                    'model' => 'whisper-1',
                    'language' => 'en',
                ]);

            if ($response->successful()) {
                return $response->json('text');
            }

            Log::error('OpenAI Transcription API Error: ' . $response->body());
            return null;
        } catch (Exception $e) {
            Log::error('Transcription Exception: ' . $e->getMessage());
            return null;
        }
    }
}
