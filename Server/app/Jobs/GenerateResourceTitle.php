<?php

namespace App\Jobs;

use App\Models\KnowledgeResource;
use App\Services\AIService;
use App\Services\UrlMetadataService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateResourceTitle implements ShouldQueue
{
    use Queueable;
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public $timeout = 180;

    public function __construct(
        public KnowledgeResource $resource
    ) {}

    public function handle(AIService $aiService, UrlMetadataService $metadataService): void
    {
        if ($this->resource->title && $this->resource->title !== $this->resource->url) {
            return;
        }

        $content = $this->resource->summary; 
        
        if (empty($content)) {
             $metadata = $metadataService->fetchMetadata($this->resource->url);
             $content = $metadata['description'] ?? '';
        }

        $generatedTitle = $aiService->generateResourceTitle($this->resource->url, $content);

        if (!empty($generatedTitle)) {
            $this->resource->update(['title' => $generatedTitle]);
        }
    }
}
