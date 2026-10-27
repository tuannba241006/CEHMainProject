<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CEH-P1-MIG-06: Migrations Thông báo, Thống kê Ngày, Hạ tầng Queue/Cache & 3 Database Views.
     * Bảng: thong_bao, thong_ke_su_kien_ngay, jobs, failed_jobs, cache, cache_locks, personal_access_tokens
     * Views: v_event_analytics, v_feedback_an_danh, v_danh_sach_drl, v_admin_bi_summary
     */
    public function up(): void
    {
        // 19. thong_bao
        Schema::create('thong_bao', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_tai_khoan');
            $table->string('tieu_de', 200);
            $table->text('noi_dung');
            $table->enum('loai_thong_bao', [
                'HE_THONG',
                'MOI_DONG_TO_CHUC',
                'PHAN_HOI_DONG_TO_CHUC',
                'DE_XUAT_SU_KIEN',
                'KET_QUA_KIEM_DUYET',
                'CAP_NHAT_SU_KIEN',
                'DOI_PHONG_KHAN_CAP',
                'HUY_SU_KIEN',
                'NHAC_HEN',
                'CLAIM_SLOT',
                'VE_MOI',
                'WAITLIST_DONG',
                'CANH_BAO_NO_SHOW',
            ]);
            $table->string('lien_ket', 255)->nullable();
            $table->tinyInteger('da_doc')->default(0);
            $table->dateTime('thoi_gian_gui')->useCurrent();

            $table->index(['ma_tai_khoan', 'da_doc', 'thoi_gian_gui'], 'idx_thongbao_tk');

            $table->foreign('ma_tai_khoan', 'fk_thongbao_taikhoan')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('cascade')
                ->onUpdate('restrict');
        });

        // 20. thong_ke_su_kien_ngay
        Schema::create('thong_ke_su_kien_ngay', function (Blueprint $table) {
            $table->id();
            $table->date('ngay_thong_ke');
            $table->unsignedBigInteger('ma_su_kien');
            $table->unsignedInteger('tong_ve_phat_hanh')->nullable();
            $table->unsignedInteger('tong_ve_dang_ky')->default(0);
            $table->unsignedInteger('tong_luot_tham_du')->default(0);
            $table->unsignedInteger('tong_luot_check_out')->default(0);
            $table->unsignedInteger('tong_luot_no_show')->default(0);
            $table->integer('so_phut_chay_ve')->nullable();
            $table->decimal('diem_hai_long_trung_binh', 3, 2)->nullable();
            $table->dateTime('thoi_gian_cap_nhat')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['ngay_thong_ke', 'ma_su_kien'], 'uq_thongke_ngay_sukien');
            $table->index('ma_su_kien', 'idx_thongke_sukien');

            $table->foreign('ma_su_kien', 'fk_thongke_sukien')
                ->references('ma_su_kien')
                ->on('su_kien')
                ->onDelete('cascade')
                ->onUpdate('restrict');
        });

        // 21. jobs
        if (! Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table) {
                $table->id();
                $table->string('queue', 255)->index('idx_jobs_queue');
                $table->longText('payload');
                $table->unsignedTinyInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });
        }

        // 22. failed_jobs
        if (! Schema::hasTable('failed_jobs')) {
            Schema::create('failed_jobs', function (Blueprint $table) {
                $table->id();
                $table->string('uuid', 255)->unique('uq_failedjobs_uuid');
                $table->text('connection');
                $table->text('queue');
                $table->longText('payload');
                $table->longText('exception');
                $table->timestamp('failed_at')->useCurrent();
            });
        }

        // 23. cache
        if (! Schema::hasTable('cache')) {
            Schema::create('cache', function (Blueprint $table) {
                $table->string('key', 255)->primary();
                $table->mediumText('value');
                $table->integer('expiration')->index('idx_cache_expiration');
            });
        }

        // 24. cache_locks
        if (! Schema::hasTable('cache_locks')) {
            Schema::create('cache_locks', function (Blueprint $table) {
                $table->string('key', 255)->primary();
                $table->string('owner', 255);
                $table->integer('expiration')->index('idx_cachelocks_expiration');
            });
        }

        // 25. personal_access_tokens (Sanctum)
        if (! Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->string('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }

        // 26. 3 Database Views
        DB::statement('DROP VIEW IF EXISTS `v_event_analytics`');
        DB::statement("
            CREATE VIEW `v_event_analytics` AS
            SELECT
                sk.ma_su_kien,
                sk.ten_su_kien,
                dv.ten_don_vi AS don_vi_chu_tri,
                dv_cha.ten_don_vi AS don_vi_cap_tren,
                COALESCE(co.so_don_vi_dong_to_chuc, 0) AS so_don_vi_dong_to_chuc,
                cd.ten_chuyen_de,
                ph.ten_phong,
                ph.co_so,
                sk.trang_thai,
                sk.ngay_cong_bo,
                sk.thoi_gian_bat_dau,
                sk.thoi_gian_ket_thuc,
                sk.khong_gioi_han_slot,
                sk.so_luong_toi_da,
                sk.so_ve_con_lai,
                sk.so_slot_dong_bang,
                COALESCE(t.so_ve_da_dat, 0) AS so_ve_da_dat,
                COALESCE(t.so_luot_check_in, 0) AS so_luot_check_in,
                COALESCE(t.so_luot_check_out, 0) AS so_luot_check_out,
                COALESCE(t.so_luot_nhan_drl, 0) AS so_luot_nhan_drl,
                COALESCE(t.so_luot_no_show, 0) AS so_luot_no_show,
                CASE
                    WHEN sk.khong_gioi_han_slot = 1 OR sk.so_luong_toi_da IS NULL OR sk.so_luong_toi_da = 0 THEN NULL
                    ELSE ROUND(COALESCE(t.so_ve_da_dat, 0) * 100 / sk.so_luong_toi_da, 2)
                END AS ti_le_lap_day_pct,
                sk.thoi_diem_het_ve,
                TIMESTAMPDIFF(MINUTE, sk.ngay_cong_bo, sk.thoi_diem_het_ve) AS so_phut_chay_ve,
                sk.dieu_khoan_drl,
                sk.diem_drl_du_kien,
                f.diem_noi_dung_tb,
                f.diem_dien_gia_tb,
                f.diem_to_chuc_tb
            FROM su_kien sk
            JOIN don_vi_to_chuc dv ON dv.ma_don_vi_to_chuc = sk.ma_don_vi_to_chuc
            LEFT JOIN don_vi_to_chuc dv_cha ON dv_cha.ma_don_vi_to_chuc = dv.ma_don_vi_cha
            JOIN chuyen_de cd ON cd.ma_chuyen_de = sk.ma_chuyen_de
            JOIN phong_hoi_truong ph ON ph.ma_phong = sk.ma_phong
            LEFT JOIN (
                SELECT ma_su_kien,
                       COUNT(CASE WHEN trang_thai_xac_nhan = 'DONG_Y' THEN 1 END) AS so_don_vi_dong_to_chuc
                FROM su_kien_dong_to_chuc
                GROUP BY ma_su_kien
            ) co ON co.ma_su_kien = sk.ma_su_kien
            LEFT JOIN (
                SELECT ma_su_kien,
                       COUNT(CASE WHEN trang_thai <> 'DaHuy' THEN 1 END) AS so_ve_da_dat,
                       COUNT(CASE WHEN da_check_in = 1 THEN 1 END) AS so_luot_check_in,
                       COUNT(CASE WHEN da_check_out = 1 THEN 1 END) AS so_luot_check_out,
                       COUNT(CASE WHEN du_dieu_kien_drl = 1 THEN 1 END) AS so_luot_nhan_drl,
                       COUNT(CASE WHEN vi_pham_no_show = 1 THEN 1 END) AS so_luot_no_show
                FROM dang_ky
                GROUP BY ma_su_kien
            ) t ON t.ma_su_kien = sk.ma_su_kien
            LEFT JOIN (
                SELECT ma_su_kien,
                       ROUND(AVG(diem_noi_dung), 2) AS diem_noi_dung_tb,
                       ROUND(AVG(diem_dien_gia), 2) AS diem_dien_gia_tb,
                       ROUND(AVG(diem_to_chuc), 2) AS diem_to_chuc_tb
                FROM danh_gia_feedback
                GROUP BY ma_su_kien
            ) f ON f.ma_su_kien = sk.ma_su_kien
            WHERE sk.trang_thai IN ('APPROVED', 'PUBLISHED', 'HAPPENING', 'COMPLETED', 'CANCELLED')
        ");

        DB::statement('DROP VIEW IF EXISTS `v_feedback_an_danh`');
        DB::statement('
            CREATE VIEW `v_feedback_an_danh` AS
            SELECT
                ma_su_kien,
                diem_noi_dung,
                diem_dien_gia,
                diem_to_chuc,
                y_kien_dong_gop,
                thoi_gian_gui
            FROM danh_gia_feedback
        ');

        DB::statement('DROP VIEW IF EXISTS `v_danh_sach_drl`');
        DB::statement("
            CREATE VIEW `v_danh_sach_drl` AS
            SELECT
                dk.ma_su_kien,
                ROW_NUMBER() OVER (PARTITION BY dk.ma_su_kien ORDER BY tk.mssv) AS stt,
                tk.mssv,
                tk.ho_ten,
                tk.lop_sinh_hoat,
                COALESCE(dv_khoa.ten_don_vi, tk.khoa) AS khoa,
                sk.ten_su_kien,
                sk.dieu_khoan_drl AS dieu_drl,
                ROUND(sk.diem_drl_du_kien * dk.ti_le_drl, 2) AS diem_cong_thuc_nhan,
                dk.thoi_gian_check_in AS thoi_gian_vao,
                dk.thoi_gian_check_out AS thoi_gian_ra,
                GREATEST(
                    0,
                    TIMESTAMPDIFF(
                        MINUTE,
                        GREATEST(dk.thoi_gian_check_in, sk.thoi_gian_bat_dau),
                        LEAST(dk.thoi_gian_check_out, COALESCE(sk.thoi_gian_ket_thuc_thuc_te, sk.thoi_gian_ket_thuc))
                    )
                ) AS thoi_luong_tham_du_phut,
                CASE
                    WHEN dk.tham_gia_tron_ven = 1 THEN 'Tham dự trọn vẹn (100%)'
                    WHEN dk.tham_gia_mot_phan = 1 THEN 'Tham dự một phần (50%)'
                    ELSE NULL
                END AS ghi_chu_tham_du
            FROM dang_ky dk
            JOIN tai_khoan tk ON tk.ma_tai_khoan = dk.ma_tai_khoan
            LEFT JOIN don_vi_to_chuc dv_khoa ON dv_khoa.ma_don_vi_to_chuc = tk.ma_khoa
            JOIN su_kien sk ON sk.ma_su_kien = dk.ma_su_kien
            WHERE dk.du_dieu_kien_drl = 1
        ");

        DB::statement('DROP VIEW IF EXISTS `v_admin_bi_summary`');
        DB::statement("
            CREATE VIEW `v_admin_bi_summary` AS
            SELECT
                COUNT(DISTINCT sk.ma_su_kien) AS tong_so_su_kien,
                COUNT(DISTINCT dk.ma_dang_ky) AS tong_luot_dang_ky,
                COUNT(DISTINCT CASE WHEN dk.da_check_in = 1 THEN dk.ma_dang_ky END) AS tong_luot_tham_du,
                COUNT(DISTINCT CASE WHEN dk.vi_pham_no_show = 1 THEN dk.ma_dang_ky END) AS tong_luot_no_show,
                COUNT(DISTINCT CASE WHEN dk.du_dieu_kien_drl = 1 THEN dk.ma_dang_ky END) AS tong_luot_nhan_drl,
                ROUND(AVG(f.diem_trung_binh), 2) AS diem_feedback_trung_binh_toan_truong
            FROM su_kien sk
            LEFT JOIN dang_ky dk ON dk.ma_su_kien = sk.ma_su_kien
            LEFT JOIN (
                SELECT ma_dang_ky, ROUND((diem_noi_dung + diem_dien_gia + diem_to_chuc) / 3.0, 2) AS diem_trung_binh
                FROM danh_gia_feedback
            ) f ON f.ma_dang_ky = dk.ma_dang_ky
            WHERE sk.trang_thai IN ('APPROVED', 'PUBLISHED', 'HAPPENING', 'COMPLETED')
        ");
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS `v_admin_bi_summary`');
        DB::statement('DROP VIEW IF EXISTS `v_danh_sach_drl`');
        DB::statement('DROP VIEW IF EXISTS `v_feedback_an_danh`');
        DB::statement('DROP VIEW IF EXISTS `v_event_analytics`');

        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('thong_ke_su_kien_ngay');
        Schema::dropIfExists('thong_bao');
    }
};
