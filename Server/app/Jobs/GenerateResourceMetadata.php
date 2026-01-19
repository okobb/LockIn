<?php

namespace App\Jobs;

use App\Models\KnowledgeResource;
use App\Services\AIService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class GenerateResourceMetadata implements ShouldQueue
{
    use Queueable, Dispatchable, InteractsWithQueue, SerializesModels;

    public function __construct(
        public KnowledgeResource $resource
    ) {}

    public function handle(AIService $aiService): void
    {
        // Skip if we already have detailed metadata or if resource is invalid
        if ($this->resource->summary && !empty($this->resource->tags)) {
            return;
        }

        $content = '';
        if ($this->resource->file_path && Storage::disk('public')->exists($this->resource->file_path)) {
            $extension = pathinfo($this->resource->file_path, PATHINFO_EXTENSION);
            if (in_array(strtolower($extension), ['pdf', 'doc', 'docx', 'txt', 'md'])) {
                if (in_array(strtolower($extension), ['txt', 'md'])) {
                   $content = Storage::disk('public')->get($this->resource->file_path);
                } else {
                    $content = "File: " . $this->resource->title . " (Content extraction not implemented for this type yet)";
                }
            }
        } elseif ($this->resource->url) {
            $content = $this->resource->content_text ?? "URL: " . $this->resource->url;
        }

        if (empty($content)) {
            return;
        }
        
        $metadata = $aiService->generateResourceMetadata($content, $this->resource->type);

        $this->resource->update([
            'title' => $this->resource->title === $this->resource->url ? ($metadata['title'] ?? $this->resource->title) : $this->resource->title,
            'summary' => $metadata['summary'] ?? null,
            'difficulty' => $metadata['difficulty'] ?? 'beginner',
            'tags' => $metadata['tags'] ?? [],
            'estimated_time_minutes' => $metadata['estimated_minutes'] ?? $this->resource->estimated_time_minutes,
        ]);
    }
}
