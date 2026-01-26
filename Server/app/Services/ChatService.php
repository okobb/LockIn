<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ChatThread;
use App\Models\ChatMessage;
use Illuminate\Database\Eloquent\Collection;

class ChatService
{
    public function __construct(
        private RAGService $ragService
    ) {}

    /**
     * Process a user message: persist, retrieve history, call RAG, persist response.
     */
    public function processMessage(int $userId, string $messageContent, ?int $activeContextId = null): array
    {
        $thread = ChatThread::firstOrCreate(
            [
                'user_id' => $userId,
                'context_id' => $activeContextId,
            ],
            [
                'title' => $activeContextId ? 'Context Thread' : 'Global Thread',
                'metadata' => ['last_active' => now()],
            ]
        );

        $thread->update(['metadata' => array_merge($thread->metadata ?? [], ['last_active' => now()])]);

        $userMessage = $thread->messages()->create([
            'role' => 'user',
            'content' => $messageContent,
        ]);
        $history = $thread->messages()
            ->where('id', '<', $userMessage->id)
            ->latest()
            ->take(20)
            ->get()
            ->reverse()
            ->map(fn($msg) => [
                'role' => $msg->role === 'tool' ? 'tool' : ($msg->role === 'user' ? 'user' : 'assistant'),
                'content' => $msg->content,
            ])
            ->values()
            ->all();

        $response = $this->ragService->chat(
            userId: $userId,
            question: $messageContent,
            activeContextId: $activeContextId,
            history: $history
        );

        $assistantMessage = $thread->messages()->create([
            'role' => 'assistant',
            'content' => $response['content'] ?? '',
            'tool_calls' => isset($response['tool_call']) ? [$response['tool_call']] : null,
            'sources' => $response['sources'] ?? null,
        ]);

        return [
            'thread_id' => $thread->id,
            'message_id' => $assistantMessage->id,
            'type' => $response['type'],
            'content' => $response['content'],
            'sources' => $response['sources'] ?? [],
            'tool_call' => $response['tool_call'] ?? null,
        ];
    }

    /**
     * Get chat history for a thread.
     */
    public function getThreadHistory(int $threadId, int $userId): array
    {
        $thread = ChatThread::where('id', $threadId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $messages = $thread->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        return [
            'thread' => $thread,
            'messages' => $messages,
        ];
    }
    /**
     * Get or create a thread for a specific context.
     */
    public function getThreadByContext(int $userId, ?int $contextId): array
    {
        $thread = ChatThread::firstOrCreate(
            [
                'user_id' => $userId,
                'context_id' => $contextId,
            ],
            [
                'title' => $contextId ? 'Context Thread' : 'Global Thread',
                'metadata' => ['last_active' => now()],
            ]
        );

        return $this->getThreadHistory($thread->id, $userId);
    }
}
