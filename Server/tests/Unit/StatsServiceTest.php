<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\StatsService;
use App\Services\UserService;
use App\Models\User;
use App\Models\DailyStat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Mockery;

class StatsServiceTest extends TestCase
{
    use RefreshDatabase;

    private StatsService $service;
    private User $user;
    private $mockUserService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->mockUserService = Mockery::mock(UserService::class);
        
        $this->service = new StatsService($this->mockUserService);
    }

    #[Test]
    public function test_get_current_streak_calculates_consecutive_days()
    {
        // Today
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now()->toDateString(),
            'flow_time_min' => 25,
        ]);
        // Yesterday
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now()->subDay()->toDateString(),
            'flow_time_min' => 25,
        ]);
        // Day before
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now()->subDays(2)->toDateString(),
            'flow_time_min' => 25,
        ]);

        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(3, $streak);
    }

    #[Test]
    public function test_get_current_streak_breaks_on_skip()
    {
        // Today
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now()->toDateString(),
            'flow_time_min' => 25,
        ]);
        // Day before yesterday (Gap)
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now()->subDays(2)->toDateString(),
            'flow_time_min' => 25,
        ]);

        $streak = $this->service->getCurrentStreak($this->user->id);
        $this->assertEquals(1, $streak);
    }

    #[Test]
    public function test_get_weekly_stats_aggregates_focus_minutes()
    {
        // Today (in week)
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now()->startOfWeek()->toDateString(),
            'flow_time_min' => 60,
        ]);
        // Tomorrow (in week)
        DailyStat::create([
            'user_id' => $this->user->id,
            'date' => now()->startOfWeek()->addDay()->toDateString(),
            'flow_time_min' => 30,
        ]);

        $stats = $this->service->getWeeklyStats($this->user->id);
        $this->assertEquals(90, $stats['flow_time_minutes']);
    }

    #[Test]
    public function test_get_daily_breakdown_returns_7_days()
    {
        $breakdown = $this->service->getDailyBreakdown($this->user->id);
        
        $this->assertCount(7, $breakdown);
        // Start of week matches
        $this->assertEquals(now()->startOfWeek()->toDateString(), $breakdown[0]['date']);
        // End matches
        $this->assertEquals(now()->endOfWeek()->toDateString(), $breakdown[6]['date']);
    }

    #[Test]
    public function test_set_weekly_goal_updates_user_settings()
    {
        $this->mockUserService->shouldReceive('setWeeklyGoal')
            ->once()
            ->with($this->user->id, 1000);

        Cache::shouldReceive('forget')->once()->with("stats:weekly:{$this->user->id}");

        $this->service->setWeeklyGoal($this->user->id, 1000);
    }
}
