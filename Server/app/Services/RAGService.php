<?php

declare(strict_types=1);

namespace App\Services;

use App\AI\PromptService;
use App\Models\KnowledgeChunk;
use App\Models\KnowledgeResource;
use App\Models\Task;
use Exception;
use Illuminate\Support\Facades\Log;
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
        $vectorResults = $this->performVectorSearch($queryVector, $userId, $contextId, $limit);
        $rankedResults = $this->rankAndFilterResults($vectorResults, $limit);
        
        return $this->fetchAndFormatResults($rankedResults, $limit);
    }

    private function performVectorSearch(array $queryVector, int $userId, ?int $contextId, int $limit): array
    {
        $fetchLimit = min($limit * 2, config('rag.max_context_chunks', 10));
        $filters = ['user_id' => $userId];
        
        if ($contextId) {
            $filters['context_id'] = $contextId;
        }

        return $this->qdrant->search($queryVector, $filters, $fetchLimit);
    }

    private function rankAndFilterResults(array $results, int $limit): array
    {
        $minScore = config('rag.min_relevance_score', 0.3);
        
        return collect($results)
            ->filter(fn($item) => ($item['score'] ?? 0) >= $minScore)
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->all();
    }

    private function fetchAndFormatResults(array $rankedResults, int $limit): array
    {
        $resourceIds = array_column(array_column($rankedResults, 'payload'), 'resource_id');
        [$chunks, $resources] = $this->fetchChunksAndResources($resourceIds);
        $dedupedResults = $this->deduplicateByResource($rankedResults, $limit);
        
        return $this->formatSearchResults($dedupedResults, $chunks, $resources);
    }

    private function fetchChunksAndResources(array $resourceIds): array
    {
        $chunks = KnowledgeChunk::query()
            ->whereIn('resource_id', $resourceIds)
            ->get()
            ->keyBy(fn($c) => $c->resource_id . '-' . $c->chunk_index);

        $resources = KnowledgeResource::query()
            ->whereIn('id', $resourceIds)
            ->get()
            ->keyBy('id');

        return [$chunks, $resources];
    }

    private function deduplicateByResource(array $results, int $limit): array
    {
        $seenResources = [];
        $dedupedResults = [];
        
        foreach ($results as $item) {
            $resourceId = $item['payload']['resource_id'];
            if (!isset($seenResources[$resourceId])) {
                $seenResources[$resourceId] = true;
                $dedupedResults[] = $item;
            }
        }
        
        return array_slice($dedupedResults, 0, $limit);
    }

    private function formatSearchResults(array $results, $chunks, $resources): array
    {
        return array_map(function ($item) use ($chunks, $resources) {
            $key = $item['payload']['resource_id'] . '-' . $item['payload']['chunk_index'];
            $resourceId = $item['payload']['resource_id'];
            $fullContent = $chunks[$key]->content_chunk ?? $item['payload']['content_preview'];
            $resource = $resources[$resourceId] ?? null;
            
            return [
                'score' => $item['score'],
                'content' => $fullContent,
                'resource_id' => $resourceId,
                'url' => $resource?->url,
                'title' => $resource?->title ?? 'Source',
            ];
        }, $results);
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
     */
    public function chat(int $userId, string $question, ?int $activeContextId = null, array $history = []): array
    {
        $sanitizedQuestion = $this->validateAndSanitizeQuestion($question);
        if (is_array($sanitizedQuestion)) {
            return $sanitizedQuestion; 
        }

        $chunks = $this->retrieveContext($userId, $sanitizedQuestion, $activeContextId);
        $response = $this->callAIService($userId, $sanitizedQuestion, $chunks, $activeContextId, $history);
        
        if (is_array($response) && isset($response['type']) && $response['type'] === 'error') {
            return $response;
        }

        return $this->handleToolExecution($response, $userId, $chunks);
    }

    private function validateAndSanitizeQuestion(string $question)
    {
        $processed = $this->prompts->process($question);
        
        if ($processed['blocked']) {
            return [
                'type' => 'error',
                'content' => "I'm sorry, but I can't process that request.",
                'sources' => [],
            ];
        }
        
        return $processed['sanitized'];
    }

    private function retrieveContext(int $userId, string $question, ?int $activeContextId): array
    {
        $maxChunks = config('rag.max_chunks', 5);
        return $this->search($userId, $question, $activeContextId, limit: $maxChunks);
    }

    private function buildContextString(array $chunks): string
    {
        return collect($chunks)
            ->map(fn($chunk) => "Source: {$chunk['title']}\nContent: {$chunk['content']}")
            ->implode("\n---\n");
    }

    private function callAIService(int $userId, string $question, array $chunks, ?int $activeContextId, array $history)
    {
        $contextString = $this->buildContextString($chunks);
        
        $systemContext = [
            'context' => $contextString ?: "No specific knowledge base context found.",
            'user_id' => $userId,
            'current_date' => now()->toDayDateTimeString(),
            'active_context_id' => (string) ($activeContextId ?? 'none'),
            'history' => $history,
        ];

        $tools = $this->toolService->getTaskTools();

        try {
            $messages = $this->prompts->build('chat_with_tools', array_merge($systemContext, ['question' => $question]));
            return $this->aiService->chatWithTools($messages, $tools);
        } catch (Exception $e) {
            Log::error("AI Service Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            
            return [
                'type' => 'error',
                'content' => "I encountered an error while processing your request. Please try again later.",
                'sources' => [],
            ];
        }
    }

    /**
     * Handle the tool calls returned by the AI.
     */
    private function handleToolExecution(array $aiResponse, int $userId, array $contextChunks): array
    {
        if (empty($aiResponse['tool_calls'])) {
            return [
                'type' => 'message',
                'content' => $aiResponse['content'] ?? "I'm not sure.",
                'sources' => $contextChunks,
            ];
        }

        [$name, $args] = $this->parseToolCall($aiResponse['tool_calls'][0]);
        
        return $this->routeToolExecution($name, $args, $userId, $aiResponse, $contextChunks);
    }

    private function parseToolCall(array $toolCall): array
    {
        $function = $toolCall['function'];
        $name = $function['name'];
        $args = json_decode($function['arguments'], true);
        
        return [$name, $args];
    }

    private function routeToolExecution(string $name, array $args, int $userId, array $aiResponse, array $contextChunks): array
    {
        // Execute immediate tools
        if ($name === 'list_resources') {
            return $this->handleListResources($userId, $args);
        }

        if ($name === 'list_tasks') {
            return $this->handleListTasks($userId, $args);
        }

        // Return confirmation-required tools to client
        return $this->buildToolCallResponse($name, $args, $aiResponse, $contextChunks);
    }

    private function buildToolCallResponse(string $name, array $args, array $aiResponse, array $contextChunks): array
    {
        $displayMap = [
            'create_task' => ['summary' => "Create task: " . ($args['title'] ?? 'New Task'), 'confirm_text' => 'Create Task'],
            'update_task' => ['summary' => "Update task " . ($args['task_id'] ?? ''), 'confirm_text' => 'Update Task'],
            'complete_task' => ['summary' => "Complete task " . ($args['task_id'] ?? ''), 'confirm_text' => 'Complete Task'],
            'delete_resource' => ['summary' => "Delete resource " . ($args['resource_id'] ?? ''), 'confirm_text' => 'Delete Resource'],
        ];

        return [
            'type' => 'tool_call',
            'content' => $aiResponse['content'] ?? "I can help with that.",
            'sources' => $contextChunks,
            'tool_call' => [
                'name' => $name,
                'args' => $args,
                'display' => $displayMap[$name] ?? ['summary' => 'Execute Action', 'confirm_text' => 'Confirm'],
            ]
        ];
    }

    private function handleListResources(int $userId, array $args): array
    {
        $limit = $args['limit'] ?? 10;
        $resources = $this->queryResources($userId, $limit);
        
        if ($resources->isEmpty()) {
            return $this->buildEmptyResourcesResponse();
        }

        return $this->buildResourceListResponse($resources);
    }

    private function handleListTasks(int $userId, array $args): array
    {
        $limit = $args['limit'] ?? 10;
        $status = $args['status'] ?? null;
        $tasks = $this->queryTasks($userId, $limit, $status);
        
        if ($tasks->isEmpty()) {
            return $this->buildEmptyTasksResponse();
        }

        return $this->buildTaskListResponse($tasks);
    }

    private function queryResources(int $userId, int $limit)
    {
        return KnowledgeResource::query()
            ->where('user_id', $userId)
            ->latest()
            ->take($limit)
            ->get(['id', 'title', 'url', 'created_at']);
    }

    private function queryTasks(int $userId, int $limit, ?string $status)
    {
        $query = Task::query()->where('user_id', $userId);
        
        if ($status) {
            $query->where('status', $status);
        }
        
        return $query->latest()->take($limit)->get(['id', 'title', 'status', 'priority']);
    }

    private function buildEmptyResourcesResponse(): array
    {
        return [
            'type' => 'message',
            'content' => "You don't have any resources saved in your knowledge base yet. You can add resources like articles, PDFs, or notes to build your personal knowledge base.",
            'sources' => [],
        ];
    }

    private function buildEmptyTasksResponse(): array
    {
        return [
            'type' => 'message',
            'content' => "You don't have any tasks saved yet. You can ask me to 'create a task' for you.",
            'sources' => [],
        ];
    }

    private function buildResourceListResponse($resources): array
    {
        $resourceList = $resources->map(fn($r, $i) => ($i + 1) . ". {$r->title}")->implode("\n");
        
        return [
            'type' => 'message',
            'content' => "You have {$resources->count()} saved resources:\n\n{$resourceList}",
            'sources' => [],
        ];
    }

    private function buildTaskListResponse($tasks): array
    {
        $taskList = $tasks->map(fn($t, $i) => ($i + 1) . ". **[{$t->status}]** {$t->title} (ID: {$t->id})")->implode("\n");
        
        return [
            'type' => 'message',
            'content' => "Here are your tasks:\n\n{$taskList}",
            'sources' => [],
        ];
    }
}
