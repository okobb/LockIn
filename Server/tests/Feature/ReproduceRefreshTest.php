<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class ReproduceRefreshTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_refresh_expired_token()
    {
        $user = User::factory()->create();

        $token = JWTAuth::fromUser($user);
        
        $this->travel(61)->minutes();

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
        
        $response->assertStatus(200);
        
        $this->assertArrayHasKey('authorization', $response->json('data'));
        $this->assertArrayHasKey('token', $response->json('data.authorization'));
    }
}
