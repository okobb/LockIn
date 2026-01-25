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
        private PromptService $prompts,
        private ToolService $toolService
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
    public function search(int $userId, string $query, ?int $contextId = null, int $limit = 5): array
    {
        $queryVector = $this->embedder->embed($query);
        $minScore = config('rag.min_relevance_score', 0.5);

        $fetchLimit = min($limit * 2, config('rag.max_context_chunks', 10));

        $filters = ['user_id' => $userId];
        if ($contextId) {
            $filters['context_id'] = $contextId;
        }

        $results = $this->qdrant->search($queryVector, $filters, $fetchLimit);
        
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
     * Chat with the assistant using RAG context and Tools.
     *
     * @param int $userId
     * @param string $question
     * @param int|null $activeContextId
     * @param array $history
     * @return array
     */
    public function chat(int $userId, string $question, ?int $activeContextId = null, array $history = []): array
    {
        // Security Check
        $processed = $this->prompts->process($question);
        if ($processed['blocked']) {
            return [
                'type' => 'error',
                'content' => "I'm sorry, but I can't process that request.",
                'sources' => [],
            ];
        }
        $sanitizedQuestion = $processed['sanitized'];

        // Retrieve RAG Context
        $maxChunks = config('rag.max_chunks', 5);
        $chunks = $this->search($userId, $sanitizedQuestion, $activeContextId, limit: $maxChunks);
        $contextString = collect($chunks)->pluck('content')->implode("\n---\n");

        // Build System Prompt with Context
        $systemContext = [
            'context' => $contextString ?: "No specific knowledge base context found.",
            'user_id' => $userId,
            'current_date' => now()->toDayDateTimeString(),
            'active_context_id' => (string) ($activeContextId ?? 'none'),
            'history' => $history,
        ];

        // Define Tools
        $tools = $this->toolService->getTaskTools();

        // Call AI Service
        $messages = $this->prompts->build('chat_with_tools', array_merge($systemContext, ['question' => $sanitizedQuestion]));
        $response = $this->aiService->chatWithTools($messages, $tools);

        // Format Response
        if (!empty($response['tool_calls'])) {
            $toolCall = $response['tool_calls'][0];
            $function = $toolCall['function'];
            $args = json_decode($function['arguments'], true);
            $name = $function['name'];

            // Generate friendly display text
            $displayMap = [
                'create_task' => ['summary' => "Create task: " . ($args['title'] ?? 'New Task'), 'confirm_text' => 'Create Task'],
                'update_task' => ['summary' => "Update task " . ($args['task_id'] ?? ''), 'confirm_text' => 'Update Task'],
                'complete_task' => ['summary' => "Complete task " . ($args['task_id'] ?? ''), 'confirm_text' => 'Complete Task'],
            ];

            return [
                'type' => 'tool_call',
                'content' => $response['content'] ?? "I can help with that.",
                'sources' => $chunks,
                'tool_call' => [
                    'name' => $name,
                    'args' => $args,
                    'display' => $displayMap[$name] ?? ['summary' => 'Execute Action', 'confirm_text' => 'Confirm'],
                ]
            ];
        }

        return [
            'type' => 'message',
            'content' => $response['content'] ?? "I'm not sure.",
            'sources' => $chunks,
        ];
    }
}
