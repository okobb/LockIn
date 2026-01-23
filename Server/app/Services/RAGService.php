<?php

declare(strict_types=1);

namespace App\Services;

use App\AI\PromptService;
use App\Models\KnowledgeChunk;
use App\Models\KnowledgeResource;
use Illuminate\Support\Str;

class RAGService
{
    public function __construct(
        private ChunkingService $chunker,
        private EmbeddingService $embedder,
        private QdrantService $qdrant,
        private AIService $aiService,
        private PromptService $prompts
    ) {}

    public function createResource(array $data, int $userId): KnowledgeResource
    {
        $resource = KnowledgeResource::create([
            'user_id' => $userId,
            'url' => $data['url'],
            'title' => $data['title'] ?? null,
            'content_text' => $data['content'] ?? null,
            'metadata' => ['topics' => $data['tags'] ?? []],
        ]);

        if (!empty($resource->content_text)) {
            $this->indexResource($resource);
        }

        return $resource;
    }

    /**
     * Process a resource: Chunk it, Embed it, Store in Qdrant.
     */
    public function indexResource(KnowledgeResource $resource): void
    {
        $chunksData = $this->chunker->chunkContent($resource->content_text ?? '');
        
        if (empty($chunksData)) {
            return;
        }

        $textsToEmbed = array_column($chunksData, 'content');
        $embeddings = $this->embedder->embedBatch($textsToEmbed);

        $points = [];
        $dbChunks = [];

        foreach ($chunksData as $index => $data) {
            $vector = $embeddings[$index] ?? null;
            if (!$vector) continue;

            $pointId = (string) Str::uuid();

            $points[] = [
                'id' => $pointId,
                'vector' => $vector,
                'payload' => [
                    'resource_id' => $resource->id,
                    'user_id' => $resource->user_id,
                    'chunk_index' => $index,
                    'chunk_type' => $data['type'] ?? 'text',
                    'content_preview' => substr($data['content'], 0, 200),
                ],
            ];

            $dbChunks[] = [
                'resource_id' => $resource->id,
                'chunk_index' => $index,
                'content_chunk' => $data['content'],
                'qdrant_point_id' => $pointId,
                'chunk_type' => $data['type'] ?? 'text',
                'token_count' => $data['token_count'],
                'chunk_metadata' => json_encode($data['metadata'] ?? []),
                'is_embedded' => 't',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $this->qdrant->ensureCollectionExists();
        $this->qdrant->upsertPoints($points);

        $resource->chunks()->delete();
        KnowledgeChunk::insert($dbChunks);
    }

    /**
     * Semantic search for a user with re-ranking.
     */
    public function search(int $userId, string $query, int $limit = 5): array
    {
        $queryVector = $this->embedder->embed($query);
        $minScore = config('rag.min_relevance_score', 0.5);

        $fetchLimit = min($limit * 2, config('rag.max_context_chunks', 10));
        $results = $this->qdrant->search($queryVector, ['user_id' => $userId], $fetchLimit);
        
        $rankedResults = collect($results)
            ->filter(fn($item) => ($item['score'] ?? 0) >= $minScore)
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->all();

        return array_map(function ($item) {
            return [
                'score' => $item['score'],
                'content' => $item['payload']['content_preview'] . '...',
                'resource_id' => $item['payload']['resource_id'],
            ];
        }, $rankedResults);
    }

    public function deleteResource(KnowledgeResource $resource): void
    {
        $pointIds = $resource->chunks()->pluck('qdrant_point_id')->filter()->toArray();
        if (!empty($pointIds)) {
            $this->qdrant->deletePoints($pointIds);
        }
        $resource->delete();
    }

    /**
     * Ask a question using the RAG pipeline with security checks.
     *
     * @return array{answer: string, sources: array, blocked?: bool}
     */
    public function ask(int $userId, string $question): array
    {
        // Security: Process through PromptService
        $processed = $this->prompts->process($question);
        
        if ($processed['blocked']) {
            return [
                'answer' => "I'm sorry, but I can't process that request. Please rephrase your question.",
                'sources' => [],
                'blocked' => true,
            ];
        }

        $sanitizedQuestion = $processed['sanitized'];

        // Retrieve relevant chunks
        $maxChunks = config('rag.max_chunks', 5);
        $chunks = $this->search($userId, $sanitizedQuestion, limit: $maxChunks);
        
        $contextString = collect($chunks)->pluck('content')->implode("\n---\n");

        if (empty($contextString)) {
            return [
                'answer' => "I couldn't find any relevant information in your knowledge base to answer that.",
                'sources' => [],
            ];
        }

        $messages = $this->prompts->build('rag_qa', [
            'context' => $contextString,
            'question' => $sanitizedQuestion,
        ]);
        $answer = $this->aiService->chat($messages);

        return [
            'answer' => $answer,
            'sources' => $chunks,
        ];
    }
}
