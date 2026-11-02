<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tai_khoan_quyen', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('ma_tai_khoan');
            $table->string('quyen', 100);

            // Admin cấp quyền
            $table->unsignedBigInteger('nguoi_cap');
            $table->text('ly_do_cap')->nullable();
            $table->timestamp('thoi_gian_cap')->useCurrent();

            // Thông tin thu hồi quyền
            $table->unsignedBigInteger('nguoi_thu_hoi')->nullable();
            $table->text('ly_do_thu_hoi')->nullable();
            $table->timestamp('thoi_gian_thu_hoi')->nullable();

            $table->foreign('ma_tai_khoan', 'fk_tkquyen_taikhoan')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('nguoi_cap', 'fk_tkquyen_nguoi_cap')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('nguoi_thu_hoi', 'fk_tkquyen_nguoi_thu_hoi')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->index(
                ['ma_tai_khoan', 'quyen', 'thoi_gian_thu_hoi'],
                'idx_tkquyen_kiemtra'
            );

            $table->index('nguoi_cap', 'idx_tkquyen_nguoi_cap');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tai_khoan_quyen');
    }
};
