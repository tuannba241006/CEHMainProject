<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CEH-P1-MIG-01: Migrations Danh mục Đơn vị, Chuyên đề & Hội trường.
     * Bảng: don_vi_to_chuc, chuyen_de, phong_hoi_truong
     */
    public function up(): void
    {
        // 1. don_vi_to_chuc
        Schema::create('don_vi_to_chuc', function (Blueprint $table) {
            $table->id('ma_don_vi_to_chuc');
            $table->unsignedBigInteger('ma_don_vi_cha')->nullable()->comment('Self-referencing FK: NULL = Cấp Trường; NOT NULL = CLB trực thuộc Khoa đó');
            $table->string('ten_don_vi', 200)->unique('uq_donvi_ten');
            $table->string('ma_dinh_danh', 50)->unique('uq_donvi_dinhdanh')->comment('Mã viết tắt, ví dụ KHOA_HTTT, CLB_WEBDEV, DOAN_TRUONG, PCTSV');
            $table->enum('loai_don_vi', ['CLB', 'DoanHoi', 'Khoa', 'PhongBan']);
            $table->text('mo_ta')->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->tinyInteger('hoat_dong')->default(1);
            $table->dateTime('thoi_gian_tao')->useCurrent();
            $table->dateTime('thoi_gian_cap_nhat')->useCurrent()->useCurrentOnUpdate();

            $table->index('ma_don_vi_cha', 'idx_donvi_cha');
            $table->foreign('ma_don_vi_cha', 'fk_donvi_cha')
                ->references('ma_don_vi_to_chuc')
                ->on('don_vi_to_chuc')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        // 2. chuyen_de
        Schema::create('chuyen_de', function (Blueprint $table) {
            $table->id('ma_chuyen_de');
            $table->string('ten_chuyen_de', 100)->unique('uq_chuyende_ten');
            $table->string('mo_ta', 255)->nullable();
            $table->tinyInteger('da_xoa')->default(0);
            $table->dateTime('thoi_gian_tao')->useCurrent();
            $table->dateTime('thoi_gian_cap_nhat')->useCurrent()->useCurrentOnUpdate();
        });

        // 3. phong_hoi_truong
        Schema::create('phong_hoi_truong', function (Blueprint $table) {
            $table->id('ma_phong');
            $table->string('ten_phong', 100);
            $table->enum('co_so', ['CoSo1', 'CoSo2'])->default('CoSo1');
            $table->unsignedInteger('suc_chua_toi_da');
            $table->json('trang_thiet_bi')->nullable();
            $table->enum('trang_thai', ['KhaDung', 'BaoTri'])->default('KhaDung');
            $table->dateTime('bao_tri_tu_ngay')->nullable();
            $table->dateTime('bao_tri_den_ngay')->nullable();
            $table->tinyInteger('da_xoa')->default(0);
            $table->dateTime('thoi_gian_tao')->useCurrent();
            $table->dateTime('thoi_gian_cap_nhat')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['ten_phong', 'co_so'], 'uq_phong_ten_coso');
        });

        DB::statement('ALTER TABLE `phong_hoi_truong` ADD CONSTRAINT `chk_phong_succhua` CHECK (suc_chua_toi_da >= 10)');
        DB::statement("ALTER TABLE `phong_hoi_truong` ADD CONSTRAINT `chk_phong_baotri` CHECK ((trang_thai = 'BaoTri' AND bao_tri_tu_ngay IS NOT NULL AND bao_tri_den_ngay IS NOT NULL AND bao_tri_tu_ngay < bao_tri_den_ngay) OR (trang_thai = 'KhaDung' AND bao_tri_tu_ngay IS NULL AND bao_tri_den_ngay IS NULL))");
    }

    public function down(): void
    {
        Schema::dropIfExists('phong_hoi_truong');
        Schema::dropIfExists('chuyen_de');
        Schema::dropIfExists('don_vi_to_chuc');
    }
};
