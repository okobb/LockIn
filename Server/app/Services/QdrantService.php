<?php

declare(strict_types=1);

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class QdrantService
{
    private Client $client;
    private string $baseUrl;
    private ?string $apiKey;
    private string $collectionName;

    public function __construct()
    {
        $this->baseUrl = config('services.qdrant.host') ?? env('QDRANT_URL', 'http://localhost:6333');
        $this->apiKey = config('services.qdrant.key') ?? env('QDRANT_API_KEY');
        $this->collectionName = config('services.qdrant.collection') ?? env('QDRANT_COLLECTION', 'knowledge_chunks');

        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'headers' => [
                'api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    /**
     * Create collection if it doesn't exist.
     */
    public function ensureCollectionExists(): void
    {
        try {
            $this->client->get("/collections/{$this->collectionName}");
        } catch (GuzzleException $e) {
            if ($e->getCode() === 404) {
                $this->createCollection();
            } else {
                throw $e;
            }
        }
    }

    private function createCollection(): void
    {
        $this->client->put("/collections/{$this->collectionName}", [
            'json' => [
                'vectors' => [
                    'size' => 1536, // OpenAI text-embedding-3-small
                    'distance' => 'Cosine',
                ],
            ],
        ]);
        
        $this->createPayloadIndex('user_id', 'integer');
        $this->createPayloadIndex('context_id', 'integer');
    }

    /**
     * Create a payload index.
     */
    public function createPayloadIndex(string $fieldName, string $schemaType = 'keyword'): void
    {
        try {
            $this->client->put("/collections/{$this->collectionName}/index", [
                'json' => [
                    'field_name' => $fieldName,
                    'field_schema' => $schemaType,
                ],
            ]);
        } catch (GuzzleException $e) {
            Log::warning("Failed to create index for $fieldName: " . $e->getMessage());
        }
    }

    /**
     * Upsert points (vectors + payload) into Qdrant.
     *
     * @param array<array{id: string, vector: array, payload: array}> $points
     */
    public function upsertPoints(array $points): void
    {
        $this->client->put("/collections/{$this->collectionName}/points", [
            'json' => [
                'points' => $points,
            ],
        ]);
    }

    /**
     * Search for similar vectors.
     *
     * @param array<float> $vector
     * @param array $filters (e.g. ['userId' => 1])
    */
    public function search(array $vector, array $filters = [], int $limit = 5): array
    {
        $filterPayload = [];
        
        if (!empty($filters)) {
            $must = [];
            foreach ($filters as $key => $value) {
                $must[] = [
                    'key' => $key,
                    'match' => ['value' => $value],
                ];
            }
            $filterPayload = ['must' => $must];
        }

        $body = [
            'vector' => $vector,
            'limit' => $limit,
            'with_payload' => true,
        ];

        if (!empty($filterPayload)) {
            $body['filter'] = $filterPayload;
        }

        $response = $this->client->post("/collections/{$this->collectionName}/points/search", [
            'json' => $body,
        ]);

        $result = json_decode($response->getBody()->getContents(), true);
        
        return $result['result'] ?? [];
    }

    /**
     * Delete points by ID.
     */
    public function deletePoints(array $pointIds): void
    {
        if (empty($pointIds)) {
            return;
        }

        $this->client->post("/collections/{$this->collectionName}/points/delete", [
            'json' => [
                'points' => $pointIds,
            ],
        ]);
    }
}
