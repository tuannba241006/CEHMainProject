<?php

use App\Jobs\ExpireSoftHoldJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('ceh:open-checkout-fallback')
    ->everyFiveMinutes()
    ->withoutOverlapping();

Schedule::command('ceh:expire-offers')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command('ceh:reconcile-waitlists')
    ->everyFiveMinutes()
    ->withoutOverlapping();

Schedule::job(new ExpireSoftHoldJob)
    ->everyFifteenMinutes()
    ->withoutOverlapping();
