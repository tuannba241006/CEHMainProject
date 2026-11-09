<?php

namespace App\Console\Commands;

use App\Jobs\AggregateDailyStatisticsJob;
use Illuminate\Console\Command;

class AggregateDailyStatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ceh:aggregate-daily-stats
                            {--date= : Target date in YYYY-MM-DD format (defaults to yesterday)}
                            {--days=1 : Number of trailing days to reconcile (default 1)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Aggregate daily event statistics into thong_ke_su_kien_ngay with support for trailing reconciliation.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $targetDate = $this->option('date');
        $reconcileDays = (int) ($this->option('days') ?? 1);

        $this->info('Starting Daily Statistics Aggregation (Target: '.($targetDate ?? 'Yesterday').", Days: {$reconcileDays})...");

        $job = new AggregateDailyStatisticsJob($targetDate, $reconcileDays);
        $summary = $job->handle();

        $rows = [];
        foreach ($summary['aggregated_dates'] as $date => $count) {
            $rows[] = [$date, $count];
        }

        $this->table(['Date', 'Events Aggregated / Reconciled'], $rows);
        $this->info("Total records upserted: {$summary['total_records_upserted']}");

        return self::SUCCESS;
    }
}
