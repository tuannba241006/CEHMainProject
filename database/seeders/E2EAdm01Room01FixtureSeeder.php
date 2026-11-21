<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class E2EAdm01Room01FixtureSeeder extends Seeder
{
    /**
     * Run the database seeds for E2E Fixtures:
     * - UC-ADM-01: Quản trị Tài khoản, Phân cấp Đơn vị Tổ chức & Cấp phát User Nội bộ
     * - UC-ROOM-01: Quản lý Danh mục Hội trường, Phòng ốc & Cấu hình thiết bị / Bảo trì
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $hashedAdminPassword = Hash::make('Admin@123', $passwordCost);
        $hashedStudentPassword = Hash::make('Student@123', $passwordCost);

        $this->command->info('======================================================================');
        $this->command->info('=== BẮT ĐẦU THIẾT LẬP E2E FIXTURES (UC-ADM-01, UC-ROOM-01)        ===');
        $this->command->info('======================================================================');

        // -------------------------------------------------------------------------
        // 1. CẤU HÌNH TÀI KHOẢN NGƯỜI DÙNG (Admin chuẩn, Lock Target, Unlock Target)
        // -------------------------------------------------------------------------

        // 1.1 Tài khoản Admin chuẩn (admin@uit.edu.vn / Admin@123)
        $adminEmail = 'admin@uit.edu.vn';
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => $adminEmail],
            [
                'mssv' => null,
                'ho_ten' => 'Quản trị viên Hệ thống (P.CTSV)',
                'mat_khau' => $hashedAdminPassword,
                'so_dien_thoai' => '02837252002',
                'ma_khoa' => null,
                'khoa' => null,
                'lop_sinh_hoat' => null,
                'avatar_url' => null,
                'loai_tai_khoan' => 'Admin',
                'ma_don_vi_to_chuc' => 7, // Phòng Công tác Sinh viên (PCTSV)
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );
        $adminUser = DB::table('tai_khoan')->where('email', $adminEmail)->first();
        $this->command->info(sprintf(
            "✓ [Admin] Đã cấu hình tài khoản Quản trị viên: %s (ID: %d, vai trò: %s, pass: Admin@123)",
            $adminUser->email,
            $adminUser->ma_tai_khoan,
            $adminUser->loai_tai_khoan
        ));

        // 1.2 Tài khoản Sinh viên dùng để test Khóa tài khoản (lock_target@gm.uit.edu.vn, hoat_dong = 1)
        $lockTargetEmail = 'lock_target@gm.uit.edu.vn';
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => $lockTargetEmail],
            [
                'mssv' => '22529901',
                'ho_ten' => 'Sinh viên Test Khóa Tài Khoản (UC-ADM-01)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0981111222',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'avatar_url' => null,
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );
        $lockTargetUser = DB::table('tai_khoan')->where('email', $lockTargetEmail)->first();
        $this->command->info(sprintf(
            "✓ [Lock Target] Đã cấu hình tài khoản kiểm thử Khóa: %s (ID: %d, MSSV: %s, hoat_dong: %d, pass: Student@123)",
            $lockTargetUser->email,
            $lockTargetUser->ma_tai_khoan,
            $lockTargetUser->mssv,
            $lockTargetUser->hoat_dong
        ));

        // 1.3 Tài khoản Sinh viên dùng để test Mở khóa tài khoản (unlock_target@gm.uit.edu.vn, hoat_dong = 0)
        $unlockTargetEmail = 'unlock_target@gm.uit.edu.vn';
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => $unlockTargetEmail],
            [
                'mssv' => '22529902',
                'ho_ten' => 'Sinh viên Test Mở Khóa Tài Khoản (UC-ADM-01)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0981111333',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'avatar_url' => null,
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 0, // Đang bị khóa
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );
        $unlockTargetUser = DB::table('tai_khoan')->where('email', $unlockTargetEmail)->first();

        // Xóa sạch các phiên đăng nhập cũ nếu có của unlock target
        DB::table('sessions')->where('user_id', $unlockTargetUser->ma_tai_khoan)->delete();
        DB::table('personal_access_tokens')->where('tokenable_id', $unlockTargetUser->ma_tai_khoan)->delete();

        $this->command->info(sprintf(
            "✓ [Unlock Target] Đã cấu hình tài khoản kiểm thử Mở khóa: %s (ID: %d, MSSV: %s, hoat_dong: %d, pass: Student@123)",
            $unlockTargetUser->email,
            $unlockTargetUser->ma_tai_khoan,
            $unlockTargetUser->mssv,
            $unlockTargetUser->hoat_dong
        ));

        // -------------------------------------------------------------------------
        // 2. CẤU HÌNH ĐƠN VỊ TỔ CHỨC (Khoa HTTT & CLB Test Fixture)
        // -------------------------------------------------------------------------

        // 2.1 Đơn vị cha: Khoa Hệ thống Thông tin (ma_don_vi = 1, ma_don_vi_cha = NULL, loai_don_vi = 'Khoa')
        DB::table('don_vi_to_chuc')->updateOrInsert(
            ['ma_don_vi_to_chuc' => 1],
            [
                'ten_don_vi' => 'Khoa Hệ thống Thông tin',
                'ma_dinh_danh' => 'KHOA_HTTT',
                'loai_don_vi' => 'Khoa',
                'ma_don_vi_cha' => null,
                'mo_ta' => 'Khoa Hệ thống Thông tin - Trường ĐH Công nghệ Thông tin - ĐHQG-HCM',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );
        $htttOrg = DB::table('don_vi_to_chuc')->where('ma_don_vi_to_chuc', 1)->first();
        $this->command->info(sprintf(
            "✓ [Đơn vị cha] Đã cấu hình: %s (ID: %d, ma_dinh_danh: %s, cấp trên: %s)",
            $htttOrg->ten_don_vi,
            $htttOrg->ma_don_vi_to_chuc,
            $htttOrg->ma_dinh_danh,
            $htttOrg->ma_don_vi_cha ?? 'NULL (Cấp Trường)'
        ));

        // 2.2 Đơn vị mẫu để test chỉnh sửa / gán cấp trên: CLB Test Fixture (loai_don_vi = 'CLB')
        DB::table('don_vi_to_chuc')->updateOrInsert(
            ['ma_dinh_danh' => 'CLB_TEST_FIXTURE'],
            [
                'ten_don_vi' => 'CLB Test Fixture',
                'loai_don_vi' => 'CLB',
                'ma_don_vi_cha' => null, // Sẵn sàng để test gán đơn vị cha lên Khoa HTTT (ID 1)
                'mo_ta' => 'CLB kiểm thử cấu trúc cây phân cấp đơn vị tổ chức và cập nhật thông tin',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );
        $clbFixture = DB::table('don_vi_to_chuc')->where('ma_dinh_danh', 'CLB_TEST_FIXTURE')->first();
        $this->command->info(sprintf(
            "✓ [CLB Fixture] Đã cấu hình: %s (ID: %d, ma_dinh_danh: %s, loai: %s, cấp trên ban đầu: %s)",
            $clbFixture->ten_don_vi,
            $clbFixture->ma_don_vi_to_chuc,
            $clbFixture->ma_dinh_danh,
            $clbFixture->loai_don_vi,
            $clbFixture->ma_don_vi_cha ?? 'NULL'
        ));

        // -------------------------------------------------------------------------
        // 3. CẤU HÌNH PHÒNG HỘI TRƯỜNG CHO UC-ROOM-01
        // -------------------------------------------------------------------------

        // 3.1 Phòng 1: Hội trường Test Conflict (sức chứa 150, trạng thái KhaDung, cơ sở CoSo1, tòa A, tầng 1)
        DB::table('phong_hoi_truong')->updateOrInsert(
            [
                'ten_phong' => 'Hội trường Test Conflict',
                'co_so' => 'CoSo1',
            ],
            [
                'suc_chua_toi_da' => 150,
                'trang_thai' => 'KhaDung',
                'bao_tri_tu_ngay' => null,
                'bao_tri_den_ngay' => null,
                'ly_do_bao_tri' => null,
                'da_xoa' => 0,
                'trang_thiet_bi' => json_encode([
                    'may_chieu' => true,
                    'am_thanh' => true,
                    'mic_khong_day' => 2,
                    'wifi' => true,
                    'toa_nha' => 'Tòa A',
                    'vi_tri_tang' => 1,
                ]),
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );
        $roomConflict = DB::table('phong_hoi_truong')
            ->where('ten_phong', 'Hội trường Test Conflict')
            ->where('co_so', 'CoSo1')
            ->first();

        $this->command->info(sprintf(
            "✓ [Phòng 1] Đã cấu hình Hội trường Test Conflict: ID %d | Cơ sở: %s | Sức chứa: %d | Trạng thái: %s",
            $roomConflict->ma_phong,
            $roomConflict->co_so,
            $roomConflict->suc_chua_toi_da,
            $roomConflict->trang_thai
        ));

        // 3.2 Phòng 2: Hội trường Test Normal (sức chứa 200, trạng thái KhaDung, cơ sở CoSo1, tòa B, tầng 2)
        DB::table('phong_hoi_truong')->updateOrInsert(
            [
                'ten_phong' => 'Hội trường Test Normal',
                'co_so' => 'CoSo1',
            ],
            [
                'suc_chua_toi_da' => 200,
                'trang_thai' => 'KhaDung',
                'bao_tri_tu_ngay' => null,
                'bao_tri_den_ngay' => null,
                'ly_do_bao_tri' => null,
                'da_xoa' => 0,
                'trang_thiet_bi' => json_encode([
                    'may_chieu' => true,
                    'am_thanh' => true,
                    'mic_khong_day' => 2,
                    'wifi' => true,
                    'toa_nha' => 'Tòa B',
                    'vi_tri_tang' => 2,
                ]),
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );
        $roomNormal = DB::table('phong_hoi_truong')
            ->where('ten_phong', 'Hội trường Test Normal')
            ->where('co_so', 'CoSo1')
            ->first();

        // Đảm bảo Phòng 2 không có lịch đặt phòng nào để test cấu hình bảo trì thành công không xung đột
        DB::table('dat_phong')->where('ma_phong', $roomNormal->ma_phong)->delete();

        $this->command->info(sprintf(
            "✓ [Phòng 2] Đã cấu hình Hội trường Test Normal: ID %d | Cơ sở: %s | Sức chứa: %d | Trạng thái: %s (Trống lịch)",
            $roomNormal->ma_phong,
            $roomNormal->co_so,
            $roomNormal->suc_chua_toi_da,
            $roomNormal->trang_thai
        ));

        // -------------------------------------------------------------------------
        // 4. CẤU HÌNH SỰ KIỆN & LỊCH ĐẶT PHÒNG CONFIRMED CHO PHÒNG 1 (UC-ROOM-01.AC.1)
        // -------------------------------------------------------------------------
        // Ngày mai từ 08:00 đến 11:00
        $eventTomorrowStart = Carbon::tomorrow()->setTime(8, 0, 0);
        $eventTomorrowEnd = Carbon::tomorrow()->setTime(11, 0, 0);
        $fixtureEventId = 3001;

        // Dọn dẹp dữ liệu cũ của sự kiện fixture 3001 nếu đã tồn tại để đảm bảo tính Idempotent
        DB::table('dat_phong')->where('ma_su_kien', $fixtureEventId)->delete();
        DB::table('dang_ky')->where('ma_su_kien', $fixtureEventId)->delete();
        DB::table('su_kien_dong_to_chuc')->where('ma_su_kien', $fixtureEventId)->delete();
        DB::table('nhat_ky_kiem_duyet')->where('ma_su_kien', $fixtureEventId)->delete();
        DB::table('su_kien')->where('ma_su_kien', $fixtureEventId)->delete();

        // Tạo sự kiện đã duyệt (APPROVED) gắn vào Phòng 1
        DB::table('su_kien')->insert([
            'ma_su_kien' => $fixtureEventId,
            'ma_don_vi_to_chuc' => 1, // Khoa Hệ thống Thông tin
            'ma_chuyen_de' => 1,      // Công nghệ
            'ma_phong' => $roomConflict->ma_phong,
            'ten_su_kien' => 'E2E: Hội thảo Khoa học HTTT (Conflict Test Event)',
            'anh_bia' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
            'dien_gia' => 'Ban Chủ nhiệm Khoa HTTT',
            'mo_ta' => 'Sự kiện đã xác nhận đặt phòng để kiểm thử UC-ROOM-01.AC.1 cảnh báo xung đột khi Admin chuyển phòng sang Bảo trì.',
            'lo_trinh' => json_encode([
                ['time' => '08:00', 'title' => 'Khai mạc hội thảo'],
                ['time' => '10:30', 'title' => 'Tổng kết & Bế mạc'],
            ]),
            'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
            'ngay_cong_bo' => $now->copy()->subDays(2),
            'thoi_gian_bat_dau' => $eventTomorrowStart,
            'thoi_gian_ket_thuc' => $eventTomorrowEnd,
            'thoi_gian_ket_thuc_thuc_te' => null,
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 150,
            'so_ve_con_lai' => 150,
            'so_slot_dong_bang' => 0,
            'thoi_diem_het_ve' => null,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 3,
            'gio_tinh_nguyen' => 0.0,
            'trang_thai' => 'APPROVED',
            'cong_check_in_mo' => 0,
            'thoi_gian_mo_cong_check_in' => null,
            'cong_check_out_mo' => 0,
            'da_chot_drl' => 0,
            'thoi_gian_chot_drl' => null,
            'thoi_gian_tao' => $now,
            'thoi_gian_cap_nhat' => $now,
        ]);

        // Đặt phòng CONFIRMED cho sự kiện vào Phòng 1
        DB::table('dat_phong')->insert([
            'ma_phong' => $roomConflict->ma_phong,
            'ma_su_kien' => $fixtureEventId,
            'thoi_gian_bat_dau' => $eventTomorrowStart,
            'thoi_gian_ket_thuc' => $eventTomorrowEnd,
            'trang_thai' => 'CONFIRMED',
            'han_giu_cho_tam' => null,
            'ghi_chu' => 'Lịch đặt phòng sự kiện E2E Test Conflict',
            'thoi_gian_tao' => $now,
            'thoi_gian_cap_nhat' => $now,
        ]);

        $this->command->info(sprintf(
            "✓ [Đặt phòng CONFIRMED] Đã gắn Sự kiện ID %d vào Phòng %s (ID %d): Từ %s đến %s (Trạng thái: CONFIRMED)",
            $fixtureEventId,
            $roomConflict->ten_phong,
            $roomConflict->ma_phong,
            $eventTomorrowStart->format('Y-m-d H:i:s'),
            $eventTomorrowEnd->format('Y-m-d H:i:s')
        ));

        $this->command->info('======================================================================');
        $this->command->info('=== HOÀN TẤT THIẾT LẬP E2E FIXTURES (UC-ADM-01, UC-ROOM-01)        ===');
        $this->command->info('======================================================================');
    }
}
