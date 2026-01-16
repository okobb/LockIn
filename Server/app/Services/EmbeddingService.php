<?php

declare(strict_types=1);

namespace App\Services;

use OpenAI\Client;
use OpenAI\Factory;

class EmbeddingService
{
    private Client $client;
    private string $model;

    public function __construct()
    {
        $apiKey = config('services.openai.key');
        if (empty($apiKey)) {
            $apiKey = env('OPENAI_API_KEY');
        }

        $this->client = \OpenAI::client($apiKey);
        $this->model = config('services.openai.embedding_model', 'text-embedding-3-small');
    }

    /**
     * Generate embedding for a single string.
     *
     * @return array<float>
     */
    public function embed(string $text): array
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
}
