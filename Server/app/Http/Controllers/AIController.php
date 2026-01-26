<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ChatRequest;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AIController extends BaseController
{
    public function __construct(
        private ChatService $chatService
    ) {}

    /**
     * Handle the global chat request.
     *
     * @param ChatRequest $request
     * @return JsonResponse
     */
    public function chat(ChatRequest $request): JsonResponse
    {
        $response = $this->chatService->processMessage(
            userId: (int) Auth::id(),
            messageContent: $request->validated('message'),
            activeContextId: $request->validated('active_context_id') ? (int) $request->validated('active_context_id') : null
        );

        return $this->successResponse($response);
    }
    
    /**
     * Get the chat history for a specific thread.
     *
     * @param int $threadId
     * @return JsonResponse
     */
    public function getHistory(int $threadId): JsonResponse
    {
        $data = $this->chatService->getThreadHistory($threadId, (int) Auth::id());

        return $this->successResponse($data);
    }
    /**
     * Get or create a thread based on context ID.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getThread(Request $request): JsonResponse
    {
        $userId = (int) Auth::id();
        $contextId = $request->input('context_id');
        $contextId = $contextId ? (int) $contextId : null;

        $data = $this->chatService->getThreadByContext($userId, $contextId);

        return $this->successResponse($data);
    }
}
