<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    protected function setUp(): void
    {
        $database = $_SERVER['DB_DATABASE'] ?? $_ENV['DB_DATABASE'] ?? getenv('DB_DATABASE');

        if ($database !== 'ceh_test') {
            throw new \RuntimeException('TEST BI CHAN: Chi duoc chay test tren database ceh_test!');
        }

        parent::setUp();
    }
}
