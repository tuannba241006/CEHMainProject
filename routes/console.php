<?php

use App\Jobs\ExpireSoftHoldJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Campus Event Hub - Phase 2 Task Scheduler (PKG-08 / PKG-12)
|--------------------------------------------------------------------------
| Timezone: Asia/Ho_Chi_Minh (UTC+7)
*/

// PKG-08 / PKG-12 Fallback Check-out gate opening (UC-OPS-01.AC.1)
Schedule::command('ceh:open-checkout-fallback')
    ->everyFiveMinutes()
    ->withoutOverlapping();

// PKG-12 Task CEH-P2-SYS-01: Event Lifecycle State Machine (UC-SYS-01.Task 4)
Schedule::command('ceh:transition-events')
    ->everyFiveMinutes()
    ->withoutOverlapping();

// PKG-12 Task CEH-P2-SYS-03: Safe No-show Scanner (UC-SYS-01.Task 5)
Schedule::command('ceh:scan-no-show')
    ->everyThirtyMinutes()
    ->withoutOverlapping();

// PKG-12 Task CEH-P2-SYS-03: Sliding 24h Event Reminder & In-app Notification (UC-NOTIF-01)
Schedule::command('events:send-reminders')
    ->hourly()
    ->withoutOverlapping();

// PKG-12 Task CEH-P2-SYS-03: Daily Statistics Aggregator (UC-SYS-01.Task 6)
Schedule::command('ceh:aggregate-daily-stats')
    ->timezone('Asia/Ho_Chi_Minh')
    ->dailyAt('01:00')
Schedule::command('ceh:expire-offers')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command('ceh:reconcile-waitlists')
    ->everyFiveMinutes()
    ->withoutOverlapping();

Schedule::job(new ExpireSoftHoldJob)
    ->everyFifteenMinutes()
    ->withoutOverlapping();
