<?php

namespace App\Console\Commands;

use App\Services\FallbackCheckOutService;
use Illuminate\Console\Command;

class OpenFallbackCheckOutGates extends Command
{
    protected $signature = 'ceh:open-checkout-fallback';

    protected $description = 'Open event check-out gates at the planned end when organizers have not done so.';

    public function handle(FallbackCheckOutService $fallback): int
    {
        $opened = $fallback->run();
        $this->info("Opened {$opened} fallback check-out gate(s).");

        return self::SUCCESS;
    }
}
