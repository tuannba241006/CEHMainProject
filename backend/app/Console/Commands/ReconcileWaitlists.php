<?php

namespace App\Console\Commands;

use App\Services\WaitlistService;
use Illuminate\Console\Command;

class ReconcileWaitlists extends Command
{
    protected $signature = 'ceh:reconcile-waitlists';

    protected $description = 'Close published waitlists at the T-2h cutoff and reconcile held slots.';

    public function handle(WaitlistService $waitlistService): int
    {
        $closed = $waitlistService->reconcileCutoff();
        $this->info("Reconciled {$closed} waitlist event(s).");

        return self::SUCCESS;
    }
}
