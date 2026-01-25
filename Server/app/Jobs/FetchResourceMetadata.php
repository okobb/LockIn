<?php

namespace App\Jobs;

use App\Models\KnowledgeResource;
use App\Services\UrlMetadataService;
use App\Services\VideoMetadataService;
use App\Jobs\GenerateResourceMetadata;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FetchResourceMetadata implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public $timeout = 180;

    public function __construct(
        public KnowledgeResource $resource
    ) {}

    public function handle(
        UrlMetadataService $urlMetadata, 
        VideoMetadataService $videoMetadata
    ): void
    {
        $metadata = $urlMetadata->fetchMetadata($this->resource->url);

        $updateData = [];

        if ($this->resource->title === $this->resource->url && !empty($metadata['title'])) {
            $updateData['title'] = Str::limit($metadata['title'], 250, '');
        }

        if (empty($this->resource->summary) && !empty($metadata['description'])) {
            $updateData['summary'] = $metadata['description'];
        }

        if (empty($this->resource->thumbnail_url) && !empty($metadata['image'])) {
            $updateData['thumbnail_url'] = $metadata['image'];
        }

        if (empty($this->resource->source_domain) && !empty($metadata['domain'])) {
            $updateData['source_domain'] = $metadata['domain'];
        }

        // Type detection
        if ($this->resource->type === 'article' || $this->resource->type === 'website') { 
             if (!empty($metadata['type'])) {
                 $updateData['type'] = $metadata['type'];
             }
             
             // Content Extraction
             if (empty($this->resource->content_text)) {
                 $content = $urlMetadata->fetchContent($this->resource->url);
                 if ($content) {
                     $updateData['content_text'] = $content;
                 }
             }
        }
        
        $currentType = $updateData['type'] ?? $this->resource->type;

        $time = null;
        $videoType = defined('RESOURCE_TYPE_VIDEO') ? RESOURCE_TYPE_VIDEO : 'video';
        $articleType = defined('RESOURCE_TYPE_ARTICLE') ? RESOURCE_TYPE_ARTICLE : 'article';
        
        $apiTags = [];

        if ($currentType === $videoType) {
            $details = $videoMetadata->fetchDetails($this->resource->url);
            
            if ($details) {
                $updateData['title'] = Str::limit($details['title'], 250, '');
                $updateData['summary'] = $details['description'];
                $updateData['thumbnail_url'] = $details['thumbnail_url'];
                $time = $details['duration'];
                
                if (!empty($details['tags'])) {
                    $apiTags = $details['tags'];
                }
            } else {
                // Fallback (e.g. Vimeo just gets duration)
                $time = $videoMetadata->getDuration($this->resource->url);
            }

            // Transcript logic
            if (empty($this->resource->content_text) && !isset($updateData['content_text'])) {
                 $transcript = $videoMetadata->getTranscript($this->resource->url);
                 if ($transcript) {
                     $updateData['content_text'] = $transcript;
                 }
            }
        } elseif ($currentType === $articleType) {
            // 5 mins default
            $time = 5; 
        }
        
        if ($time !== null) {
            $updateData['estimated_time_minutes'] = $time;
        }

        if (!empty($updateData)) {
            if (!empty($apiTags) && empty($this->resource->tags)) {
                $updateData['tags'] = $apiTags;
            }

            $this->resource->update($updateData);

            if (isset($updateData['content_text'])) {
                ProcessResourceEmbedding::dispatch($this->resource);
            }
        }

        // Refresh model to get latest data from above update
        $this->resource->refresh();

        GenerateResourceMetadata::dispatch($this->resource);
    }
}
