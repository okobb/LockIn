<?php

namespace App\Jobs;

use App\Models\KnowledgeResource;
use App\Services\RAGService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessResourceEmbedding implements ShouldQueue
{
    use Queueable, Dispatchable, InteractsWithQueue, SerializesModels;
    public int $timeout = 300; // 5 minutes
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public function backoff(): array
    {
        return [30, 60, 120];
    }

    public function __construct(
        public KnowledgeResource $resource
    ) {}

    public function handle(RAGService $ragService): void
    {      
        Log::info('Processing resource embedding', [
            'resource_id' => $this->resource->id,
            'title' => $this->resource->title,
        ]);

        $ragService->indexResource($this->resource);
        
        Log::info('Resource embedding completed', [
            'resource_id' => $this->resource->id,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(?Throwable $exception): void
    {
        Log::error('Resource embedding failed', [
            'resource_id' => $this->resource->id,
            'error' => $exception?->getMessage(),
        ]);
    }
}
