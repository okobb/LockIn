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

class KnowledgeController extends Controller
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

        return response()->json($query->paginate(20));
    }

    public function store(StoreKnowledgeRequest $request): JsonResponse
    {
        $resource = $this->ragService->createResource(
            data: $request->validated(),
            userId: (int) Auth::id()
        );

        return response()->json($resource, 201);
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q');
        if (empty($query)) {
            return response()->json([]);
        }

        $results = $this->ragService->search(
            userId: (int) Auth::id(), 
            query: $query, 
            limit: 10
        );

        return response()->json($results);
    }

    public function destroy(KnowledgeResource $knowledge): JsonResponse
    {
        if ($knowledge->user_id !== Auth::id()) {
            abort(403);
        }

        $this->ragService->deleteResource($knowledge);

        return response()->json(null, 204);
    }

    public function ask(AskKnowledgeRequest $request): JsonResponse
    {
        $result = $this->ragService->ask(
            userId: (int) Auth::id(),
            question: $request->input('question')
        );

        return response()->json($result);
    }
}
