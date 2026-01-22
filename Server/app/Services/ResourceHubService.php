<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\FetchResourceMetadata;
use App\Jobs\GenerateResourceTitle;
use App\Jobs\GenerateResourceMetadata;
use App\Jobs\ProcessResourceEmbedding;
use App\Models\KnowledgeResource;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\Builder;
use App\Traits\CachesData;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ResourceHubService
{
    use CachesData;

    public function __construct(
        private UrlMetadataService $urlMetadata,
        private VideoMetadataService $videoMetadata,
        private RAGService $ragService,
        private AIService $aiService
    ) {}

    public function createFromUrl(string $url, int $userId, array $overrides = []): KnowledgeResource
    {
        // Create Resource immediately with minimal data
        $domain = parse_url($url, PHP_URL_HOST);
        $domain = $domain ? str_replace('www.', '', $domain) : null;
        
        $title = $overrides['title'] ?? $url;
        $shouldGenerateTitle = empty($overrides['title']) || $overrides['title'] === $url;

        // Basic type detection from extension/URL
        $type = 'website'; 
        if (defined('RESOURCE_TYPE_ARTICLE')) {
            $type = RESOURCE_TYPE_ARTICLE;
        }
        
        if (str_contains($url, 'youtube.com') || str_contains($url, 'youtu.be')) {
             if (defined('RESOURCE_TYPE_VIDEO')) {
                $type = RESOURCE_TYPE_VIDEO;
             } else {
                $type = 'video';
             }
        }

        $resource = KnowledgeResource::create(array_merge([
            'url' => $url,
            'title' => $title,
            'user_id' => $userId,
            'source_domain' => $domain,
            'type' => $type,
            'is_read' => false,
            'is_archived' => false,
        ], $overrides));

        // Chain Jobs
        $jobs = [
            new FetchResourceMetadata($resource),
        ];

        if ($shouldGenerateTitle) {
            $jobs[] = new GenerateResourceTitle($resource);
        }

        // Generate AI metadata (tags, difficulty, summary)
        $jobs[] = new GenerateResourceMetadata($resource);
        
        $jobs[] = new ProcessResourceEmbedding($resource);

        \Illuminate\Support\Facades\Bus::chain($jobs)->dispatch();

        $resource->refresh();

        return $resource;
    }

    public function createFromFile(UploadedFile $file, int $userId, array $overrides = []): KnowledgeResource
    {
        $path = $file->store('resources', 'public');
        $extension = strtolower($file->getClientOriginalExtension());
        
        $type = match($extension) {
            'pdf', 'doc', 'docx', 'txt', 'md' => RESOURCE_TYPE_DOCUMENT,
            'png', 'jpg', 'jpeg', 'gif', 'webp' => RESOURCE_TYPE_IMAGE,
            default => RESOURCE_TYPE_DOCUMENT
        };

        // Estimate time for documents (very rough: 1 min per 100KB)
        $sizeKb = $file->getSize() / 1024;
        $time = $type === RESOURCE_TYPE_DOCUMENT ? max(1, (int) ceil($sizeKb / 100)) : null;

        return $this->createResource(array_merge([
            'file_path' => $path,
            'title' => $file->getClientOriginalName(),
            'type' => $type,
            'estimated_time_minutes' => $time,
        ], $overrides), $userId);
    }

    private function createResource(array $data, int $userId, bool $shouldGenerateTitle = false): KnowledgeResource
    {
        $resource = KnowledgeResource::create(array_merge($data, [
            'user_id' => $userId,
            'is_read' => false,
            'is_archived' => false,
        ]));

        if ($shouldGenerateTitle) {
            GenerateResourceTitle::dispatch($resource);
        }

        // Generate Metadata (Tags, Difficulty, Summary)
        GenerateResourceMetadata::dispatch($resource);

        // Index for RAG
        if ($resource->summary || $resource->file_path) {
            ProcessResourceEmbedding::dispatch($resource);
        }
        
        $this->clearUserResourceCache($userId);

        return $resource;
    }

    public function updateResource(KnowledgeResource $resource, array $data): KnowledgeResource
    {
        $resource->update($data);
        $this->clearUserResourceCache($resource->user_id);
        return $resource;
    }

    public function deleteResource(KnowledgeResource $resource): void
    {
        if ($resource->file_path) {
            Storage::disk('public')->delete($resource->file_path);
        }
        $this->ragService->deleteResource($resource);
        $this->clearUserResourceCache($resource->user_id);
    }

    public function toggleFavorite(KnowledgeResource $resource): KnowledgeResource
    {
        $resource->update(['is_favorite' => !$resource->is_favorite]);
        $this->clearUserResourceCache($resource->user_id);
        return $resource;
    }

    public function markAsRead(KnowledgeResource $resource, bool $isRead = true): KnowledgeResource
    {
        $resource->update(['is_read' => $isRead]);
        $this->clearUserResourceCache($resource->user_id);
        return $resource;
    }

    public function bulkImport(array $urls, int $userId): array
    {
        $created = [];
        foreach ($urls as $url) {
            try {
                $created[] = $this->createFromUrl($url, $userId);
            } catch (Exception $e) {
                continue;
            }
        }
        return $created;
    }

    public function getSuggestions(int $userId, ?int $focusSessionId = null): array
    {
        // Placeholder for AI suggestions logic
        return [];
    }
    public function getResources(int $userId, array $filters = []): LengthAwarePaginator
    {
        // Use tags for invalidation, or unique key based on filters
        $key = "resources:list:{$userId}:" . md5(json_encode($filters));

        return Cache::tags(["resources:{$userId}"])->remember($key, now()->addMinutes(10), function () use ($userId, $filters) {
            $query = KnowledgeResource::query()
                ->where('user_id', $userId)
                ->orderBy('is_favorite', 'desc')
                ->orderBy('created_at', 'desc');

            if (!empty($filters['search'])) {
                $term = $filters['search'];
                $query->where(function (Builder $q) use ($term) {
                    $q->where('title', 'like', "%{$term}%")
                    ->orWhere('tags', 'like', "%{$term}%")
                    ->orWhere('notes', 'like', "%{$term}%");
                });
            }

            if (!empty($filters['type']) && $filters['type'] !== 'all') {
                if (is_array($filters['type'])) {
                    $query->whereIn('type', $filters['type']);
                } else {
                    $query->where('type', $filters['type']);
                }
            }

            if (!empty($filters['difficulty']) && $filters['difficulty'] !== 'all') {
                if (is_array($filters['difficulty'])) {
                    $query->whereIn('difficulty', $filters['difficulty']);
                } else {
                    $query->where('difficulty', $filters['difficulty']);
                }
            }

            if (!empty($filters['status'])) {
                match ($filters['status']) {
                    'unread' => $query->where('is_read', false),
                    'read' => $query->where('is_read', true),
                    'favorites' => $query->where('is_favorite', true),
                    default => null,
                };
            }

            return $query->paginate(20);
        });
    }
}
