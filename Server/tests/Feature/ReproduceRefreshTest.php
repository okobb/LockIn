<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class ReproduceRefreshTest extends TestCase
{
    use RefreshDatabase; // Use with caution if not configured

    public function test_can_refresh_expired_token()
    {
        // 1. Create a user
        $user = User::factory()->create();

        // 2. Generate a token that is ALREADY expired (or expires very soon)
        // We can simulate this by setting TTL to 0 or manipulating claims
        // But better is to create a valid token, then travel time forward.
        
        $token = JWTAuth::fromUser($user);

        // 3. Simulate time passing to expire the token
        // Token TTL is usually 60 minutes.
        // We can travel 61 minutes into the future.
        $this->travel(61)->minutes();

        // 4. Try to refresh the token using the endpoint
        $this->withoutExceptionHandling();
        try {
            $response = $this->withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->postJson('/api/auth/refresh');
        } catch (\Throwable $e) {
            dump($e->getMessage());
            dump($e->getTraceAsString());
            throw $e;
        }

        // 5. Assert the response
        // If it returns 401, then we reproduced the issue (assuming refresh window is > 60 mins)
        // If it returns 200, then the backend logic SHOULD work.
        
        $response->assertStatus(200);
        
        $this->assertArrayHasKey('token', $response->json('data'));
    }
}
