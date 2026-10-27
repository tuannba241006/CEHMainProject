<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Health check endpoint
Route::get('/health', function () {
    DB::connection()->getPdo();

    return response()->json([
        'status' => 'ok',
        'service' => 'CEH Main Project API',
        'database' => 'connected',
        'server_time' => now()->toIso8601String(),
    ]);
});
