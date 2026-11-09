<?php

namespace App\Console\Commands;

use App\Jobs\SendUpcomingEventReminderJob;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SendUpcomingEventRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan published events in sliding 24-hour window and dispatch reminder emails and in-app notifications.';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService): int
    {
        $this->info('Starting 24h upcoming event reminder scanner...');

        $job = new SendUpcomingEventReminderJob;
        $results = $job->handle($notificationService);

        $this->table(
            ['Metric', 'Count'],
            [
                ['Eligible Unreminded Tickets Found', $results['eligible_tickets']],
                ['Reminders Sent (In-app & Email Queued)', $results['reminders_sent']],
            ]
        );

        return self::SUCCESS;
    }
}
