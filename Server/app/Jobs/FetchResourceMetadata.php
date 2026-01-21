<?php

namespace App\Jobs;

use App\Models\KnowledgeResource;
use App\Services\UrlMetadataService;
use App\Services\VideoMetadataService;
use App\Services\AIService;
use App\Jobs\ProcessResourceEmbedding;
use Illuminate\Bus\Queueable;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FetchResourceMetadata implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public KnowledgeResource $resource
    ) {}

    public function handle(
        UrlMetadataService $urlMetadata, 
        VideoMetadataService $videoMetadata,
        AIService $aiService
    ): void
    {
        $metadata = $urlMetadata->fetchMetadata($this->resource->url);

        $updateData = [];

        if ($this->resource->title === $this->resource->url && !empty($metadata['title'])) {
            $updateData['title'] = $metadata['title'];
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
                $updateData['title'] = $details['title'];
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

        if (empty($this->resource->tags) || empty($this->resource->difficulty)) {
            try {
                $prompt = "Analyze this resource and provide metadata relative to programming/productivity:\n";
                $prompt .= "Title: " . $this->resource->title . "\n";
                $prompt .= "Summary: " . ($this->resource->summary ?? 'N/A') . "\n";
                $prompt .= "Type: " . $this->resource->type . "\n\n";
                $prompt .= "1. Generate 3-5 relevant tags (comma separated, lowercase).\n";
                $prompt .= "2. Estimate difficulty level (beginner, intermediate, advanced).\n";
                $prompt .= "Format: Tags: [tag1, tag2]\nDifficulty: [level]";

                $response = $aiService->chat([
                    ['role' => 'system', 'content' => 'You are a metadata classifier for a developer resource library.'],
                    ['role' => 'user', 'content' => $prompt]
                ]);

                // Simple parsing
                $tags = [];
                $difficulty = null;

                if (preg_match('/Tags:\s*\[(.*?)\]/i', $response, $matches)) {
                    $tags = array_map('trim', explode(',', $matches[1]));
                }
                
                if (preg_match('/Difficulty:\s*\[(.*?)\]/i', $response, $matches)) {
                    $diff = strtolower(trim($matches[1]));
                    if (in_array($diff, ['beginner', 'intermediate', 'advanced'])) {
                        $difficulty = $diff;
                    }
                }

                $aiUpdates = [];
                if (empty($this->resource->tags) && !empty($tags)) {
                    $aiUpdates['tags'] = $tags;
                }
                if (empty($this->resource->difficulty) && $difficulty) {
                    $aiUpdates['difficulty'] = $difficulty;
                }
                
                if (!empty($aiUpdates)) {
                    $this->resource->update($aiUpdates);
                }

            } catch (\Exception $e) {
                Log::warning("AI Metadata generation failed: " . $e->getMessage());
            }
        }
    }
}
