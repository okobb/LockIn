<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\LiquidSchedulerService;
use App\Models\User;
use App\Models\Task;
use App\Models\CalendarEvent;
use App\Models\ReadLaterQueue;
use App\Models\KnowledgeResource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\Test;

class LiquidSchedulerServiceTest extends TestCase
{
    use RefreshDatabase;

    private LiquidSchedulerService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->service = app(LiquidSchedulerService::class);
    }

    #[Test]
    public function test_finds_gaps_between_events()
    {
        Carbon::setTestNow(Carbon::parse('2024-01-01 08:00:00'));

        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Event 1',
            'start_time' => now()->startOfDay()->addHours(9),
            'end_time' => now()->startOfDay()->addHours(10),
        ]);

        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Event 2',
            'start_time' => now()->startOfDay()->addHours(10)->addMinutes(30),
            'end_time' => now()->startOfDay()->addHours(11)->addMinutes(30),
        ]);

        $gaps = $this->service->findDailyGaps($this->user->id, now());

        $this->assertGreaterThanOrEqual(2, $gaps->count());
        
        $gap30 = $gaps->first(fn($g) => $g['duration_minutes'] === 30);
        $this->assertNotNull($gap30);
        $this->assertEquals('10:00', $gap30['start']);
        $this->assertEquals('10:30', $gap30['end']);
    }

    #[Test]
    public function test_ignores_gaps_too_small()
    {
        Carbon::setTestNow(Carbon::parse('2024-01-01 08:00:00'));

        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Event 1',
            'start_time' => now()->startOfDay()->addHours(9),
            'end_time' => now()->startOfDay()->addHours(10),
        ]);

        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Event 2',
            'start_time' => now()->startOfDay()->addHours(10)->addMinutes(10),
            'end_time' => now()->startOfDay()->addHours(11),
        ]);

        $gaps = $this->service->findDailyGaps($this->user->id, now());

        $smallGap = $gaps->first(fn($g) => $g['start'] === '10:00');
        $this->assertNull($smallGap);
    }

    #[Test]
    public function test_suggests_content_fitting_gap()
    {
        $resShort = KnowledgeResource::factory()->create([
            'user_id' => $this->user->id, 
            'estimated_time_minutes' => 15
        ]);
        $resLong = KnowledgeResource::factory()->create([
            'user_id' => $this->user->id, 
            'estimated_time_minutes' => 60
        ]);

        ReadLaterQueue::create([
            'user_id' => $this->user->id, 
            'resource_id' => $resShort->id,
            'estimated_minutes' => 15
        ]);
        ReadLaterQueue::create([
            'user_id' => $this->user->id, 
            'resource_id' => $resLong->id,
            'estimated_minutes' => 60
        ]);

        $suggestions = $this->service->suggestContentForGap($this->user->id, 20);

        if ($suggestions->count() !== 1) {
             dump($suggestions->toArray());
        }

        $this->assertCount(1, $suggestions);
        $this->assertEquals($resShort->id, $suggestions->first()->resource_id);
    }
}
