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
        DailyStat::create(['user_id' => $this->user->id, 'date' => now(), 'flow_time_min' => 60]);
        DailyStat::create(['user_id' => $this->user->id, 'date' => now()->subDay(), 'flow_time_min' => 60]);
        DailyStat::create(['user_id' => $this->user->id, 'date' => now()->subDays(2), 'flow_time_min' => 60]);

        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(3, $streak);
    }

    public function test_streak_ignore_zero_flow_time()
    {
        DailyStat::create(['user_id' => $this->user->id, 'date' => now(), 'flow_time_min' => 60]);
        DailyStat::create(['user_id' => $this->user->id, 'date' => now()->subDay(), 'flow_time_min' => 0]); 
        
        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(1, $streak);
    }
}
