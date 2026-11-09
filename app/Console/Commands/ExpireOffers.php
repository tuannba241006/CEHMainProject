<?php

namespace App\Console\Commands;

use App\Services\WaitlistService;
use Illuminate\Console\Command;

class ExpireOffers extends Command
{
    protected $signature = 'ceh:expire-offers';

    protected $description = 'Expire waitlist offers past their claim deadlines.';

    public function handle(WaitlistService $waitlistService): int
    {
        $expired = $waitlistService->expireOffer();
        $this->info("Expired {$expired} waitlist offer(s).");

        return self::SUCCESS;
    }
}
