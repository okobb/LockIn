<?php

namespace App\Jobs;

use App\Models\KnowledgeResource;
use App\Services\AIService;
use App\Services\DocumentParserService;
use App\Jobs\ProcessResourceEmbedding;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GenerateResourceMetadata implements ShouldQueue
{
    use Queueable, Dispatchable, InteractsWithQueue, SerializesModels;

    public $timeout = 180;

    public function __construct(
        public KnowledgeResource $resource
    ) {}

    public function handle(
        AIService $aiService,
        DocumentParserService $documentParser
    ): void
    {
        // Skip if we already have detailed metadata or if resource is invalid
        if ($this->resource->summary && !empty($this->resource->tags)) {
            return;
        }

        $content = '';
        if ($this->resource->file_path && Storage::disk('public')->exists($this->resource->file_path)) {
            $content = $documentParser->parse($this->resource->file_path) ?? '';
            
            if (empty($content)) {
                 $extension = pathinfo($this->resource->file_path, PATHINFO_EXTENSION);
                 $content = "File: " . $this->resource->title . " (Content extraction not supported for .{$extension})";
            } else {
                $this->resource->update(['content_text' => $content]);
            }
        } elseif ($this->resource->url) {
            $content = $this->resource->content_text ?? "URL: " . $this->resource->url;
        }

        if (empty($content)) {
            return;
        }
        
        $metadata = $aiService->generateResourceMetadata($content, $this->resource->type);

        $this->resource->update([
            'title' => $this->resource->title === $this->resource->url ? Str::limit($metadata['title'] ?? $this->resource->title, 250, '') : $this->resource->title,
            'summary' => $metadata['summary'] ?? null,
            'difficulty' => ucfirst(strtolower($metadata['difficulty'] ?? 'Beginner')),
            'tags' => array_map(fn($t) => ucwords(trim($t)), $metadata['tags'] ?? []),
            'estimated_time_minutes' => $metadata['estimated_minutes'] ?? $this->resource->estimated_time_minutes,
        ]);

        if (!empty($content) || !empty($this->resource->content_text)) {
            ProcessResourceEmbedding::dispatch($this->resource);
        }
    }
}
