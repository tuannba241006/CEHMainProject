<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CEH-P1-MIG-05: Migrations Feedback, Chứng nhận & Nhật ký Kiểm toán / Điểm danh.
     * Bảng: danh_gia_feedback, chung_nhan, nhat_ky_kiem_duyet, nhat_ky_diem_danh
     */
    public function up(): void
    {
        // 15. danh_gia_feedback
        Schema::create('danh_gia_feedback', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_dang_ky');
            $table->unsignedBigInteger('ma_su_kien');
            $table->unsignedTinyInteger('diem_noi_dung');
            $table->unsignedTinyInteger('diem_dien_gia');
            $table->unsignedTinyInteger('diem_to_chuc');
            $table->text('y_kien_dong_gop')->nullable();
            $table->dateTime('thoi_gian_gui')->useCurrent();

            $table->unique(['ma_dang_ky', 'ma_su_kien'], 'uq_feedback_ve');
            $table->index('ma_su_kien', 'idx_feedback_sukien');

            $table->foreign(['ma_dang_ky', 'ma_su_kien'], 'fk_feedback_dangky')
                ->references(['ma_dang_ky', 'ma_su_kien'])
                ->on('dang_ky')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `danh_gia_feedback` ADD CONSTRAINT `chk_feedback_noidung` CHECK (diem_noi_dung BETWEEN 1 AND 5)');
        DB::statement('ALTER TABLE `danh_gia_feedback` ADD CONSTRAINT `chk_feedback_diengia` CHECK (diem_dien_gia BETWEEN 1 AND 5)');
        DB::statement('ALTER TABLE `danh_gia_feedback` ADD CONSTRAINT `chk_feedback_tochuc` CHECK (diem_to_chuc BETWEEN 1 AND 5)');

        // 16. chung_nhan
        Schema::create('chung_nhan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_dang_ky')->unique('uq_chungnhan_dangky');
            $table->char('ma_hash', 64)->unique('uq_chungnhan_hash');
            $table->dateTime('ngay_cap')->useCurrent();
            $table->tinyInteger('da_thu_hoi')->default(0)->comment('1: Chứng nhận đã bị thu hồi (UC-CERT-01.AC.2)');
            $table->dateTime('thoi_gian_thu_hoi')->nullable();
            $table->unsignedBigInteger('nguoi_thu_hoi')->nullable();

            $table->foreign('ma_dang_ky', 'fk_chungnhan_dangky')
                ->references('ma_dang_ky')
                ->on('dang_ky')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('nguoi_thu_hoi', 'fk_chungnhan_nguoithuhoi')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `chung_nhan` ADD CONSTRAINT `chk_chungnhan_thuhoi` CHECK ((da_thu_hoi = 0 AND thoi_gian_thu_hoi IS NULL AND nguoi_thu_hoi IS NULL) OR (da_thu_hoi = 1 AND thoi_gian_thu_hoi IS NOT NULL))');

        // 17. nhat_ky_kiem_duyet
        Schema::create('nhat_ky_kiem_duyet', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_su_kien')->nullable();
            $table->unsignedBigInteger('ma_dang_ky')->nullable();
            $table->unsignedBigInteger('ma_tai_khoan_muc_tieu')->nullable();
            $table->unsignedBigInteger('nguoi_thuc_hien')->nullable()->comment('NULL = Tác vụ nền tự động của Hệ thống (UC-SYS-01 System Worker)');
            $table->enum('hanh_dong', [
                'SUBMIT',
                'WITHDRAW_PROPOSAL',
                'COHOST_ACCEPT',
                'COHOST_REJECT',
                'EXPIRE_COHOST_HOLD',
                'APPROVE_FACULTY',
                'APPROVE_FACULTY_BY_ADMIN',
                'REJECT_FACULTY',
                'APPROVE_ADMIN',
                'REJECT_ADMIN',
                'AUTO_REJECT_EXPIRED',
                'REQUEST_EDIT',
                'CHANGE_ROOM',
                'OPEN_CHECKIN_GATE',
                'EARLY_CHECKOUT_CONFIRM',
                'AUTO_OPEN_CHECKOUT',
                'CANCEL_EVENT',
                'CANCEL_TICKET',
                'GRANT_FEEDBACK_GRACE',
                'REVOKE_CERTIFICATE',
                'LOCK_DRL',
                'UNLOCK_DRL',
                'GRANT_ORGANIZER',
                'LOCK_ACCOUNT',
                'UNLOCK_ACCOUNT',
            ]);
            $table->string('trang_thai_truoc', 50)->nullable();
            $table->string('trang_thai_sau', 50)->nullable();
            $table->text('ly_do')->nullable();
            $table->dateTime('thoi_gian_tao')->useCurrent();

            $table->index(['ma_su_kien', 'thoi_gian_tao'], 'idx_kiemduyet_sukien');
            $table->index(['nguoi_thuc_hien', 'thoi_gian_tao'], 'idx_kiemduyet_nguoi');

            $table->foreign('ma_su_kien', 'fk_kiemduyet_sukien')
                ->references('ma_su_kien')
                ->on('su_kien')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('ma_dang_ky', 'fk_kiemduyet_dangky')
                ->references('ma_dang_ky')
                ->on('dang_ky')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('ma_tai_khoan_muc_tieu', 'fk_kiemduyet_muctieu')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('nguoi_thuc_hien', 'fk_kiemduyet_nguoi')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `nhat_ky_kiem_duyet` ADD CONSTRAINT `chk_kiemduyet_doituong` CHECK (ma_su_kien IS NOT NULL OR ma_dang_ky IS NOT NULL OR ma_tai_khoan_muc_tieu IS NOT NULL)');
        DB::statement("
            ALTER TABLE `nhat_ky_kiem_duyet` ADD CONSTRAINT `chk_kiemduyet_lydo` CHECK (
                (hanh_dong NOT IN (
                    'WITHDRAW_PROPOSAL',
                    'COHOST_REJECT',
                    'APPROVE_FACULTY_BY_ADMIN',
                    'REJECT_FACULTY',
                    'REJECT_ADMIN',
                    'REQUEST_EDIT',
                    'CHANGE_ROOM',
                    'EARLY_CHECKOUT_CONFIRM',
                    'AUTO_OPEN_CHECKOUT',
                    'CANCEL_EVENT',
                    'CANCEL_TICKET',
                    'GRANT_FEEDBACK_GRACE',
                    'REVOKE_CERTIFICATE',
                    'UNLOCK_DRL',
                    'LOCK_ACCOUNT'
                ) OR (ly_do IS NOT NULL AND CHAR_LENGTH(TRIM(ly_do)) > 0))
                AND (hanh_dong NOT IN ('REJECT_FACULTY', 'REJECT_ADMIN') OR CHAR_LENGTH(ly_do) >= 10)
            )
        ");

        // 18. nhat_ky_diem_danh
        Schema::create('nhat_ky_diem_danh', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_dang_ky');
            $table->unsignedBigInteger('nguoi_thuc_hien')->comment('Bắt buộc tài khoản BTC hoặc Admin thực hiện điều chỉnh thủ công (UC-OPS-04)');
            $table->enum('trang_thai_cu', ['DaDangKy', 'DaCheckIn', 'DaCheckOut', 'DaHuy']);
            $table->enum('trang_thai_moi', ['DaCheckIn', 'DaCheckOut']);
            $table->decimal('ti_le_drl_cu', 3, 2)->default(0.00);
            $table->decimal('ti_le_drl_moi', 3, 2)->default(0.00);
            $table->text('ly_do');
            $table->dateTime('thoi_gian_tao')->useCurrent();

            $table->index(['ma_dang_ky', 'thoi_gian_tao'], 'idx_diemdanh_ve');
            $table->index('nguoi_thuc_hien', 'idx_diemdanh_nguoi');

            $table->foreign('ma_dang_ky', 'fk_diemdanh_dangky')
                ->references('ma_dang_ky')
                ->on('dang_ky')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('nguoi_thuc_hien', 'fk_diemdanh_nguoi')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `nhat_ky_diem_danh` ADD CONSTRAINT `chk_diemdanh_lydo` CHECK (CHAR_LENGTH(ly_do) >= 10)');
        DB::statement('ALTER TABLE `nhat_ky_diem_danh` ADD CONSTRAINT `chk_diemdanh_tile` CHECK (ti_le_drl_cu IN (0.00, 0.50, 1.00) AND ti_le_drl_moi IN (0.00, 0.50, 1.00))');
        DB::statement('ALTER TABLE `nhat_ky_diem_danh` ADD CONSTRAINT `chk_diemdanh_khac` CHECK (trang_thai_cu <> trang_thai_moi OR ti_le_drl_cu <> ti_le_drl_moi)');
    }

    public function down(): void
    {
        Schema::dropIfExists('nhat_ky_diem_danh');
        Schema::dropIfExists('nhat_ky_kiem_duyet');
        Schema::dropIfExists('chung_nhan');
        Schema::dropIfExists('danh_gia_feedback');
    }
};
