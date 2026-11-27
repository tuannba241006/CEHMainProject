<?php

namespace Tests\Feature;

use Tests\TestCase;

class InternalSchedulerEndpointTest extends TestCase
{
    public function test_returns_503_when_cron_secret_is_not_configured(): void
    {
        config()->set('services.scheduler.secret', '');

        $response = $this->postJson('/api/internal/scheduler/run');

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'error_code' => 'CRON_SECRET_NOT_CONFIGURED',
            ]);
    }

    public function test_returns_403_when_secret_header_is_missing_or_invalid(): void
    {
        config()->set('services.scheduler.secret', 'super-secret-cron-token');

        $this->postJson('/api/internal/scheduler/run')
            ->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'FORBIDDEN',
            ]);

        $this->postJson('/api/internal/scheduler/run', [], [
            'X-Cron-Secret' => 'wrong-token',
        ])->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'FORBIDDEN',
            ]);
    }

    public function test_runs_laravel_scheduler_when_secret_matches(): void
    {
        config()->set('services.scheduler.secret', 'super-secret-cron-token');

        $response = $this->postJson('/api/internal/scheduler/run', [], [
            'X-Cron-Secret' => 'super-secret-cron-token',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.exit_code', 0);
    }
}
