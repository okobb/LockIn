<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\QdrantService;
use Illuminate\Support\Facades\Log;

class QdrantConnectionTest extends TestCase
{
    public function test_qdrant_connection()
    {
        echo "\nTesting Qdrant Connection...\n";

        try {
            $qdrant = new QdrantService();
            
            // Check if we can reach the server and check/create collection
            echo "Attempting to ensure collection exists...\n";
            $qdrant->ensureCollectionExists();
            echo "Collection check passed.\n";

            // Try a simple search to verify read access
            echo "Attempting a search...\n";
            $results = $qdrant->search(array_fill(0, 1536, 0.1), [], 1);
            echo "Search executed successfully. Result count: " . count($results) . "\n";
            
            $this->assertTrue(true);
        } catch (\Exception $e) {
            echo "Qdrant Connection Failed: " . $e->getMessage() . "\n";
            if ($e instanceof \GuzzleHttp\Exception\RequestException) {
                if ($e->hasResponse()) {
                    echo "Response: " . $e->getResponse()->getBody()->getContents() . "\n";
                }
            }
            $this->fail("Qdrant connection failed: " . $e->getMessage());
        }
    }
}
