<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UatPkg03EventLifecycleSeeder extends Seeder
{
    /**
     * Run the database seeds for UAT Package 3 (CEH-UAT-PKG-03):
     * - UC-EVT-01: Soạn thảo sự kiện, cấu hình slot / mở tự do, mời Co-host
     * - UC-EVT-02: Gửi đề xuất, Soft Hold 48h, Co-host đồng ý / từ chối, Rút đề xuất (WITHDRAW_PROPOSAL)
     * - UC-EVT-03: Thẩm định đa cấp (CLB -> Khoa parent -> Admin), Admin duyệt thay Khoa, Từ chối & Reopen, Hủy khẩn cấp, Đổi phòng khẩn cấp
     * - UC-REP-01: Dashboard phân tích chỉ số hiệu quả BTC (Show-up, No-show, Feedback, phân bổ theo Khoa, lưu lượng theo khung giờ)
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $hashedAdminPassword = Hash::make('Admin@123', $passwordCost);
        $hashedFacultyPassword = Hash::make('Faculty@123', $passwordCost);
        $hashedClubPassword = Hash::make('Club@123', $passwordCost);
        $hashedStudentPassword = Hash::make('Student@123', $passwordCost);

        $this->command->info('==============================================================================');
        $this->command->info('=== THIẾT LẬP DỮ LIỆU KIỂM THỬ UAT GÓI SỐ 3 (CEH-UAT-PKG-03)               ===');
        $this->command->info('=== Các UC: UC-EVT-01, UC-EVT-02, UC-EVT-03, UC-REP-01                     ===');
        $this->command->info('==============================================================================');

        // -------------------------------------------------------------------------
        // 1. TÀI KHOẢN NGƯỜI DÙNG (CÁC ACTOR THAM GIA KIỂM THỬ GÓI SỐ 3)
        // -------------------------------------------------------------------------

        // 1.1 Host A (CLB trực thuộc Khoa HTTT): CLB WebDev UIT (ma_don_vi = 9, ma_don_vi_cha = 1)
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => 'clb.webdev@uit.edu.vn'],
            [
                'email' => 'clb.webdev@uit.edu.vn',
                'mssv' => null,
                'ho_ten' => 'Ban Chủ nhiệm CLB WebDev (Host A)',
                'mat_khau' => $hashedClubPassword,
                'so_dien_thoai' => '0907654321',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => null,
                'avatar_url' => null,
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 9, // CLB WebDev trực thuộc Khoa HTTT
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );

        // 1.2 Co-host B (CLB khác): CLB Trí tuệ Nhân tạo - AI Club (ma_don_vi = 10, ma_don_vi_cha = 2)
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => 'clb.aiclub@uit.edu.vn'],
            [
                'email' => 'clb.aiclub@uit.edu.vn',
                'mssv' => null,
                'ho_ten' => 'Ban Chủ nhiệm CLB AI Club (Co-host B)',
                'mat_khau' => $hashedClubPassword,
                'so_dien_thoai' => '0908888999',
                'ma_khoa' => 2,
                'khoa' => 'Khoa Khoa học Máy tính',
                'lop_sinh_hoat' => null,
                'avatar_url' => null,
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 10, // CLB AI
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );

        // 1.3 Khoa Parent của Host A (Cán bộ thẩm định cấp Khoa HTTT): ma_don_vi = 1, ma_khoa = 1
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => 'canbo.httt@uit.edu.vn'],
            [
                'email' => 'canbo.httt@uit.edu.vn',
                'mssv' => null,
                'ho_ten' => 'Cán bộ Khoa HTTT (Duyệt Cấp Khoa)',
                'mat_khau' => $hashedFacultyPassword,
                'so_dien_thoai' => '0901234567',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => null,
                'avatar_url' => null,
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );

        // 1.4 Quản trị viên P.CTSV (Admin Thẩm định Cấp Trường & Toàn quyền Duyệt thay / Hủy / Đổi phòng)
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => 'admin@uit.edu.vn'],
            [
                'email' => 'admin@uit.edu.vn',
                'mssv' => null,
                'ho_ten' => 'Quản trị viên P.CTSV (Admin Duyệt Cấp Trường)',
                'mat_khau' => $hashedAdminPassword,
                'so_dien_thoai' => '02837252002',
                'ma_khoa' => null,
                'khoa' => null,
                'lop_sinh_hoat' => null,
                'avatar_url' => null,
                'loai_tai_khoan' => 'Admin',
                'ma_don_vi_to_chuc' => 7, // P.CTSV
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );

        // 1.5 Đơn vị Ngoài lề (Test chặn Unauthorized 403 Forbidden cho UC-REP-01): CLB CyberSecurity (ma_don_vi = 11)
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => 'clb.cyber@uit.edu.vn'],
            [
                'email' => 'clb.cyber@uit.edu.vn',
                'mssv' => null,
                'ho_ten' => 'Ban Chủ nhiệm CLB An toàn Thông tin (Không Liên Quan)',
                'mat_khau' => $hashedClubPassword,
                'so_dien_thoai' => '0903333444',
                'ma_khoa' => 4,
                'khoa' => 'Khoa Mạng máy tính và Truyền thông',
                'lop_sinh_hoat' => null,
                'avatar_url' => null,
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 11, // CLB An toàn Thông tin
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );

        // 1.6 Sinh viên kiểm thử (Khoa HTTT, KHMT, KTMT, MMT)
        $students = [
            ['email' => '21520001@gm.uit.edu.vn', 'mssv' => '21520001', 'ho_ten' => 'Nguyễn Văn An', 'ma_khoa' => 1, 'khoa' => 'Khoa Hệ thống Thông tin'],
            ['email' => '21520002@gm.uit.edu.vn', 'mssv' => '21520002', 'ho_ten' => 'Trần Minh Bình', 'ma_khoa' => 2, 'khoa' => 'Khoa Khoa học Máy tính'],
            ['email' => '21520003@gm.uit.edu.vn', 'mssv' => '21520003', 'ho_ten' => 'Lê Quốc Cường', 'ma_khoa' => 3, 'khoa' => 'Khoa Kỹ thuật Máy tính'],
            ['email' => '21520004@gm.uit.edu.vn', 'mssv' => '21520004', 'ho_ten' => 'Phạm Hoàng Dũng', 'ma_khoa' => 4, 'khoa' => 'Khoa Mạng máy tính và Truyền thông'],
        ];

        $studentIds = [];
        foreach ($students as $sv) {
            DB::table('tai_khoan')->updateOrInsert(
                ['mssv' => $sv['mssv']],
                [
                    'email' => $sv['email'],
                    'mssv' => $sv['mssv'],
                    'ho_ten' => $sv['ho_ten'],
                    'mat_khau' => $hashedStudentPassword,
                    'so_dien_thoai' => '0912000000',
                    'ma_khoa' => $sv['ma_khoa'],
                    'khoa' => $sv['khoa'],
                    'lop_sinh_hoat' => 'K2021',
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
            $user = DB::table('tai_khoan')->where('mssv', $sv['mssv'])->first();
            $studentIds[] = $user->ma_tai_khoan;
        }

        $this->command->info('-> Đã cấu hình đầy đủ tài khoản các bên tham gia kiểm thử.');

        // -------------------------------------------------------------------------
        // 2. DỌN DẸP DỮ LIỆU CŨ CỦA BỘ TEST GÓI SỐ 3 (IDEMPOTENCY: 301 - 310)
        // -------------------------------------------------------------------------
        $fixtureEventIds = [301, 302, 303, 304, 305, 306, 307, 308, 309, 310];

        // Xóa vé và dữ liệu phụ thuộc
        $oldTicketIds = DB::table('dang_ky')->whereIn('ma_su_kien', $fixtureEventIds)->pluck('ma_dang_ky');
        if ($oldTicketIds->isNotEmpty()) {
            DB::table('chung_nhan')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('danh_gia_feedback')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('dang_ky')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
        }

        DB::table('hang_doi_waitlist')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('phien_kiosk')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('nhan_vien_check_in')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('nhat_ky_kiem_duyet')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('thong_ke_su_kien_ngay')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('dat_phong')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien_dong_to_chuc')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien')->whereIn('ma_su_kien', $fixtureEventIds)->delete();

        $this->command->info('-> Đã làm sạch dữ liệu cũ cho các sự kiện ID: '.implode(', ', $fixtureEventIds));

        // -------------------------------------------------------------------------
        // 3. KHỞI TẠO MA TRẬN 10 SỰ KIỆN TEST VÒNG ĐỜI & EDGE CASES (301 -> 310)
        // -------------------------------------------------------------------------

        $events = [
            // =========================================================================
            // SỰ KIỆN 301: DRAFT - Soạn thảo & Gửi duyệt (UC-EVT-01, TC-EVT-02.01)
            // =========================================================================
            [
                'ma_su_kien' => 301,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E (sức chứa 500)
                'ten_su_kien' => 'E2E-PKG03: Workshop Clean Architecture & Laravel 12 (Bản nháp)',
                'anh_bia' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
                'dien_gia' => 'TS. Bùi Phan Thành Trí',
                'mo_ta' => 'Sự kiện ở trạng thái DRAFT dùng để kiểm tra form soạn thảo, validate sức chứa, thời gian và bấm nút Gửi phê duyệt (Soft Hold 48h).',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Check-in & Khai mạc'], ['time' => '11:00', 'title' => 'Bế mạc']]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->addDays(1)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->addDays(5)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(5)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 200,
                'so_ve_con_lai' => 200,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'DRAFT',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // =========================================================================
            // SỰ KIỆN 302: WAITING_COHOST_CONFIRM -> Co-host Đồng ý 100% -> Chuyển Cấp Khoa (UC-EVT-02.AC.1)
            // =========================================================================
            [
                'ma_su_kien' => 302,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 2, // Hội trường A (sức chứa 300)
                'ten_su_kien' => 'E2E-PKG03: Hackathon AI for Smart Campus 2026 (Chờ Co-host Xác Nhận)',
                'anh_bia' => 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
                'dien_gia' => 'Chuyên gia AI Google Developers',
                'mo_ta' => 'Sự kiện có mời CLB AI đồng tổ chức, đang giữ phòng Soft Hold 48h. Test Co-host bấm Đồng ý -> Chuyển sang PENDING_FACULTY.',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Khai mạc'], ['time' => '11:00', 'title' => 'Chấm thi']]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->addDays(1)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->addDays(6)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(6)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 150,
                'so_ve_con_lai' => 150,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'WAITING_COHOST_CONFIRM',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // =========================================================================
            // SỰ KIỆN 303: WAITING_COHOST_CONFIRM -> Co-host Từ chối -> Rơi về COHOST_REJECTED / DRAFT (UC-EVT-02.AC.2)
            // =========================================================================
            [
                'ma_su_kien' => 303,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 4, // Khởi nghiệp
                'ma_phong' => 3, // Phòng C109 (sức chứa 150)
                'ten_su_kien' => 'E2E-PKG03: Tọa đàm Khởi nghiệp & Gọi vốn Công nghệ (Test Co-host Từ chối)',
                'anh_bia' => 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
                'dien_gia' => 'Venture Capital Mentors',
                'mo_ta' => 'Sự kiện kiểm tra Co-host bấm Từ chối kèm lý do >= 5 ký tự -> Giải phóng phòng và đưa sự kiện về trạng thái từ chối/nháp.',
                'lo_trinh' => json_encode([['time' => '13:30', 'title' => 'Pitching'], ['time' => '16:00', 'title' => 'Networking']]),
                'doi_tuong_tham_gia' => 'Sinh viên đam mê Khởi nghiệp',
                'ngay_cong_bo' => $now->copy()->addDays(1)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->addDays(7)->setTime(13, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(7)->setTime(16, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 100,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'WAITING_COHOST_CONFIRM',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // =========================================================================
            // SỰ KIỆN 304: PENDING_FACULTY -> Host chủ động Rút đề xuất WITHDRAW_PROPOSAL (UC-EVT-02.AC.3)
            // =========================================================================
            [
                'ma_su_kien' => 304,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 4, // Phòng B114 (sức chứa 100)
                'ten_su_kien' => 'E2E-PKG03: Hội thảo Tối ưu hóa Database & High Concurrency (Test Rút đề xuất)',
                'anh_bia' => 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=400&fit=crop',
                'dien_gia' => 'Kỹ sư Database DBA',
                'mo_ta' => 'Sự kiện đang chờ Khoa duyệt, Host A phát hiện sai sót nội dung và bấm Rút đề xuất (WITHDRAW_PROPOSAL) về DRAFT.',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Phần 1: Kiến trúc MySQL'], ['time' => '10:00', 'title' => 'Phần 2: Pessimistic Locking']]),
                'doi_tuong_tham_gia' => 'Sinh viên ngành HTTT & KHMT',
                'ngay_cong_bo' => $now->copy()->addDays(1)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->addDays(8)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(8)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 80,
                'so_ve_con_lai' => 80,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PENDING_FACULTY',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // =========================================================================
            // SỰ KIỆN 305: PENDING_FACULTY -> Luồng Phê duyệt Đa cấp Chuẩn (UC-EVT-03.01)
            // Cấp 1: Khoa HTTT duyệt -> PENDING_ADMIN
            // Cấp 2: Admin P.CTSV duyệt -> APPROVED & CONFIRMED phòng
            // =========================================================================
            [
                'ma_su_kien' => 305,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E (sức chứa 500)
                'ten_su_kien' => 'E2E-PKG03: Chuỗi Seminar Cybersecurity & Ethical Hacking (Luồng Duyệt Đa Cấp)',
                'anh_bia' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop',
                'dien_gia' => 'Chuyên gia An ninh mạng SOC',
                'mo_ta' => 'Sự kiện do CLB gửi lên chờ Khoa HTTT thẩm định nội dung, sau đó Admin P.CTSV thẩm định cấp phòng & phê duyệt chính thức.',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Web Security'], ['time' => '10:00', 'title' => 'Live Demo Exploit']]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->addDays(1)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->addDays(9)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(9)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 300,
                'so_ve_con_lai' => 300,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PENDING_FACULTY',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // =========================================================================
            // SỰ KIỆN 306: PENDING_FACULTY -> Admin Duyệt thay Cấp Khoa (ADMIN OVERRIDE - UC-EVT-03.AC.1)
            // =========================================================================
            [
                'ma_su_kien' => 306,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 3, // Kỹ năng mềm
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'E2E-PKG03: Ngày hội Văn hóa Công nghệ và Kỹ năng Sinh viên (Test Admin Duyệt Thay)',
                'anh_bia' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
                'dien_gia' => 'Diễn giả Khách mời Doanh nghiệp',
                'mo_ta' => 'Sự kiện thử nghiệm quyền Admin P.CTSV duyệt thay cấp Khoa kèm lý do bắt buộc (APPROVE_FACULTY_BY_ADMIN).',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Giao lưu'], ['time' => '10:30', 'title' => 'Workshop kĩ năng']]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên',
                'ngay_cong_bo' => $now->copy()->addDays(1)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->addDays(10)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(10)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 150,
                'so_ve_con_lai' => 150,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PENDING_FACULTY',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // =========================================================================
            // SỰ KIỆN 307: PENDING_FACULTY -> Từ chối / Yêu cầu sửa & Tái mở DRAFT (UC-EVT-03.AC.2 & AC.3)
            // =========================================================================
            [
                'ma_su_kien' => 307,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 2, // Học thuật
                'ma_phong' => 3, // C109
                'ten_su_kien' => 'E2E-PKG03: Workshop Mock Interview & Phỏng vấn Doanh nghiệp (Test Từ Chối & Reopen)',
                'anh_bia' => 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop',
                'dien_gia' => 'HR Manager Doanh nghiệp IT',
                'mo_ta' => 'Sự kiện kiểm tra người duyệt bấm Từ chối (ly_do >= 10 ký tự) -> REJECTED -> Host A bấm Chỉnh sửa lại (reopen) để phục hồi DRAFT.',
                'lo_trinh' => json_encode([['time' => '13:30', 'title' => 'Mock Interview'], ['time' => '16:00', 'title' => 'Nhận xét']]),
                'doi_tuong_tham_gia' => 'Sinh viên năm 3, 4',
                'ngay_cong_bo' => $now->copy()->addDays(1)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->addDays(11)->setTime(13, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(11)->setTime(16, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 100,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PENDING_FACULTY',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // =========================================================================
            // SỰ KIỆN 308: APPROVED -> Admin Điều chỉnh Phòng khẩn cấp (CHANGE_ROOM - UC-EVT-03.AC.4)
            // =========================================================================
            [
                'ma_su_kien' => 308,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 2, // Hội trường A (sức chứa 300)
                'ten_su_kien' => 'E2E-PKG03: Diễn đàn Công nghệ Cloud Native & Kubernetes (Test Đổi Phòng Khẩn Cấp)',
                'anh_bia' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
                'dien_gia' => 'DevOps Cloud Architect',
                'mo_ta' => 'Sự kiện đã APPROVED tại Hội trường A. Kiểm tra Admin đổi sang Phòng C109 (sức chứa 150 >= 120 vé) thành công; kiểm tra đổi sang B114 (100 < 120 vé) bị chặn.',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'K8s Cluster Setup'], ['time' => '10:30', 'title' => 'Monitoring & CI/CD']]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->addDays(2)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->addDays(12)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(12)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 120,
                'so_ve_con_lai' => 120,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'APPROVED',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // =========================================================================
            // SỰ KIỆN 309: PUBLISHED -> Hủy Sự kiện Khẩn cấp (EMERGENCY CANCEL - UC-EVT-03.AC.5, TC-EVT-03.02)
            // =========================================================================
            [
                'ma_su_kien' => 309,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E (sức chứa 500)
                'ten_su_kien' => 'E2E-PKG03: Đại nhạc hội Chào đón Tân sinh viên 2026 (Test Hủy Khẩn Cấp)',
                'anh_bia' => 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop',
                'dien_gia' => 'Đoàn Hội & CLB WebDev',
                'mo_ta' => 'Sự kiện đã mở đăng ký có sinh viên giữ vé. Kiểm tra Admin thực hiện Hủy khẩn cấp -> Giải phóng phòng và hủy vé tự động không phạt no-show.',
                'lo_trinh' => json_encode([['time' => '18:00', 'title' => 'Check-in'], ['time' => '19:00', 'title' => 'Đêm nhạc hội']]),
                'doi_tuong_tham_gia' => 'Tân sinh viên K2026',
                'ngay_cong_bo' => $now->copy()->subDays(2)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->addDays(14)->setTime(18, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(14)->setTime(21, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 98, // 2 vé đã đăng ký
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 2.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // =========================================================================
            // SỰ KIỆN 310: COMPLETED -> Dashboard Phân tích Sự kiện BTC (UC-REP-01)
            // =========================================================================
            [
                'ma_su_kien' => 310,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev (Host chính)
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'E2E-PKG03: Tổng kết Cuộc thi UIT DevFest 2026 (Dữ liệu Dashboard Báo Cáo)',
                'anh_bia' => 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Giám khảo & Cố vấn Doanh nghiệp',
                'mo_ta' => 'Sự kiện đã hoàn tất có đầy đủ số liệu show-up (60/80 = 75%), check-out (50 vé), no-show (20 vé), phân bổ khoa và feedback để test Dashboard.',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Chung kết'], ['time' => '11:00', 'title' => 'Trao giải']]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(10)->format('Y-m-d H:i:s'),
                'thoi_gian_bat_dau' => $now->copy()->subDays(3)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->subDays(3)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => $now->copy()->subDays(3)->setTime(11, 35, 0)->format('Y-m-d H:i:s'),
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 20,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => $now->copy()->subDays(3)->setTime(7, 45, 0)->format('Y-m-d H:i:s'),
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 1,
                'thoi_gian_chot_drl' => $now->copy()->subDays(2)->format('Y-m-d H:i:s'),
                'thoi_gian_tao' => $now->copy()->subDays(10),
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        DB::table('su_kien')->insert($events);
        $this->command->info('-> Đã tạo thành công 10 sự kiện (301..310).');

        // -------------------------------------------------------------------------
        // 4. THIẾT LẬP LỜI MỜI ĐỒNG TỔ CHỨC (su_kien_dong_to_chuc)
        // -------------------------------------------------------------------------
        $cohosts = [
            // Sự kiện 301: Đang ở DRAFT, đã mời CLB AI (ID: 10)
            [
                'ma_su_kien' => 301,
                'ma_don_vi_to_chuc' => 10, // CLB AI Club
                'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
                'thoi_gian_phan_hoi' => null,
                'ghi_chu_tu_choi' => null,
                'thoi_gian_tao' => $now,
            ],
            // Sự kiện 302: Chờ Co-host đồng ý (CLB AI - ID: 10)
            [
                'ma_su_kien' => 302,
                'ma_don_vi_to_chuc' => 10,
                'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
                'thoi_gian_phan_hoi' => null,
                'ghi_chu_tu_choi' => null,
                'thoi_gian_tao' => $now,
            ],
            // Sự kiện 303: Chờ Co-host từ chối (CLB AI - ID: 10)
            [
                'ma_su_kien' => 303,
                'ma_don_vi_to_chuc' => 10,
                'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
                'thoi_gian_phan_hoi' => null,
                'ghi_chu_tu_choi' => null,
                'thoi_gian_tao' => $now,
            ],
            // Sự kiện 310: Co-host Khoa HTTT (ID: 1) đã Đồng ý tham gia
            [
                'ma_su_kien' => 310,
                'ma_don_vi_to_chuc' => 1,
                'trang_thai_xac_nhan' => 'DONG_Y',
                'thoi_gian_phan_hoi' => $now->copy()->subDays(8),
                'ghi_chu_tu_choi' => null,
                'thoi_gian_tao' => $now->copy()->subDays(10),
            ],
        ];

        DB::table('su_kien_dong_to_chuc')->insert($cohosts);
        $this->command->info('-> Đã thiết lập các lời mời đồng tổ chức.');

        // -------------------------------------------------------------------------
        // 5. THIẾT LẬP ĐẶT PHÒNG HỘI TRƯỜNG (dat_phong - PENDING, CONFIRMED, Soft Hold 48h)
        // -------------------------------------------------------------------------
        $bookings = [
            // Sự kiện 302: Soft Hold 48h (Hội trường A, ma_phong = 2)
            [
                'ma_phong' => 2,
                'ma_su_kien' => 302,
                'thoi_gian_bat_dau' => $now->copy()->addDays(6)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(6)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => $now->copy()->addHours(48)->format('Y-m-d H:i:s'), // Soft Hold 48h!
                'ghi_chu' => 'Giữ chỗ tạm 48h chờ Co-host CLB AI xác nhận',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 303: Soft Hold 48h (Phòng C109, ma_phong = 3)
            [
                'ma_phong' => 3,
                'ma_su_kien' => 303,
                'thoi_gian_bat_dau' => $now->copy()->addDays(7)->setTime(13, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(7)->setTime(16, 30, 0)->format('Y-m-d H:i:s'),
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => $now->copy()->addHours(48)->format('Y-m-d H:i:s'),
                'ghi_chu' => 'Giữ chỗ tạm 48h chờ Co-host phản hồi',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 304: PENDING chờ Khoa duyệt (Phòng B114, ma_phong = 4)
            [
                'ma_phong' => 4,
                'ma_su_kien' => 304,
                'thoi_gian_bat_dau' => $now->copy()->addDays(8)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(8)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Chờ Cấp Khoa HTTT thẩm định',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 305: PENDING chờ Khoa duyệt (Hội trường E, ma_phong = 1)
            [
                'ma_phong' => 1,
                'ma_su_kien' => 305,
                'thoi_gian_bat_dau' => $now->copy()->addDays(9)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(9)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Chờ Khoa HTTT thông qua và P.CTSV duyệt',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 306: PENDING chờ Admin duyệt thay (Hội trường A, ma_phong = 2)
            [
                'ma_phong' => 2,
                'ma_su_kien' => 306,
                'thoi_gian_bat_dau' => $now->copy()->addDays(10)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(10)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Chờ Admin duyệt thay cấp Khoa',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 307: PENDING chờ từ chối (Phòng C109, ma_phong = 3)
            [
                'ma_phong' => 3,
                'ma_su_kien' => 307,
                'thoi_gian_bat_dau' => $now->copy()->addDays(11)->setTime(13, 30, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(11)->setTime(16, 30, 0)->format('Y-m-d H:i:s'),
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Chờ thẩm định',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 308: APPROVED & CONFIRMED phòng (Hội trường A, ma_phong = 2)
            [
                'ma_phong' => 2,
                'ma_su_kien' => 308,
                'thoi_gian_bat_dau' => $now->copy()->addDays(12)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(12)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'trang_thai' => 'CONFIRMED',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Đã duyệt chính thức cấp phòng',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 309: PUBLISHED & CONFIRMED phòng (Hội trường E, ma_phong = 1)
            [
                'ma_phong' => 1,
                'ma_su_kien' => 309,
                'thoi_gian_bat_dau' => $now->copy()->addDays(14)->setTime(18, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(14)->setTime(21, 30, 0)->format('Y-m-d H:i:s'),
                'trang_thai' => 'CONFIRMED',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Đã xác nhận phòng Hội trường E',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 310: COMPLETED & CONFIRMED phòng (Hội trường E, ma_phong = 1)
            [
                'ma_phong' => 1,
                'ma_su_kien' => 310,
                'thoi_gian_bat_dau' => $now->copy()->subDays(3)->setTime(8, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->subDays(3)->setTime(11, 30, 0)->format('Y-m-d H:i:s'),
                'trang_thai' => 'CONFIRMED',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Sự kiện đã diễn ra hoàn tất',
                'thoi_gian_tao' => $now->copy()->subDays(10),
                'thoi_gian_cap_nhat' => $now->copy()->subDays(3),
            ],
        ];

        DB::table('dat_phong')->insert($bookings);
        $this->command->info('-> Đã tạo các bản ghi đặt phòng (Soft Hold 48h, PENDING, CONFIRMED).');

        // -------------------------------------------------------------------------
        // 6. THIẾT LẬP VÉ ĐĂNG KÝ (DANG_KY) & DỮ LIỆU BÁO CÁO (UC-REP-01 & SỰ KIỆN 309)
        // -------------------------------------------------------------------------

        // 6.1 Vé cho sự kiện 309 (để test Hủy khẩn cấp hủy vé)
        $sk309Tickets = [
            [
                'ma_tai_khoan' => $studentIds[0],
                'ma_su_kien' => 309,
                'ma_ve_uuid' => (string) Str::uuid(),
                'chu_ky_hmac' => hash_hmac('sha256', "309:{$studentIds[0]}", 'ceh_secret_key'),
                'trang_thai' => 'DaDangKy',
                'thoi_gian_dang_ky' => $now->copy()->subHours(5),
                'da_check_in' => 0,
                'da_check_out' => 0,
                'vi_pham_no_show' => 0,
            ],
            [
                'ma_tai_khoan' => $studentIds[1],
                'ma_su_kien' => 309,
                'ma_ve_uuid' => (string) Str::uuid(),
                'chu_ky_hmac' => hash_hmac('sha256', "309:{$studentIds[1]}", 'ceh_secret_key'),
                'trang_thai' => 'DaDangKy',
                'thoi_gian_dang_ky' => $now->copy()->subHours(4),
                'da_check_in' => 0,
                'da_check_out' => 0,
                'vi_pham_no_show' => 0,
            ],
        ];
        DB::table('dang_ky')->insert($sk309Tickets);

        // 6.2 Vé cho sự kiện 310 (UC-REP-01: Phân tích Show-up, No-show, Feedback, Khung giờ)
        // Tạo thêm một số sinh viên ảo đa dạng theo các khoa để vẽ Pie Chart & Line Chart chuẩn xác
        $extraStudents = [];
        $departments = [
            1 => 'Khoa Hệ thống Thông tin',
            2 => 'Khoa Khoa học Máy tính',
            3 => 'Khoa Kỹ thuật Máy tính',
            4 => 'Khoa Mạng máy tính và Truyền thông',
        ];

        // Tạo 40 sinh viên Khoa 1 (HTTT), 20 sinh viên Khoa 2 (KHMT), 10 sinh viên Khoa 3 (KTMT), 10 sinh viên Khoa 4 (MMT) = 80 vé
        $distribution = [
            1 => 40,
            2 => 20,
            3 => 10,
            4 => 10,
        ];

        $sk310Tickets = [];
        $event310Date = $now->copy()->subDays(3);
        $ticketIndex = 1;

        foreach ($distribution as $deptId => $count) {
            for ($i = 1; $i <= $count; $i++) {
                $fakeMssv = sprintf('2352%d%03d', $deptId, $i);
                $fakeEmail = sprintf('%s@gm.uit.edu.vn', $fakeMssv);

                // Insert or ignore account
                $acc = DB::table('tai_khoan')->where('mssv', $fakeMssv)->first();
                if (! $acc) {
                    $accId = DB::table('tai_khoan')->insertGetId([
                        'email' => $fakeEmail,
                        'mssv' => $fakeMssv,
                        'ho_ten' => sprintf('Sinh viên %s %02d', $departments[$deptId], $i),
                        'mat_khau' => $hashedStudentPassword,
                        'so_dien_thoai' => '0912345678',
                        'ma_khoa' => $deptId,
                        'khoa' => $departments[$deptId],
                        'lop_sinh_hoat' => 'K2023',
                        'avatar_url' => null,
                        'loai_tai_khoan' => 'SinhVien',
                        'ma_don_vi_to_chuc' => null,
                        'dong_y_nghi_dinh_13' => 1,
                        'thoi_gian_dong_y_nd13' => $now,
                        'buoc_doi_mat_khau' => 0,
                        'hoat_dong' => 1,
                        'thoi_gian_tao' => $now,
                        'thoi_gian_cap_nhat' => $now,
                    ]);
                } else {
                    $accId = $acc->ma_tai_khoan;
                }

                // Phân bổ trạng thái:
                // Vé 1..50: Đã check-in & check-out trọn vẹn (tham_gia_tron_ven = 1, ti_le_drl = 1.0)
                // Vé 51..60: Đã check-in nhưng không check-out (da_check_out = 0, ti_le_drl = 0.0)
                // Vé 61..80: No-show (không tham dự, da_check_in = 0, da_check_out = 0, vi_pham_no_show = 1)
                $daCheckIn = ($ticketIndex <= 60) ? 1 : 0;
                $daCheckOut = ($ticketIndex <= 50) ? 1 : 0;
                $noShow = ($ticketIndex > 60) ? 1 : 0;
                $trangThai = $daCheckOut ? 'DaCheckOut' : ($daCheckIn ? 'DaCheckIn' : 'DaDangKy');

                // Khung giờ check-in: 07:45 - 08:30 (các mốc 15 phút)
                $checkInTime = null;
                if ($daCheckIn) {
                    $minOffset = ($ticketIndex % 4) * 15; // 0, 15, 30, 45 phút
                    $checkInTime = $event310Date->copy()->setTime(7, 45, 0)->addMinutes($minOffset)->format('Y-m-d H:i:s');
                }

                // Khung giờ check-out: 11:00 - 11:35
                $checkOutTime = null;
                if ($daCheckOut) {
                    $minOffset = ($ticketIndex % 3) * 15; // 0, 15, 30 phút
                    $checkOutTime = $event310Date->copy()->setTime(11, 0, 0)->addMinutes($minOffset)->format('Y-m-d H:i:s');
                }

                $daFeedback = ($ticketIndex <= 30) ? 1 : 0;
                $duDieuKienDrl = ($daCheckOut && $daFeedback) ? 1 : 0;

                $ticketId = DB::table('dang_ky')->insertGetId([
                    'ma_tai_khoan' => $accId,
                    'ma_su_kien' => 310,
                    'ma_ve_uuid' => (string) Str::uuid(),
                    'chu_ky_hmac' => hash_hmac('sha256', "310:{$accId}", 'ceh_secret_key'),
                    'trang_thai' => $trangThai,
                    'thoi_gian_dang_ky' => $event310Date->copy()->subDays(5)->setTime(9, 0, 0),
                    'thoi_gian_check_in' => $checkInTime,
                    'thoi_gian_check_out' => $checkOutTime,
                    'da_check_in' => $daCheckIn,
                    'da_check_out' => $daCheckOut,
                    'tham_gia_tron_ven' => $daCheckOut ? 1 : 0,
                    'tham_gia_mot_phan' => 0,
                    'ti_le_drl' => $daCheckOut ? 1.0 : 0.0,
                    'da_feedback' => $daFeedback,
                    'vi_pham_no_show' => $noShow,
                    'du_dieu_kien_drl' => $duDieuKienDrl,
                ]);

                // Tạo 30 bản ghi đánh giá feedback ẩn danh cho các vé 1..30
                if ($ticketIndex <= 30) {
                    DB::table('danh_gia_feedback')->insert([
                        'ma_dang_ky' => $ticketId,
                        'ma_su_kien' => 310,
                        'diem_noi_dung' => ($ticketIndex % 2 === 0) ? 5 : 4,
                        'diem_dien_gia' => 5,
                        'diem_to_chuc' => ($ticketIndex % 3 === 0) ? 4 : 5,
                        'y_kien_dong_gop' => 'Hội thảo rất bổ ích, diễn giả nhiệt tình và lộ trình rõ ràng!',
                        'thoi_gian_gui' => $event310Date->copy()->setTime(12, 0, 0)->addMinutes($ticketIndex),
                    ]);
                }

                $ticketIndex++;
            }
        }

        $this->command->info('-> Đã tạo 80 vé chi tiết cho sự kiện 310 (60 tham dự, 50 check-out, 20 no-show, 30 feedback).');

        // -------------------------------------------------------------------------
        // 7. THIẾT LẬP NHẬT KÝ KIỂM DUYỆT (nhat_ky_kiem_duyet)
        // -------------------------------------------------------------------------
        $auditLogs = [
            [
                'ma_su_kien' => 302,
                'ma_dang_ky' => null,
                'ma_tai_khoan_muc_tieu' => null,
                'nguoi_thuc_hien' => DB::table('tai_khoan')->where('email', 'clb.webdev@uit.edu.vn')->value('ma_tai_khoan'),
                'hanh_dong' => 'SUBMIT',
                'trang_thai_truoc' => 'DRAFT',
                'trang_thai_sau' => 'WAITING_COHOST_CONFIRM',
                'ly_do' => 'Gửi đề xuất sự kiện có đơn vị đồng tổ chức (CLB AI)',
                'thoi_gian_tao' => $now->copy()->subHours(2),
            ],
            [
                'ma_su_kien' => 304,
                'ma_dang_ky' => null,
                'ma_tai_khoan_muc_tieu' => null,
                'nguoi_thuc_hien' => DB::table('tai_khoan')->where('email', 'clb.webdev@uit.edu.vn')->value('ma_tai_khoan'),
                'hanh_dong' => 'SUBMIT',
                'trang_thai_truoc' => 'DRAFT',
                'trang_thai_sau' => 'PENDING_FACULTY',
                'ly_do' => 'Gửi đề xuất trực tiếp lên Khoa HTTT phê duyệt',
                'thoi_gian_tao' => $now->copy()->subHours(3),
            ],
            [
                'ma_su_kien' => 308,
                'ma_dang_ky' => null,
                'ma_tai_khoan_muc_tieu' => null,
                'nguoi_thuc_hien' => DB::table('tai_khoan')->where('email', 'admin@uit.edu.vn')->value('ma_tai_khoan'),
                'hanh_dong' => 'APPROVE_ADMIN',
                'trang_thai_truoc' => 'PENDING_ADMIN',
                'trang_thai_sau' => 'APPROVED',
                'ly_do' => 'Phê duyệt chính thức nội dung và cấp phòng Hội trường A',
                'thoi_gian_tao' => $now->copy()->subHours(10),
            ],
        ];

        DB::table('nhat_ky_kiem_duyet')->insert($auditLogs);
        $this->command->info('-> Đã khởi tạo nhật ký kiểm duyệt kiểm toán ban đầu.');

        $this->command->info('==============================================================================');
        $this->command->info('=== THIẾT LẬP HOÀN TẤT! DỮ LIỆU UAT GÓI SỐ 3 ĐÃ SẴN SÀNG ĐỂ KIỂM THỬ       ===');
        $this->command->info('==============================================================================');
    }
}
