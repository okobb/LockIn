<?php

declare(strict_types=1);

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClassificationService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.ml.url', 'http://localhost:8080');
    }

    /**
     * Classify a message as Important or Noise.
     *
     * @param string $message
     * @return array{is_important: bool, confidence: float, tag: string}|null
     */
    public function classify(string $message): ?array
    {
        try {
            $response = Http::post("{$this->baseUrl}/classify", [
                'message' => $message,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('ML Service classification failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

        } catch (\Exception $e) {
            Log::error('ML Service connection error', [
                'error' => $e->getMessage(),
                'url' => $this->baseUrl
            ]);
        }

        return null;
    }
}
