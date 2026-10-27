<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CEH-P1-MIG-04: Migrations Vé Đăng ký, Waitlist FIFO & Nhân viên Check-in.
     * Bảng: dang_ky, hang_doi_waitlist, nhan_vien_check_in
     */
    public function up(): void
    {
        // 12. dang_ky
        Schema::create('dang_ky', function (Blueprint $table) {
            $table->id('ma_dang_ky');
            $table->unsignedBigInteger('ma_tai_khoan');
            $table->unsignedBigInteger('ma_su_kien');
            $table->char('ma_ve_uuid', 36)->unique('uq_dangky_uuid');
            $table->char('chu_ky_hmac', 64);
            $table->enum('trang_thai', ['DaDangKy', 'DaCheckIn', 'DaCheckOut', 'DaHuy'])->default('DaDangKy');
            $table->dateTime('thoi_gian_dang_ky')->useCurrent();
            $table->dateTime('thoi_gian_check_in')->nullable();
            $table->dateTime('thoi_gian_check_out')->nullable();
            $table->dateTime('thoi_gian_huy')->nullable();
            $table->string('ly_do_huy', 255)->nullable();
            $table->tinyInteger('da_check_in')->default(0);
            $table->tinyInteger('da_check_out')->default(0);
            $table->string('ma_thiet_bi_check_in', 100)->nullable();
            $table->string('ma_thiet_bi_check_out', 100)->nullable();
            $table->string('ma_thiet_bi_nghi_van', 100)->nullable()->comment('Thiết bị bị chặn khi quét chéo tại UC-OPS-03.EX.1');
            $table->tinyInteger('nghi_van_gian_lan')->default(0);
            $table->tinyInteger('tham_gia_tron_ven')->default(0);
            $table->tinyInteger('tham_gia_mot_phan')->default(0);
            $table->decimal('ti_le_drl', 3, 2)->default(0.00);
            $table->tinyInteger('da_feedback')->default(0);
            $table->dateTime('han_an_han_feedback')->nullable()->comment('Mốc ân hạn Feedback 24h do Admin cứu xét (UC-FEED-01.AC.1)');
            $table->tinyInteger('du_dieu_kien_drl')->default(0);
            $table->tinyInteger('vi_pham_no_show')->default(0);
            $table->tinyInteger('da_gui_nhac_nho')->default(0);
            $table->string('ghi_chu', 255)->nullable();

            $table->unsignedBigInteger('ma_tk_hieu_luc')->virtualAs("IF(trang_thai <> 'DaHuy', ma_tai_khoan, NULL)");

            $table->unique(['ma_su_kien', 'ma_tk_hieu_luc'], 'uq_dangky_ve_hieu_luc');
            $table->unique(['ma_dang_ky', 'ma_su_kien'], 'uq_dangky_id_sukien');

            $table->index(['ma_tai_khoan', 'ma_su_kien'], 'idx_dangky_tk_sukien');
            $table->index(['ma_su_kien', 'trang_thai'], 'idx_dangky_sukien_tt');
            $table->index(['ma_su_kien', 'ma_thiet_bi_check_in'], 'idx_dangky_thietbi_in');
            $table->index(['ma_su_kien', 'ma_thiet_bi_check_out'], 'idx_dangky_thietbi_out');

            $table->foreign('ma_tai_khoan', 'fk_dangky_taikhoan')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('ma_su_kien', 'fk_dangky_sukien')
                ->references('ma_su_kien')
                ->on('su_kien')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement("
            ALTER TABLE `dang_ky` ADD CONSTRAINT `chk_dangky_diemdanh` CHECK (
                (trang_thai = 'DaDangKy' AND da_check_in = 0 AND da_check_out = 0)
                OR (trang_thai = 'DaCheckIn' AND da_check_in = 1 AND da_check_out = 0 AND thoi_gian_check_in IS NOT NULL)
                OR (trang_thai = 'DaCheckOut' AND da_check_in = 1 AND da_check_out = 1 AND thoi_gian_check_in IS NOT NULL AND thoi_gian_check_out IS NOT NULL AND thoi_gian_check_out >= thoi_gian_check_in)
                OR (trang_thai = 'DaHuy' AND thoi_gian_huy IS NOT NULL)
            )
        ");
        DB::statement('ALTER TABLE `dang_ky` ADD CONSTRAINT `chk_dangky_tile` CHECK (ti_le_drl IN (0.00, 0.50, 1.00))');
        DB::statement('ALTER TABLE `dang_ky` ADD CONSTRAINT `chk_dangky_thamdu1` CHECK (NOT (tham_gia_tron_ven = 1 AND tham_gia_mot_phan = 1))');
        DB::statement('ALTER TABLE `dang_ky` ADD CONSTRAINT `chk_dangky_thamdu2` CHECK (tham_gia_tron_ven = 0 OR (ti_le_drl = 1.00 AND da_check_out = 1))');
        DB::statement('ALTER TABLE `dang_ky` ADD CONSTRAINT `chk_dangky_thamdu3` CHECK (tham_gia_mot_phan = 0 OR (ti_le_drl = 0.50 AND da_check_out = 1))');
        DB::statement('ALTER TABLE `dang_ky` ADD CONSTRAINT `chk_dangky_feedback` CHECK (da_feedback = 0 OR da_check_out = 1)');
        DB::statement('ALTER TABLE `dang_ky` ADD CONSTRAINT `chk_dangky_drl` CHECK (du_dieu_kien_drl = 0 OR (da_feedback = 1 AND ti_le_drl > 0))');
        DB::statement("ALTER TABLE `dang_ky` ADD CONSTRAINT `chk_dangky_noshow` CHECK (vi_pham_no_show = 0 OR (trang_thai = 'DaDangKy' AND da_check_in = 0 AND nghi_van_gian_lan = 0))");

        // 13. hang_doi_waitlist
        Schema::create('hang_doi_waitlist', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_su_kien');
            $table->unsignedBigInteger('ma_tai_khoan');
            $table->unsignedInteger('so_thu_tu');
            $table->enum('trang_thai', [
                'WAITING',
                'OFFERED',
                'ACCEPTED',
                'DECLINED',
                'EXPIRED',
                'SKIPPED_CONFLICT',
                'CLOSED_WAITLIST',
                'CANCELLED',
            ])->default('WAITING');
            $table->dateTime('thoi_gian_dang_ky')->useCurrent();
            $table->dateTime('han_chot_xac_nhan')->nullable();
            $table->dateTime('thoi_gian_phan_hoi')->nullable();

            $table->unsignedBigInteger('ma_tk_dang_cho')->virtualAs("IF(trang_thai IN ('WAITING', 'OFFERED'), ma_tai_khoan, NULL)");

            $table->unique(['ma_su_kien', 'so_thu_tu'], 'uq_waitlist_thutu');
            $table->unique(['ma_su_kien', 'ma_tk_dang_cho'], 'uq_waitlist_dang_cho');

            $table->index(['ma_su_kien', 'trang_thai', 'so_thu_tu'], 'idx_waitlist_fifo');
            $table->index(['trang_thai', 'han_chot_xac_nhan'], 'idx_waitlist_hanchot');
            $table->index(['ma_tai_khoan', 'trang_thai'], 'idx_waitlist_tk');

            $table->foreign('ma_su_kien', 'fk_waitlist_sukien')
                ->references('ma_su_kien')
                ->on('su_kien')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('ma_tai_khoan', 'fk_waitlist_taikhoan')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `hang_doi_waitlist` ADD CONSTRAINT `chk_waitlist_thutu` CHECK (so_thu_tu > 0)');
        DB::statement("ALTER TABLE `hang_doi_waitlist` ADD CONSTRAINT `chk_waitlist_offered` CHECK (trang_thai <> 'OFFERED' OR han_chot_xac_nhan IS NOT NULL)");

        // 14. nhan_vien_check_in
        Schema::create('nhan_vien_check_in', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_tai_khoan');
            $table->unsignedBigInteger('ma_su_kien');
            $table->unsignedBigInteger('nguoi_phan_cong')->nullable();
            $table->dateTime('thoi_gian_phan_cong')->useCurrent();

            $table->unique(['ma_tai_khoan', 'ma_su_kien'], 'uq_staff_tk_sukien');
            $table->index('ma_su_kien', 'idx_staff_sukien');

            $table->foreign('ma_tai_khoan', 'fk_staff_taikhoan')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('ma_su_kien', 'fk_staff_sukien')
                ->references('ma_su_kien')
                ->on('su_kien')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('nguoi_phan_cong', 'fk_staff_nguoiphancong')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nhan_vien_check_in');
        Schema::dropIfExists('hang_doi_waitlist');
        Schema::dropIfExists('dang_ky');
    }
};
