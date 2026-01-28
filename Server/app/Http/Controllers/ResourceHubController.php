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

class ResourceHubController extends Controller
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

        return response()->json($resources);
    }

    public function store(StoreResourceRequest $request): JsonResponse
    {
        $userId = (int) Auth::id();
        $validated = $request->validated();

        if ($request->hasFile('file')) {
            $resource = $this->service->createFromFile(
                $request->file('file'),
                $userId,
                $validated
            );
        } else {
            $existing = $this->service->findRecentResourceByUrl($userId, $request->input('url'));

            if ($existing) {
                return response()->json($existing, 200);
            }

            $resource = $this->service->createFromUrl(
                $request->input('url'),
                $userId,
                $validated
            );
        }

        return response()->json($resource, 201);
    }

    public function show(KnowledgeResource $resource): JsonResponse
    {
        $this->authorizeResource($resource);
        return response()->json($resource);
    }

    public function update(UpdateResourceRequest $request, KnowledgeResource $resource): JsonResponse
    {
        $this->authorizeResource($resource);
        $updated = $this->service->updateResource($resource, $request->validated());
        return response()->json($updated);
    }

    public function destroy(KnowledgeResource $resource): JsonResponse
    {
        $this->authorizeResource($resource);
        $this->service->deleteResource($resource);
        return response()->json(null, 204);
    }

    public function toggleFavorite(KnowledgeResource $resource): JsonResponse
    {
        $this->authorizeResource($resource);
        $updated = $this->service->toggleFavorite($resource);
        return response()->json($updated);
    }

    public function markAsRead(KnowledgeResource $resource, Request $request): JsonResponse
    {
        $this->authorizeResource($resource);
        $updated = $this->service->markAsRead($resource, $request->boolean('is_read', true));
        return response()->json($updated);
    }

    public function bulkImport(BulkImportRequest $request): JsonResponse
    {
        $created = $this->service->bulkImport(
            $request->input('urls'),
            (int) Auth::id()
        );

        return response()->json(['data' => $created], 201);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $sessionId = $request->input('focus_session_id');

        $suggestions = $this->service->getSuggestions(
            (int) Auth::id(),
            $sessionId ? (int) $sessionId : null
        );

        return response()->json($suggestions);
    }

    private function authorizeResource(KnowledgeResource $resource): void
    {
        if ($resource->user_id !== Auth::id()) {
            abort(403);
        }
    }

    public function getDownloadUrl(KnowledgeResource $resource): JsonResponse
    {
        $this->authorizeResource($resource);
        
        if (!$resource->file_path) {
            abort(404, 'No file associated with this resource');
        }

        // URL valid for 30 minutes
        $url = URL::temporarySignedRoute(
            'resources.download',
            now()->addMinutes(30),
            ['resource' => $resource->id]
        );
        
        return response()->json(['url' => $url]);
    }

    public function download(KnowledgeResource $resource): mixed
    {
        // If the request is not signed, we enforce standard auth
        if (!request()->hasValidSignature()) {
            $this->authorizeResource($resource);
        }
        
        if (!$resource->file_path || !Storage::disk('public')->exists($resource->file_path)) {
            abort(404, 'File not found');
        }
        
        return response()->file(Storage::disk('public')->path($resource->file_path));
    }
}
