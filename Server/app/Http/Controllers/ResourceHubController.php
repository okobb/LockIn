<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Resource\BulkImportRequest;
use App\Http\Requests\Resource\StoreResourceRequest;
use App\Http\Requests\Resource\UpdateResourceRequest;
use App\Models\KnowledgeResource;
use App\Services\ResourceHubService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Storage;

class ResourceHubController extends BaseController
{
    public function __construct(
        private ResourceHubService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $resources = $this->service->getResources(
            (int) Auth::id(),
            $request->only(['search', 'type', 'difficulty', 'status'])
        );

        return $this->successResponse($resources);
    }

    public function store(StoreResourceRequest $request): JsonResponse
    {
        $userId = (int) Auth::id();
        $validated = $request->validated();

        $result = $this->service->createOrFindResource(
            $userId,
            $validated,
            $request->file('file')
        );

        if ($result['code'] === 201) {
            return $this->createdResponse($result['resource']);
        }

        return $this->successResponse($result['resource']);
    }

    public function show(KnowledgeResource $resource): JsonResponse
    {
        $this->checkOwnership($resource);
        return $this->successResponse($resource);
    }

    public function update(UpdateResourceRequest $request, KnowledgeResource $resource): JsonResponse
    {
        $this->checkOwnership($resource);
        $updated = $this->service->updateResource($resource, $request->validated());
        return $this->successResponse($updated);
    }

    public function destroy(KnowledgeResource $resource): JsonResponse
    {
        $this->checkOwnership($resource);
        $this->service->deleteResource($resource);
        return $this->noContentResponse();
    }

    public function toggleFavorite(KnowledgeResource $resource): JsonResponse
    {
        $this->checkOwnership($resource);
        $updated = $this->service->toggleFavorite($resource);
        return $this->successResponse($updated);
    }

    public function markAsRead(KnowledgeResource $resource, Request $request): JsonResponse
    {
        $this->checkOwnership($resource);
        $updated = $this->service->markAsRead($resource, $request->boolean('is_read', true));
        return $this->successResponse($updated);
    }

    public function bulkImport(BulkImportRequest $request): JsonResponse
    {
        $created = $this->service->bulkImport(
            $request->input('urls'),
            (int) Auth::id()
        );

        return $this->createdResponse(['data' => $created]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $sessionId = $request->input('focus_session_id');

        $suggestions = $this->service->getSuggestions(
            (int) Auth::id(),
            $sessionId ? (int) $sessionId : null
        );

        return $this->successResponse($suggestions);
    }

    private function checkOwnership(KnowledgeResource $resource): void
    {
        if ($resource->user_id !== Auth::id()) {
            abort(403);
        }
    }

    public function getDownloadUrl(KnowledgeResource $resource): JsonResponse
    {
        $this->checkOwnership($resource);
        
        if (!$resource->file_path) {
            abort(404, 'No file associated with this resource');
        }

        // URL valid for 30 minutes
        $url = URL::temporarySignedRoute(
            'resources.download',
            now()->addMinutes(30),
            ['resource' => $resource->id]
        );
        
        return $this->successResponse(['url' => $url]);
    }

    public function download(KnowledgeResource $resource): mixed
    {
        // If the request is not signed, we enforce standard auth
        if (!request()->hasValidSignature()) {
            $this->checkOwnership($resource);
        }
        
        if (!$resource->file_path || !Storage::disk('public')->exists($resource->file_path)) {
            abort(404, 'File not found');
        }
        
        return response()->file(Storage::disk('public')->path($resource->file_path));
    }
}
