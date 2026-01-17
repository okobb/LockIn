<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use OpenAI;
use OpenAI\Client;

class EmbeddingService
{
    private Client $client;
    private string $model;
    private bool $cacheEnabled;
    private int $cacheTtl;

    public function __construct()
    {
        $apiKey = config('services.openai.key');
        if (empty($apiKey)) {
            $apiKey = env('OPENAI_API_KEY');
        }

        $this->client = OpenAI::client($apiKey);
        $this->model = config('services.openai.embedding_model', 'text-embedding-3-small');
        $this->cacheEnabled = config('rag.cache_embeddings', true);
        $this->cacheTtl = config('rag.cache_ttl_seconds', 3600);
    }

    /**
     * Generate embedding for a single string with optional caching.
     *
     * @return array<float>
     */
    public function embed(string $text): array
    {
        if ($this->cacheEnabled) {
            $cacheKey = $this->getCacheKey($text);
            
            return Cache::remember($cacheKey, $this->cacheTtl, fn() => $this->fetchEmbedding($text));
        }

        return $this->fetchEmbedding($text);
    }

    /**
     * Fetch embedding from OpenAI API.
     *
     * @return array<float>
     */
    private function fetchEmbedding(string $text): array
    {
        $response = $this->client->embeddings()->create([
            'model' => $this->model,
            'input' => $text,
        ]);

        return $response->embeddings[0]->embedding;
    }

    /**
     * Generate embeddings for a batch of strings.
     *
     * @param array<string> $texts
     * @return array<int, array<float>>
     */
    public function embedBatch(array $texts): array
    {
        if (empty($texts)) {
            return [];
        }
        
        $batches = array_chunk($texts, 50);
        $allEmbeddings = [];

        foreach ($batches as $batch) {
            $formattedInput = array_values($batch);
            
            $response = $this->client->embeddings()->create([
                'model' => $this->model,
                'input' => $formattedInput,
            ]);

            foreach ($response->embeddings as $embedding) {
                $allEmbeddings[$embedding->index] = $embedding->embedding;
            }
        }

        return $allEmbeddings;
    }

    public function getModelName(): string
    {
        return $this->model;
    }

    /**
     * Generate cache key for embedding.
     */
    private function getCacheKey(string $text): string
    {
        return 'embedding:' . md5($text . ':' . $this->model);
    }

    /**
     * Clear embedding cache for a specific text.
     */
    public function clearCache(string $text): void
    {
        Cache::forget($this->getCacheKey($text));
    }
}
