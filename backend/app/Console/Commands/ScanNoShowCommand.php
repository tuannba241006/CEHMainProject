<?php

namespace App\Console\Commands;

use App\Jobs\ScanNoShowJob;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class ScanNoShowCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ceh:scan-no-show';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan completed events (T+2h) and safely flag unattended registrations as No-show with notifications.';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService): int
    {
        $this->info('Starting Safe No-show scanner...');

        $job = new ScanNoShowJob;
        $results = $job->handle($notificationService);

        $this->table(
            ['Metric', 'Count'],
            [
                ['Eligible Events Scanned', $results['events_scanned']],
                ['Tickets Marked No-show', $results['tickets_marked']],
                ['Admin Missing-Reception Alerts Sent', $results['unorganized_events_alerted']],
            ]
        );

        return self::SUCCESS;
    }
}
