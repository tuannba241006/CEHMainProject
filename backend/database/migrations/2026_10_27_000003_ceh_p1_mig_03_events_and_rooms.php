<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CEH-P1-MIG-03: Migrations Sự kiện, Đồng tổ chức, Đặt phòng & Phiên Kiosk.
     * Bảng: su_kien, su_kien_dong_to_chuc, dat_phong, phien_kiosk
     */
    public function up(): void
    {
        // 8. su_kien
        Schema::create('su_kien', function (Blueprint $table) {
            $table->id('ma_su_kien');
            $table->unsignedBigInteger('ma_don_vi_to_chuc');
            $table->unsignedBigInteger('ma_chuyen_de');
            $table->unsignedBigInteger('ma_phong');
            $table->string('ten_su_kien', 255);
            $table->string('anh_bia', 500)->nullable();
            $table->string('dien_gia', 200)->nullable();
            $table->text('mo_ta');
            $table->json('lo_trinh')->nullable();
            $table->string('doi_tuong_tham_gia', 255)->nullable();
            $table->dateTime('ngay_cong_bo');
            $table->dateTime('thoi_gian_bat_dau');
            $table->dateTime('thoi_gian_ket_thuc');
            $table->dateTime('thoi_gian_ket_thuc_thuc_te')->nullable();
            $table->tinyInteger('khong_gioi_han_slot')->default(0);
            $table->unsignedInteger('so_luong_toi_da')->nullable();
            $table->unsignedInteger('so_ve_con_lai')->nullable();
            $table->unsignedInteger('so_slot_dong_bang')->default(0)->comment('Đóng băng slot khi < 15p trước T-2h mà còn người WAITING (UC-BOOK-03)');
            $table->dateTime('thoi_diem_het_ve')->nullable();
            $table->enum('dieu_khoan_drl', ['KhongCo', 'Dieu3', 'Dieu4'])->default('KhongCo');
            $table->unsignedTinyInteger('diem_drl_du_kien')->default(0);
            $table->decimal('gio_tinh_nguyen', 4, 1)->default(0.0);
            $table->enum('trang_thai', [
                'DRAFT',
                'WAITING_COHOST_CONFIRM',
                'COHOST_REJECTED',
                'PENDING_FACULTY',
                'PENDING_ADMIN',
                'APPROVED',
                'REJECTED',
                'PUBLISHED',
                'HAPPENING',
                'COMPLETED',
                'CANCELLED',
            ])->default('DRAFT');
            $table->tinyInteger('cong_check_in_mo')->default(0);
            $table->dateTime('thoi_gian_mo_cong_check_in')->nullable()->comment('Mốc mở cổng Check-in lần đầu làm căn cứ quét No-show (UC-OPS-01, UC-SYS-01)');
            $table->tinyInteger('cong_check_out_mo')->default(0);
            $table->tinyInteger('da_chot_drl')->default(0);
            $table->dateTime('thoi_gian_chot_drl')->nullable();
            $table->dateTime('thoi_gian_tao')->useCurrent();
            $table->dateTime('thoi_gian_cap_nhat')->useCurrent()->useCurrentOnUpdate();

            $table->index(['trang_thai', 'thoi_gian_bat_dau'], 'idx_sukien_tt_batdau');
            $table->index(['trang_thai', 'ngay_cong_bo'], 'idx_sukien_tt_congbo');
            $table->index(['trang_thai', 'thoi_gian_ket_thuc'], 'idx_sukien_tt_ketthuc');
            $table->index(['ma_don_vi_to_chuc', 'trang_thai'], 'idx_sukien_donvi_tt');
            $table->fullText(['ten_su_kien', 'mo_ta', 'dien_gia'], 'ft_sukien_timkiem');

            $table->foreign('ma_don_vi_to_chuc', 'fk_sukien_donvi')
                ->references('ma_don_vi_to_chuc')
                ->on('don_vi_to_chuc')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('ma_chuyen_de', 'fk_sukien_chuyende')
                ->references('ma_chuyen_de')
                ->on('chuyen_de')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('ma_phong', 'fk_sukien_phong')
                ->references('ma_phong')
                ->on('phong_hoi_truong')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `su_kien` ADD CONSTRAINT `chk_sukien_thoigian` CHECK (thoi_gian_bat_dau < thoi_gian_ket_thuc)');
        DB::statement('ALTER TABLE `su_kien` ADD CONSTRAINT `chk_sukien_soluong` CHECK ((khong_gioi_han_slot = 1 AND so_luong_toi_da IS NULL AND so_ve_con_lai IS NULL AND so_slot_dong_bang = 0) OR (khong_gioi_han_slot = 0 AND so_luong_toi_da > 0))');
        DB::statement('ALTER TABLE `su_kien` ADD CONSTRAINT `chk_sukien_conlai` CHECK (khong_gioi_han_slot = 1 OR (so_ve_con_lai IS NOT NULL AND (so_ve_con_lai + so_slot_dong_bang) <= so_luong_toi_da))');
        DB::statement('ALTER TABLE `su_kien` ADD CONSTRAINT `chk_sukien_congbo` CHECK (ngay_cong_bo <= thoi_gian_bat_dau)');
        DB::statement("ALTER TABLE `su_kien` ADD CONSTRAINT `chk_sukien_drl` CHECK (diem_drl_du_kien <= 5 AND (dieu_khoan_drl <> 'KhongCo' OR diem_drl_du_kien = 0))");
        DB::statement('ALTER TABLE `su_kien` ADD CONSTRAINT `chk_sukien_chot` CHECK (da_chot_drl = 0 OR thoi_gian_chot_drl IS NOT NULL)');

        // 9. su_kien_dong_to_chuc
        Schema::create('su_kien_dong_to_chuc', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_su_kien');
            $table->unsignedBigInteger('ma_don_vi_to_chuc');
            $table->enum('trang_thai_xac_nhan', ['CHO_XAC_NHAN', 'DONG_Y', 'TU_CHOI'])->default('CHO_XAC_NHAN');
            $table->dateTime('thoi_gian_phan_hoi')->nullable();
            $table->text('ghi_chu_tu_choi')->nullable();
            $table->dateTime('thoi_gian_tao')->useCurrent();

            $table->unique(['ma_su_kien', 'ma_don_vi_to_chuc'], 'uq_dongtochuc_sukien_donvi');
            $table->index(['ma_don_vi_to_chuc', 'trang_thai_xac_nhan'], 'idx_dongtochuc_donvi_tt');
            $table->index(['ma_su_kien', 'trang_thai_xac_nhan'], 'idx_dongtochuc_sukien_tt');

            $table->foreign('ma_su_kien', 'fk_dongtochuc_sukien')
                ->references('ma_su_kien')
                ->on('su_kien')
                ->onDelete('cascade')
                ->onUpdate('restrict');

            $table->foreign('ma_don_vi_to_chuc', 'fk_dongtochuc_donvi')
                ->references('ma_don_vi_to_chuc')
                ->on('don_vi_to_chuc')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement("ALTER TABLE `su_kien_dong_to_chuc` ADD CONSTRAINT `chk_dongtochuc_phanhoi` CHECK ((trang_thai_xac_nhan = 'CHO_XAC_NHAN' AND thoi_gian_phan_hoi IS NULL) OR (trang_thai_xac_nhan IN ('DONG_Y', 'TU_CHOI') AND thoi_gian_phan_hoi IS NOT NULL))");
        DB::statement("ALTER TABLE `su_kien_dong_to_chuc` ADD CONSTRAINT `chk_dongtochuc_tuchoi` CHECK (trang_thai_xac_nhan <> 'TU_CHOI' OR (ghi_chu_tu_choi IS NOT NULL AND CHAR_LENGTH(ghi_chu_tu_choi) >= 5))");

        // 10. dat_phong
        Schema::create('dat_phong', function (Blueprint $table) {
            $table->id('ma_dat_phong');
            $table->unsignedBigInteger('ma_phong');
            $table->unsignedBigInteger('ma_su_kien');
            $table->dateTime('thoi_gian_bat_dau');
            $table->dateTime('thoi_gian_ket_thuc');
            $table->enum('trang_thai', ['PENDING', 'CONFIRMED', 'CANCELLED'])->default('PENDING');
            $table->dateTime('han_giu_cho_tam')->nullable();
            $table->string('ghi_chu', 255)->nullable();
            $table->dateTime('thoi_gian_tao')->useCurrent();
            $table->dateTime('thoi_gian_cap_nhat')->useCurrent()->useCurrentOnUpdate();

            $table->tinyInteger('co_pending')->virtualAs("IF(trang_thai = 'PENDING', 1, NULL)");
            $table->tinyInteger('co_confirmed')->virtualAs("IF(trang_thai = 'CONFIRMED', 1, NULL)");

            $table->unique(['ma_su_kien', 'co_pending'], 'uq_datphong_pending');
            $table->unique(['ma_su_kien', 'co_confirmed'], 'uq_datphong_confirmed');
            $table->index(['ma_phong', 'thoi_gian_bat_dau', 'thoi_gian_ket_thuc', 'trang_thai'], 'idx_datphong_xungdot');

            $table->foreign('ma_phong', 'fk_datphong_phong')
                ->references('ma_phong')
                ->on('phong_hoi_truong')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('ma_su_kien', 'fk_datphong_sukien')
                ->references('ma_su_kien')
                ->on('su_kien')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `dat_phong` ADD CONSTRAINT `chk_datphong_thoigian` CHECK (thoi_gian_bat_dau < thoi_gian_ket_thuc)');

        // 11. phien_kiosk
        Schema::create('phien_kiosk', function (Blueprint $table) {
            $table->id('ma_phien_kiosk');
            $table->unsignedBigInteger('ma_su_kien');
            $table->unsignedBigInteger('nguoi_kich_hoat');
            $table->char('kiosk_token_hash', 64)->unique('uq_kiosk_token_hash')->comment('SHA-256 hash của Kiosk Session Token');
            $table->string('totp_secret', 64)->comment('Khóa bí mật sinh mã Dynamic TOTP QR 30s (RFC 6238)');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->dateTime('thoi_gian_bat_dau')->useCurrent();
            $table->dateTime('thoi_gian_het_han')->comment('Mặc định = su_kien.thoi_gian_ket_thuc + 15 phút');
            $table->tinyInteger('da_thu_hoi')->default(0);
            $table->dateTime('thoi_gian_thu_hoi')->nullable();

            $table->index(['ma_su_kien', 'da_thu_hoi', 'thoi_gian_het_han'], 'idx_kiosk_sukien_hieuluc');

            $table->foreign('ma_su_kien', 'fk_kiosk_sukien')
                ->references('ma_su_kien')
                ->on('su_kien')
                ->onDelete('cascade')
                ->onUpdate('restrict');

            $table->foreign('nguoi_kich_hoat', 'fk_kiosk_nguoi')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `phien_kiosk` ADD CONSTRAINT `chk_kiosk_thoigian` CHECK (thoi_gian_bat_dau < thoi_gian_het_han)');
        DB::statement('ALTER TABLE `phien_kiosk` ADD CONSTRAINT `chk_kiosk_thuhoi` CHECK (da_thu_hoi = 0 OR thoi_gian_thu_hoi IS NOT NULL)');
    }

    public function down(): void
    {
        Schema::dropIfExists('phien_kiosk');
        Schema::dropIfExists('dat_phong');
        Schema::dropIfExists('su_kien_dong_to_chuc');
        Schema::dropIfExists('su_kien');
    }
};
