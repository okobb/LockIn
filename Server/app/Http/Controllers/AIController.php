<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ChatRequest;
use App\Services\RAGService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AIController extends BaseController
{
    public function __construct(
        private RAGService $ragService
    ) {}

    /**
     * Handle the global chat request.
     *
     * @param ChatRequest $request
     * @return JsonResponse
     */
    public function chat(ChatRequest $request): JsonResponse
    {
        $response = $this->ragService->chat(
            userId: (int) Auth::id(),
            question: $request->validated('message'),
            activeContextId: $request->validated('active_context_id')
        );

        return $this->successResponse($response);
    }
}
