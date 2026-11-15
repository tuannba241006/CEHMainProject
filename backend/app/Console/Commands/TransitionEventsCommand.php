<?php

namespace App\Console\Commands;

use App\Jobs\TransitionEventLifecycleJob;
use App\Services\FallbackCheckOutService;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class TransitionEventsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ceh:transition-events';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Transition event lifecycle states (APPROVED->PUBLISHED->HAPPENING->COMPLETED) and auto-reject expired proposals.';

    /**
     * Execute the console command.
     */
    public function handle(
        NotificationService $notificationService,
        FallbackCheckOutService $fallbackService
    ): int {
        $this->info('Starting event lifecycle transition worker...');

        $job = new TransitionEventLifecycleJob;
        $stats = $job->handle($notificationService, $fallbackService);

        $this->table(
            ['Action / Transition', 'Events Processed'],
            [
                ['Auto-rejected Expired Proposals', $stats['auto_rejected']],
                ['APPROVED -> PUBLISHED', $stats['published']],
                ['PUBLISHED -> HAPPENING', $stats['happening']],
                ['Fallback Check-out Gates Opened', $stats['fallback_opened']],
                ['HAPPENING -> COMPLETED (Gates Closed)', $stats['completed']],
            ]
        );

        return self::SUCCESS;
    }
}
