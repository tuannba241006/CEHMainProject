<?php

use App\Models\Event;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Kiểm tra API và kết nối database
Route::get('/health', function () {
    DB::connection()->getPdo();

    return response()->json([
        'status' => 'ok',
        'service' => 'CEH Main Project API',
        'database' => 'connected',
    ]);
});

// Lấy danh sách sự kiện
// Debug database - chỉ dùng khi phát triển local
Route::get('/events', function () {
    return Event::query()
        ->with('organizer:id,name')
        ->orderBy('starts_at')
        ->get();
});

// Xem chi tiết một sự kiện theo ID
// Debug database - chỉ dùng khi phát triển local
Route::get('/events/{event}', function (Event $event) {
    return $event->load('organizer:id,name');
});
