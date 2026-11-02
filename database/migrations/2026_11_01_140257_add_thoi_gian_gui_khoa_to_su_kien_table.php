<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('su_kien', 'thoi_gian_gui_khoa')) {
            Schema::table('su_kien', function (Blueprint $table) {
                $table->timestamp('thoi_gian_gui_khoa')
                    ->nullable()
                    ->after('trang_thai');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('su_kien', 'thoi_gian_gui_khoa')) {
            Schema::table('su_kien', function (Blueprint $table) {
                $table->dropColumn('thoi_gian_gui_khoa');
            });
        }
    }
};