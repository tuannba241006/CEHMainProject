<?php

use App\Http\Controllers\Api\EventShareController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// UC-DISC-02.AC.1: OpenGraph SSR cho crawler mang xa hoi (Facebook/Zalo).
Route::get('/events/{id}/share', [EventShareController::class, 'show'])
    ->whereNumber('id')
    ->name('web.events.public.share');
