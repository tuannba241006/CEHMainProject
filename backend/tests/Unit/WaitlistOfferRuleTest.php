<?php

namespace Tests\Unit;

use App\Models\SuKien;
use App\Services\WaitlistService;
use Carbon\Carbon;
use Tests\TestCase;

class WaitlistOfferRuleTest extends TestCase
{
    /**
     * @test
     * Target: UC-BOOK-03 (15-minute minimum offer rule)
     * Course: Compare the exact minimum boundary with one second below the boundary.
     * Expected: offer is allowed at 15 minutes and withheld at 14 minutes 59 seconds.
     */
    public function test_offer_window_includes_exactly_fifteen_minutes(): void
    {
        $now = Carbon::parse('2026-11-05 08:00:00');
        $event = new SuKien;
        $event->thoi_gian_bat_dau = $now->copy()->addHours(2)->addMinutes(15);
        $service = app(WaitlistService::class);

        $this->assertTrue($service->hasMinimumOfferWindow($event, $now));

        $event->thoi_gian_bat_dau = $now->copy()->addHours(2)->addMinutes(14)->addSeconds(59);
        $this->assertFalse($service->hasMinimumOfferWindow($event, $now));
    }
}
