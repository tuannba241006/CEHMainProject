<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database for Phase 1 (CEH-P1-SED-01).
     */
    public function run(): void
    {
        $this->call([
            DonViToChucSeeder::class,
            ChuyenDeSeeder::class,
            PhongHoiTruongSeeder::class,
            TaiKhoanSeeder::class,
        ]);
    }
}
