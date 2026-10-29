<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CEH-P2-ROOM-01: Bổ sung cột ly_do_bao_tri cho bảng phong_hoi_truong.
     */
    public function up(): void
    {
        Schema::table('phong_hoi_truong', function (Blueprint $table) {
            $table->text('ly_do_bao_tri')->nullable()->after('bao_tri_den_ngay');
        });
    }

    public function down(): void
    {
        Schema::table('phong_hoi_truong', function (Blueprint $table) {
            $table->dropColumn('ly_do_bao_tri');
        });
    }
};
