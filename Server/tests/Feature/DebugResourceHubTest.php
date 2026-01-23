<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\ResourceHubService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Queue;
use App\Jobs\FetchResourceMetadata;
use App\Jobs\GenerateResourceMetadata;
use App\Jobs\ProcessResourceEmbedding;

class DebugResourceHubTest extends TestCase
{
use RefreshDatabase;
    public function test_resource_creation_chain()
    {
        
        Bus::fake();

        $user = User::factory()->create();
        
        $service = app(ResourceHubService::class);
        
        $url = 'https://example.com/debugging-resource-hub';
        
        echo "\nCreating resource from URL: $url\n";
        
        $resource = $service->createFromUrl($url, $user->id);
        
        echo "Resource created with ID: " . $resource->id . "\n";
        
        Bus::assertChained([
            FetchResourceMetadata::class,
            GenerateResourceMetadata::class,
            ProcessResourceEmbedding::class,
        ]);
        
        echo "Job chain asserted successfully.\n";
    }
}
