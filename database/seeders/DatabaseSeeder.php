<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
            ]
        );

        $organizer = User::firstOrCreate(
            ['email' => 'organizer@example.com'],
            [
                'name' => 'Organizer Demo',
                'password' => 'password',
            ]
        );

        Event::firstOrCreate(
            [
                'organizer_id' => $organizer->id,
                'title' => 'Workshop Laravel cơ bản',
            ],
            [
                'description' => 'Sự kiện mẫu để kiểm tra database Campus Event Hub.',
                'location' => 'Phòng A1',
                'starts_at' => '2026-11-15 09:00:00',
                'ends_at' => '2026-11-15 11:00:00',
                'capacity' => 50,
                'status' => 'draft',
            ]
        );
    }
}