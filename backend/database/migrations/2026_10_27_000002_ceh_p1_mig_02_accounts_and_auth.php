<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CEH-P1-MIG-02: Migrations Tài khoản, Đăng ký tạm & OTP Quên mật khẩu.
     * Bảng: tai_khoan, dang_ky_tam_thoi, otp_quen_mat_khau, sessions
     */
    public function up(): void
    {
        // 4. tai_khoan
        Schema::create('tai_khoan', function (Blueprint $table) {
            $table->id('ma_tai_khoan');
            $table->string('mssv', 8)->nullable()->unique('uq_taikhoan_mssv')->comment('MSSV 8 chữ số; NULL với tài khoản nội bộ (@uit.edu.vn)');
            $table->string('email', 100)->unique('uq_taikhoan_email');
            $table->string('ho_ten', 150);
            $table->string('mat_khau', 255)->comment('Bcrypt cost=12');
            $table->string('so_dien_thoai', 20)->nullable();
            $table->unsignedBigInteger('ma_khoa')->nullable()->comment('[3NF] FK tới don_vi_to_chuc (loai_don_vi = Khoa)');
            $table->string('khoa', 100)->nullable()->comment('Tên Khoa hiển thị nhanh');
            $table->string('lop_sinh_hoat', 50)->nullable();
            $table->string('avatar_url', 500)->nullable();
            $table->enum('loai_tai_khoan', ['Admin', 'ToChuc', 'SinhVien'])->default('SinhVien');
            $table->unsignedBigInteger('ma_don_vi_to_chuc')->nullable()->comment('Bắt buộc với ToChuc; tùy chọn với Admin (UC-ADM-01 Bước 3)');
            $table->tinyInteger('dong_y_nghi_dinh_13')->default(1)->comment('Đồng thuận Nghị định 13/2023/NĐ-CP (UC-AUTH-01, NFR-SEC-04)');
            $table->dateTime('thoi_gian_dong_y_nd13')->nullable()->useCurrent();
            $table->tinyInteger('buoc_doi_mat_khau')->default(0)->comment('1: Tài khoản nội bộ mới cấp phải đổi mật khẩu lần đầu (UC-AUTH-02, UC-ADM-01)');
            $table->tinyInteger('hoat_dong')->default(1);
            $table->dateTime('thoi_gian_tao')->useCurrent();
            $table->dateTime('thoi_gian_cap_nhat')->useCurrent()->useCurrentOnUpdate();

            $table->index(['loai_tai_khoan', 'hoat_dong'], 'idx_taikhoan_loai_hoatdong');
            $table->index('ma_khoa', 'idx_taikhoan_khoa');

            $table->foreign('ma_don_vi_to_chuc', 'fk_taikhoan_donvi')
                ->references('ma_don_vi_to_chuc')
                ->on('don_vi_to_chuc')
                ->onDelete('restrict')
                ->onUpdate('restrict');

            $table->foreign('ma_khoa', 'fk_taikhoan_khoa')
                ->references('ma_don_vi_to_chuc')
                ->on('don_vi_to_chuc')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement("ALTER TABLE `tai_khoan` ADD CONSTRAINT `chk_taikhoan_mssv` CHECK (mssv IS NULL OR mssv REGEXP '^[0-9]{8}$')");
        DB::statement("ALTER TABLE `tai_khoan` ADD CONSTRAINT `chk_taikhoan_sv_mssv` CHECK (loai_tai_khoan <> 'SinhVien' OR (mssv IS NOT NULL AND dong_y_nghi_dinh_13 = 1))");
        DB::statement("ALTER TABLE `tai_khoan` ADD CONSTRAINT `chk_taikhoan_tochuc` CHECK ((loai_tai_khoan = 'ToChuc' AND ma_don_vi_to_chuc IS NOT NULL) OR (loai_tai_khoan = 'SinhVien' AND ma_don_vi_to_chuc IS NULL) OR (loai_tai_khoan = 'Admin'))");

        // 5. dang_ky_tam_thoi
        Schema::create('dang_ky_tam_thoi', function (Blueprint $table) {
            $table->id();
            $table->string('email', 100)->unique('uq_tamthoi_email');
            $table->string('mssv', 8);
            $table->string('ho_ten', 150);
            $table->string('lop_sinh_hoat', 50);
            $table->unsignedBigInteger('ma_khoa')->nullable();
            $table->string('khoa', 100);
            $table->string('so_dien_thoai', 20)->nullable();
            $table->string('mat_khau', 255);
            $table->tinyInteger('dong_y_nghi_dinh_13')->default(1);
            $table->char('ma_otp_hash', 64);
            $table->dateTime('het_han_otp');
            $table->unsignedTinyInteger('so_lan_nhap_sai')->default(0);
            $table->unsignedTinyInteger('so_lan_gui_otp')->default(1);
            $table->dateTime('cua_so_gui_otp_tu')->useCurrent();
            $table->dateTime('thoi_gian_tao')->useCurrent();

            $table->index('mssv', 'idx_tamthoi_mssv');
            $table->index('het_han_otp', 'idx_tamthoi_hethan');

            $table->foreign('ma_khoa', 'fk_tamthoi_khoa')
                ->references('ma_don_vi_to_chuc')
                ->on('don_vi_to_chuc')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `dang_ky_tam_thoi` ADD CONSTRAINT `chk_tamthoi_nd13` CHECK (dong_y_nghi_dinh_13 = 1)');
        DB::statement('ALTER TABLE `dang_ky_tam_thoi` ADD CONSTRAINT `chk_tamthoi_sai` CHECK (so_lan_nhap_sai <= 5)');
        DB::statement('ALTER TABLE `dang_ky_tam_thoi` ADD CONSTRAINT `chk_tamthoi_gui` CHECK (so_lan_gui_otp <= 3)');

        // 6. otp_quen_mat_khau
        Schema::create('otp_quen_mat_khau', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_tai_khoan');
            $table->char('ma_otp_hash', 64);
            $table->dateTime('het_han');
            $table->tinyInteger('da_su_dung')->default(0);
            $table->unsignedTinyInteger('so_lan_thu_sai')->default(0);
            $table->dateTime('thoi_gian_tao')->useCurrent();

            $table->index(['ma_tai_khoan', 'da_su_dung', 'het_han'], 'idx_otpqmk_tk');

            $table->foreign('ma_tai_khoan', 'fk_otpqmk_taikhoan')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('cascade')
                ->onUpdate('restrict');
        });

        DB::statement('ALTER TABLE `otp_quen_mat_khau` ADD CONSTRAINT `chk_otpqmk_sai` CHECK (so_lan_thu_sai <= 5)');

        // 7. sessions (Sanctum SPA / Database Session Driver)
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id', 255)->primary();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity');

            $table->index('user_id', 'idx_sessions_user');
            $table->index('last_activity', 'idx_sessions_last');

            $table->foreign('user_id', 'fk_sessions_taikhoan')
                ->references('ma_tai_khoan')
                ->on('tai_khoan')
                ->onDelete('cascade')
                ->onUpdate('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('otp_quen_mat_khau');
        Schema::dropIfExists('dang_ky_tam_thoi');
        Schema::dropIfExists('tai_khoan');
    }
};
