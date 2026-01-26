<?php

namespace Tests\Feature;

use App\Models\DailyStat;
use App\Models\User;
use App\Services\StatsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsStreakTest extends TestCase
{
    use RefreshDatabase;

    private StatsService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        // Since we can't easily mock the StatsService dependencies in a feature test without more setup,
        // we'll rely on the real service resolved from container.
        $this->service = app(StatsService::class);
        $this->user = User::factory()->create();
    }

    public function test_streak_zero_if_no_activity()
    {
        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(0, $streak);
    }

    public function test_streak_active_today_only()
    {
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now(),
            'flow_time_min' => 60
        ]);

        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(1, $streak);
    }
    
    public function test_streak_active_yesterday_only()
    {
        // Valid streak because "today" hasn't happened yet fully, allowing yesterday to keep it alive
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now()->subDay(),
            'flow_time_min' => 60
        ]);

        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(1, $streak);
    }

    public function test_streak_broken_if_gap()
    {
        // Worked 2 days ago, but not yesterday or today
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now()->subDays(2),
            'flow_time_min' => 60
        ]);

        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(0, $streak);
    }

    public function test_streak_multi_day()
    {
        // Today, Yesterday, 2 days ago
        DailyStat::create(['user_id' => $this->user->id, 'date' => now(), 'flow_time_min' => 60]);
        DailyStat::create(['user_id' => $this->user->id, 'date' => now()->subDay(), 'flow_time_min' => 60]);
        DailyStat::create(['user_id' => $this->user->id, 'date' => now()->subDays(2), 'flow_time_min' => 60]);

        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(3, $streak);
    }

    public function test_streak_ignore_zero_flow_time()
    {
        DailyStat::create(['user_id' => $this->user->id, 'date' => now(), 'flow_time_min' => 60]);
        // Yesterday had record but 0 flow time
        DailyStat::create(['user_id' => $this->user->id, 'date' => now()->subDay(), 'flow_time_min' => 0]); 
        
        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(1, $streak); // Only today counts
    }
}
