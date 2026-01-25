<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\AskKnowledgeRequest;
use App\Http\Requests\StoreKnowledgeRequest;
use App\Models\KnowledgeResource;
use App\Services\RAGService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KnowledgeController extends BaseController
{
    public function __construct(
        private RAGService $ragService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = KnowledgeResource::query()->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'ilike', "%{$searchTerm}%")
                  ->orWhere('summary', 'ilike', "%{$searchTerm}%");
            });
        }

        return $this->successResponse($query->paginate(20));
    }

    public function store(StoreKnowledgeRequest $request): JsonResponse
    {
        $resource = $this->ragService->createResource(
            data: $request->validated(),
            userId: (int) Auth::id()
        );

        return $this->createdResponse($resource);
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q');
        if (empty($query)) {
            return $this->successResponse([]);
        }

        $results = $this->ragService->search(
            userId: (int) Auth::id(), 
            query: $query, 
            limit: 10
        );

        return $this->successResponse($results);
    }

    public function destroy(KnowledgeResource $knowledge): JsonResponse
    {
        if ($knowledge->user_id !== Auth::id()) {
            return $this->forbiddenResponse();
        }

        $this->ragService->deleteResource($knowledge);

        return $this->noContentResponse();
    }

    public function ask(AskKnowledgeRequest $request): JsonResponse
    {
        $result = $this->ragService->chat(
            userId: (int) Auth::id(),
            question: $request->input('question')
        );

        if (isset($result['type']) && $result['type'] === 'error') {
             return $this->successResponse([
                'answer' => $result['content'],
                'sources' => [],
                'blocked' => true
             ]);
        }

        return $this->successResponse([
            'answer' => $result['content'],
            'sources' => $result['sources'] ?? []
        ]);
    }
}
