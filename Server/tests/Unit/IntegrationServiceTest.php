<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\IntegrationService;
use App\Models\User;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;

class IntegrationServiceTest extends TestCase
{
    use RefreshDatabase;

    private IntegrationService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->service = app(IntegrationService::class);
    }

    #[Test]
    public function test_upsert_from_oauth_creates_new_integration()
    {
        Cache::shouldReceive('forget')->times(4); 

        $integration = $this->service->upsertFromOAuth(
            $this->user,
            'google',
            'google-id-123',
            'access-token-abc',
            'refresh-token-xyz',
            ['calendar.readonly'],
            now()->addHour()
        );

        $this->assertDatabaseHas('integrations', [
            'user_id' => $this->user->id,
            'provider' => 'google',
            'provider_id' => 'google-id-123',
            'is_active' => true,
        ]);
        
        $this->assertEquals(['calendar.readonly'], $integration->scopes);
    }

    #[Test]
    public function test_upsert_from_oauth_merges_scopes()
    {
        Cache::shouldReceive('forget')->andReturn(true);

        $existing = Integration::create([
            'user_id' => $this->user->id,
            'provider' => 'github',
            'provider_id' => 'gh-123',
            'scopes' => ['repo'],
            'access_token' => 'old-token',
            'refresh_token' => 'old-refresh',
        ]);

        $updated = $this->service->upsertFromOAuth(
            $this->user,
            'github',
            'gh-123',
            'new-access',
            null,
            ['user', 'repo'], 
            null
        );

        $this->assertEquals($existing->id, $updated->id);
        $this->assertEquals('new-access', $updated->access_token);
        
        $this->assertCount(2, $updated->scopes);
        $this->assertContains('repo', $updated->scopes);
        $this->assertContains('user', $updated->scopes);
    }

    #[Test]
    public function test_is_token_expired_returns_true_for_expiring_tokens()
    {
        $integration = Integration::create([
            'user_id' => $this->user->id,
            'provider' => 'slack',
            'provider_id' => 'slack-1',
            'access_token' => 'token',
            'refresh_token' => 'refresh',
            'expires_at' => now()->addMinutes(3), 
        ]);

        $this->assertTrue($this->service->isTokenExpired($integration));

        $integration->update(['expires_at' => now()->addMinutes(10)]);
        $this->assertFalse($this->service->isTokenExpired($integration->fresh()));
    }

    #[Test]
    public function test_disconnect_deactivates_integration()
    {
        Cache::shouldReceive('forget'); 

        $integration = Integration::create([
            'user_id' => $this->user->id,
            'provider' => 'slack',
            'provider_id' => 'slack-disconnect',
            'access_token' => 'token',
            'refresh_token' => 'refresh',
            'is_active' => true,
        ]);

        $this->service->disconnect($integration);

        $this->assertFalse($integration->fresh()->is_active);
    }

    #[Test]
    public function test_has_provider_returns_correct_status()
    {
        Integration::create([
            'user_id' => $this->user->id,
            'provider' => 'google',
            'provider_id' => 'g-1',
            'access_token' => 't',
            'refresh_token' => 'r',
            'is_active' => true,
        ]);

        $this->assertTrue($this->service->hasProvider($this->user, 'google'));
        $this->assertFalse($this->service->hasProvider($this->user, 'github'));

        Integration::create([
            'user_id' => $this->user->id,
            'provider' => 'github',
            'provider_id' => 'gh-inactive',
            'access_token' => 't',
            'refresh_token' => 'r',
            'is_active' => false,
        ]);
        
        $this->assertFalse($this->service->hasProvider($this->user, 'github'));
    }
}
