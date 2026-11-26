<?php

namespace Database\Seeders;

use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class E2ERepNotifSysFixtureSeeder extends Seeder
{
    /**
     * Run the database seeds for E2E Fixtures:
     * - UC-REP-01: Phân tích chỉ số hiệu quả sự kiện dành cho Ban Tổ chức (Bình thường & Ngoại lệ 403 Forbidden)
     * - UC-REP-02: Dashboard Báo cáo Chiến lược Vĩ mô Toàn trường (Macro BI) & Danh sách Vi phạm No-show
     * - UC-NOTIF-01: Trung tâm Thông báo Hệ thống (Hàng đợi Nhắc hẹn 24h & Giao diện Chuông In-App)
     * - UC-SYS-01: Vận hành Tự động Hệ thống (Chuyển đổi Vòng đời, Quét No-show an toàn & Gom số liệu hàng ngày)
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $cryptoService = app(CryptoService::class);

        $this->command->info('==============================================================================');
        $this->command->info('=== BẮT ĐẦU THIẾT LẬP E2E FIXTURES (UC-REP-01, REP-02, NOTIF-01, SYS-01)   ===');
        $this->command->info('==============================================================================');

        // -------------------------------------------------------------------------
        // 1. TÀI KHOẢN NGƯỜI DÙNG (Admin, ToChuc HTTT, ToChuc WebDev, SinhVien 1..5)
        // -------------------------------------------------------------------------
        $accounts = [
            // 1.1 Quản trị viên Toàn trường (P.CTSV)
            [
                'email' => 'admin@uit.edu.vn',
                'mssv' => null,
                'ho_ten' => 'Quản trị viên Hệ thống (P.CTSV)',
                'mat_khau' => Hash::make('Admin@123', $passwordCost),
                'so_dien_thoai' => '02837252002',
                'ma_khoa' => null,
                'khoa' => null,
                'lop_sinh_hoat' => null,
                'loai_tai_khoan' => 'Admin',
                'ma_don_vi_to_chuc' => 7, // Phòng CTSV
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.2 Ban Tổ chức Khoa Hệ thống Thông tin (Host Sự kiện A)
            [
                'email' => 'tochuc.httt@uit.edu.vn',
                'mssv' => null,
                'ho_ten' => 'Ban Tổ chức Khoa Hệ thống Thông tin',
                'mat_khau' => Hash::make('Organizer@123', $passwordCost),
                'so_dien_thoai' => '0901234567',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => null,
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.3 Ban Chủ nhiệm CLB WebDev UIT (Host Sự kiện B)
            [
                'email' => 'tochuc.webdev@uit.edu.vn',
                'mssv' => null,
                'ho_ten' => 'Ban Chủ nhiệm CLB WebDev UIT',
                'mat_khau' => Hash::make('Organizer@123', $passwordCost),
                'so_dien_thoai' => '0907654321',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => null,
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 9, // CLB WebDev UIT
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.4 Sinh viên 1: Người dùng mục tiêu cho UC-NOTIF-01 & UC-REP-01
            [
                'email' => 'sinhvien1@gm.uit.edu.vn',
                'mssv' => '22521101',
                'ho_ten' => 'Nguyễn Sinh Viên Một (E2E Lead SV)',
                'mat_khau' => Hash::make('Student@123', $passwordCost),
                'so_dien_thoai' => '0912111001',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.5 Sinh viên 2: Người dùng tham dự check-in / check-out
            [
                'email' => 'sinhvien2@gm.uit.edu.vn',
                'mssv' => '22521102',
                'ho_ten' => 'Trần Sinh Viên Hai (E2E Checkin)',
                'mat_khau' => Hash::make('Student@123', $passwordCost),
                'so_dien_thoai' => '0912111002',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.6 Sinh viên 3: Người dùng nộp feedback
            [
                'email' => 'sinhvien3@gm.uit.edu.vn',
                'mssv' => '22521103',
                'ho_ten' => 'Lê Sinh Viên Ba (E2E Feedback)',
                'mat_khau' => Hash::make('Student@123', $passwordCost),
                'so_dien_thoai' => '0912111003',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.7 Sinh viên 4: Người dùng đăng ký nhưng chưa check-in
            [
                'email' => 'sinhvien4@gm.uit.edu.vn',
                'mssv' => '22521104',
                'ho_ten' => 'Phạm Sinh Viên Bốn (E2E Registered)',
                'mat_khau' => Hash::make('Student@123', $passwordCost),
                'so_dien_thoai' => '0912111004',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.8 Sinh viên 5: Người dùng mục tiêu vi phạm No-show cho lệnh ScanNoShow
            [
                'email' => 'sinhvien5@gm.uit.edu.vn',
                'mssv' => '22521105',
                'ho_ten' => 'Hoàng Sinh Viên Năm (E2E No-show Target)',
                'mat_khau' => Hash::make('Student@123', $passwordCost),
                'so_dien_thoai' => '0912111005',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
        ];

        $userMap = [];
        foreach ($accounts as $acc) {
            DB::table('tai_khoan')->updateOrInsert(
                ['email' => $acc['email']],
                array_merge($acc, [
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ])
            );

            $user = DB::table('tai_khoan')->where('email', $acc['email'])->first();
            $userMap[$acc['email']] = $user;

            $this->command->info(sprintf(
                '  -> [User] ID: %3d | MSSV: %-8s | Email: %-26s | Quyền: %s',
                $user->ma_tai_khoan,
                $user->mssv ?? 'N/A',
                $user->email,
                $user->loai_tai_khoan
            ));
        }

        // -------------------------------------------------------------------------
        // 2. DỌN DẸP DỮ LIỆU CŨ CỦA FIXTURE (IDEMPOTENCY GUARANTEE)
        // -------------------------------------------------------------------------
        $fixtureEventIds = [4101, 4102, 4103, 4104, 4105, 4106, 4107, 4108];
        $fixtureTicketIds = [
            410101, 410102, 410103, 410104,
            410201, 410202,
            410301,
            410801, 410802,
        ];

        $targetUserIds = collect($userMap)->pluck('ma_tai_khoan')->all();

        // Xóa sạch thông báo cũ của các tài khoản fixture
        DB::table('thong_bao')->whereIn('ma_tai_khoan', $targetUserIds)->delete();

        // Xóa con của các vé fixture
        DB::table('chung_nhan')->whereIn('ma_dang_ky', $fixtureTicketIds)->delete();
        DB::table('danh_gia_feedback')->whereIn('ma_dang_ky', $fixtureTicketIds)->delete();
        DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $fixtureTicketIds)->delete();
        DB::table('dang_ky')->whereIn('ma_dang_ky', $fixtureTicketIds)->delete();

        // Xóa vé phát sinh nếu có thuộc về fixtureEventIds
        $extraTicketIds = DB::table('dang_ky')->whereIn('ma_su_kien', $fixtureEventIds)->pluck('ma_dang_ky');
        if ($extraTicketIds->isNotEmpty()) {
            DB::table('chung_nhan')->whereIn('ma_dang_ky', $extraTicketIds)->delete();
            DB::table('danh_gia_feedback')->whereIn('ma_dang_ky', $extraTicketIds)->delete();
            DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $extraTicketIds)->delete();
            DB::table('dang_ky')->whereIn('ma_dang_ky', $extraTicketIds)->delete();
        }

        // Xóa các bảng con thuộc về sự kiện fixture
        DB::table('nhat_ky_kiem_duyet')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('nhan_vien_check_in')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('phien_kiosk')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('hang_doi_waitlist')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien_dong_to_chuc')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('thong_ke_su_kien_ngay')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('dat_phong')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien')->whereIn('ma_su_kien', $fixtureEventIds)->delete();

        $this->command->info('  -> Đã làm sạch toàn bộ dữ liệu con và sự kiện fixture cũ (4101..4108).');

        // -------------------------------------------------------------------------
        // 3. THIẾT LẬP CÁC SỰ KIỆN MỤC TIÊU CHO TỪNG USE CASE
        // -------------------------------------------------------------------------
        // Mốc thời gian tương đối
        $timeEventAStart = $now->copy()->subDays(2)->setTime(8, 0, 0);
        $timeEventAEnd = $now->copy()->subDays(2)->setTime(11, 30, 0);

        $timeEventBStart = $now->copy()->subDays(3)->setTime(13, 30, 0);
        $timeEventBEnd = $now->copy()->subDays(3)->setTime(17, 0, 0);

        $timeEventCStart = $now->copy()->addHours(12);
        $timeEventCEnd = $now->copy()->addHours(15);

        $timeEventD1Start = $now->copy()->subMinutes(10);
        $timeEventD1End = $now->copy()->addHours(2);

        $timeEventD2Start = $now->copy()->addDays(2);
        $timeEventD2End = $now->copy()->addDays(2)->addHours(3);

        $timeEventD3Start = $now->copy()->subMinutes(20);
        $timeEventD3End = $now->copy()->addHours(2);

        $timeEventD4Start = $now->copy()->subHours(3);
        $timeEventD4End = $now->copy()->subMinutes(30);

        $timeEventEStart = $now->copy()->subHours(5);
        $timeEventEEnd = $now->copy()->subHours(2)->subMinutes(30);

        $eventsConfig = [
            // Event A (4101): UC-REP-01 Analytics Normal Flow (Khoa HTTT)
            [
                'ma_su_kien' => 4101,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 1,          // Hội trường E
                'ten_su_kien' => 'E2E-REP-01: Hội thảo Khoa học Dữ liệu và AI trong Doanh nghiệp (Sự kiện A)',
                'anh_bia' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
                'dien_gia' => 'TS. Nguyễn Văn Giảng Viên & Chuyên gia AI FPT',
                'mo_ta' => 'Sự kiện hoàn thành đầy đủ dữ liệu check-in, check-out, chưa check-in và phản hồi feedback phục vụ kiểm thử dashboard phân tích chỉ số BTC (UC-REP-01).',
                'lo_trinh' => json_encode([
                    ['time' => '08:00', 'title' => 'Khai mạc & Check-in'],
                    ['time' => '11:15', 'title' => 'Bế mạc & Check-out'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $timeEventAStart->copy()->subDays(7),
                'thoi_gian_bat_dau' => $timeEventAStart,
                'thoi_gian_ket_thuc' => $timeEventAEnd,
                'thoi_gian_ket_thuc_thuc_te' => $timeEventAEnd,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 96,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 1,
                'thoi_gian_mo_cong_check_in' => $timeEventAStart->copy()->subMinutes(30),
                'cong_check_out_mo' => 1,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'room_status' => 'CONFIRMED',
            ],
            // Event B (4102): UC-REP-01 Analytics Exception 403 Forbidden (CLB WebDev sở hữu)
            [
                'ma_su_kien' => 4102,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 2,          // Hội trường A
                'ten_su_kien' => 'E2E-REP-01: Workshop Next.js 15 và Server Actions (Sự kiện B - CLB WebDev)',
                'anh_bia' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Kỹ thuật CLB WebDev',
                'mo_ta' => 'Sự kiện thuộc sở hữu của CLB WebDev nhằm kiểm thử phân quyền: Ban tổ chức Khoa HTTT không được phép truy cập xem phân tích và nhận mã lỗi 403 Forbidden.',
                'lo_trinh' => json_encode([
                    ['time' => '13:30', 'title' => 'Giới thiệu Next.js 15'],
                    ['time' => '17:00', 'title' => 'Tổng kết & Q&A'],
                ]),
                'doi_tuong_tham_gia' => 'Thành viên CLB và Sinh viên yêu thích Web',
                'ngay_cong_bo' => $timeEventBStart->copy()->subDays(5),
                'thoi_gian_bat_dau' => $timeEventBStart,
                'thoi_gian_ket_thuc' => $timeEventBEnd,
                'thoi_gian_ket_thuc_thuc_te' => $timeEventBEnd,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 80,
                'so_ve_con_lai' => 78,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 1,
                'thoi_gian_mo_cong_check_in' => $timeEventBStart->copy()->subMinutes(30),
                'cong_check_out_mo' => 1,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'room_status' => 'CONFIRMED',
            ],
            // Event C (4103): UC-NOTIF-01 & UC-SYS-01 Upcoming 24h Reminder Candidate
            [
                'ma_su_kien' => 4103,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 1,          // Hội trường E
                'ten_su_kien' => 'E2E-NOTIF-01: Hội thảo Điện toán Đám mây AWS & Kubernetes (Sự kiện C - Bắt đầu sau 12h)',
                'anh_bia' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
                'dien_gia' => 'AWS Certified Solutions Architect',
                'mo_ta' => 'Sự kiện xuất bản bắt đầu trong 12 giờ tới, có vé trạng thái DaDangKy của sinhvien1@gm.uit.edu.vn với da_gui_nhac_nho = 0 phục vụ kiểm thử gửi nhắc hẹn và chuông thông báo.',
                'lo_trinh' => json_encode([
                    ['time' => '08:00', 'title' => 'Check-in đón khách'],
                    ['time' => '11:00', 'title' => 'Bế mạc'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $timeEventCStart,
                'thoi_gian_ket_thuc' => $timeEventCEnd,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 99,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'room_status' => 'CONFIRMED',
            ],
            // Event D1 (4104): UC-SYS-01 Lifecycle Transition 1 (Auto-reject expired proposal: PENDING_FACULTY)
            [
                'ma_su_kien' => 4104,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 3,          // Phòng C109
                'ten_su_kien' => 'E2E-SYS-01: Đề xuất Workshop Kỹ năng IT (Hết hạn duyệt - Quá giờ bắt đầu)',
                'anh_bia' => 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
                'dien_gia' => 'Giảng viên hướng dẫn CLB',
                'mo_ta' => 'Đề xuất sự kiện vẫn ở trạng thái PENDING_FACULTY khi thời gian bắt đầu đã qua (NOW - 10m). Lệnh ceh:transition-events sẽ tự động từ chối đề xuất này.',
                'lo_trinh' => json_encode([['time' => '10:00', 'title' => 'Workshop']]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(5),
                'thoi_gian_bat_dau' => $timeEventD1Start,
                'thoi_gian_ket_thuc' => $timeEventD1End,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 50,
                'so_ve_con_lai' => 50,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 2,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PENDING_FACULTY',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'room_status' => 'PENDING',
            ],
            // Event D2 (4105): UC-SYS-01 Lifecycle Transition 2 (APPROVED -> PUBLISHED)
            [
                'ma_su_kien' => 4105,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 2,      // Học thuật
                'ma_phong' => 4,          // Phòng B114
                'ten_su_kien' => 'E2E-SYS-01: Hội thảo NCKH Sinh viên HTTT 2026 (APPROVED chờ PUBLISHED)',
                'anh_bia' => 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop',
                'dien_gia' => 'Hội đồng Khoa học Khoa HTTT',
                'mo_ta' => 'Sự kiện đã được duyệt (APPROVED), ngày công bố ở quá khứ (NOW - 2h). Lệnh ceh:transition-events sẽ chuyển trạng thái sang PUBLISHED.',
                'lo_trinh' => json_encode([['time' => '08:30', 'title' => 'Báo cáo đề tài']]),
                'doi_tuong_tham_gia' => 'Sinh viên nghiên cứu khoa học',
                'ngay_cong_bo' => $now->copy()->subHours(2),
                'thoi_gian_bat_dau' => $timeEventD2Start,
                'thoi_gian_ket_thuc' => $timeEventD2End,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 60,
                'so_ve_con_lai' => 60,
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
                'room_status' => 'CONFIRMED',
            ],
            // Event D3 (4106): UC-SYS-01 Lifecycle Transition 3 (PUBLISHED -> HAPPENING)
            [
                'ma_su_kien' => 4106,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 3,      // Kỹ năng mềm
                'ma_phong' => 2,          // Hội trường A
                'ten_su_kien' => 'E2E-SYS-01: Talkshow Kỹ năng Phỏng vấn Doanh nghiệp (PUBLISHED chờ HAPPENING)',
                'anh_bia' => 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop',
                'dien_gia' => 'Giám đốc Nhân sự Tập đoàn Công nghệ',
                'mo_ta' => 'Sự kiện ở trạng thái PUBLISHED và đã đến giờ bắt đầu (NOW - 20m). Lệnh ceh:transition-events sẽ tự động chuyển sang HAPPENING.',
                'lo_trinh' => json_encode([['time' => '14:00', 'title' => 'Chia sẻ kỹ năng']]),
                'doi_tuong_tham_gia' => 'Sinh viên năm 3, 4',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => $timeEventD3Start,
                'thoi_gian_ket_thuc' => $timeEventD3End,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 70,
                'so_ve_con_lai' => 70,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'room_status' => 'CONFIRMED',
            ],
            // Event D4 (4107): UC-SYS-01 Lifecycle Transition 4 (HAPPENING -> COMPLETED)
            [
                'ma_su_kien' => 4107,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 1,          // Hội trường E
                'ten_su_kien' => 'E2E-SYS-01: Lễ Tổng kết Cuộc thi Ý tưởng Công nghệ (HAPPENING chờ COMPLETED)',
                'anh_bia' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Giám hiệu & Đại diện Khoa HTTT',
                'mo_ta' => 'Sự kiện ở trạng thái HAPPENING và đã kết thúc quá 15 phút (NOW - 30m). Lệnh ceh:transition-events sẽ chuyển sang COMPLETED.',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Trao giải']]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(4),
                'thoi_gian_bat_dau' => $timeEventD4Start,
                'thoi_gian_ket_thuc' => $timeEventD4End,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 80,
                'so_ve_con_lai' => 80,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'HAPPENING',
                'cong_check_in_mo' => 1,
                'thoi_gian_mo_cong_check_in' => $timeEventD4Start,
                'cong_check_out_mo' => 1,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'room_status' => 'CONFIRMED',
            ],
            // Event E (4108): UC-SYS-01 Scan No-show Candidate (COMPLETED, End > 2h ago, cong_check_in_mo = 1)
            [
                'ma_su_kien' => 4108,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 5,          // Hội trường CS2
                'ten_su_kien' => 'E2E-SYS-01: Chuyên đề Trí tuệ Nhân tạo và Ứng dụng (Quét No-show an toàn)',
                'anh_bia' => 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=400&fit=crop',
                'dien_gia' => 'TS. Trần Minh Khoa & Viện Nghiên cứu AI',
                'mo_ta' => 'Sự kiện giới hạn slot đã kết thúc quá 2 giờ (NOW - 2h30m), có bằng chứng mở cổng check-in (cong_check_in_mo = 1). Vé sinhvien5 chưa check-in sẽ được lệnh ceh:scan-no-show gắn cờ vi_pham_no_show.',
                'lo_trinh' => json_encode([['time' => '07:30', 'title' => 'Mở cổng check-in']]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(6),
                'thoi_gian_bat_dau' => $timeEventEStart,
                'thoi_gian_ket_thuc' => $timeEventEEnd,
                'thoi_gian_ket_thuc_thuc_te' => $timeEventEEnd,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 50,
                'so_ve_con_lai' => 48,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 1,
                'thoi_gian_mo_cong_check_in' => $timeEventEStart,
                'cong_check_out_mo' => 1,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'room_status' => 'CONFIRMED',
            ],
        ];

        foreach ($eventsConfig as $cfg) {
            $roomStatus = $cfg['room_status'];
            unset($cfg['room_status']);

            DB::table('su_kien')->insert(array_merge($cfg, [
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]));

            // Đặt phòng tương ứng
            DB::table('dat_phong')->insert([
                'ma_phong' => $cfg['ma_phong'],
                'ma_su_kien' => $cfg['ma_su_kien'],
                'thoi_gian_bat_dau' => $cfg['thoi_gian_bat_dau'],
                'thoi_gian_ket_thuc' => $cfg['thoi_gian_ket_thuc'],
                'trang_thai' => $roomStatus,
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Đặt phòng Fixture: '.$cfg['ten_su_kien'],
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]);

            $this->command->info(sprintf(
                '  -> [Event] ID: %4d | Trạng thái: %-15s | Bắt đầu: %s | %s',
                $cfg['ma_su_kien'],
                $cfg['trang_thai'],
                $cfg['thoi_gian_bat_dau']->format('d/m H:i'),
                $cfg['ten_su_kien']
            ));
        }

        // -------------------------------------------------------------------------
        // 4. THIẾT LẬP VÉ VÀ ĐIỂM DANH / PHẢN HỒI FEEDBACK (dang_ky & danh_gia_feedback)
        // -------------------------------------------------------------------------
        $student1 = $userMap['sinhvien1@gm.uit.edu.vn'];
        $student2 = $userMap['sinhvien2@gm.uit.edu.vn'];
        $student3 = $userMap['sinhvien3@gm.uit.edu.vn'];
        $student4 = $userMap['sinhvien4@gm.uit.edu.vn'];
        $student5 = $userMap['sinhvien5@gm.uit.edu.vn'];

        $ticketsData = [
            // --- Sự kiện A (4101 - UC-REP-01) ---
            // 4.1 Vé A1: SV1 - DaCheckOut + Feedback (5 sao toàn diện)
            [
                'ma_dang_ky' => 410101,
                'ma_su_kien' => 4101,
                'user' => $student1,
                'uuid' => '41010100-0000-4000-8000-000000410101',
                'trang_thai' => 'DaCheckOut',
                'da_check_in' => 1,
                'da_check_out' => 1,
                'thoi_gian_check_in' => $timeEventAStart->copy()->addMinutes(10),
                'thoi_gian_check_out' => $timeEventAEnd->copy()->subMinutes(10),
                'tham_gia_tron_ven' => 1,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 1.00,
                'da_feedback' => 1,
                'du_dieu_kien_drl' => 1,
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 1,
                'feedback' => [
                    'id' => 410101,
                    'diem_noi_dung' => 5,
                    'diem_dien_gia' => 5,
                    'diem_to_chuc' => 5,
                    'y_kien_dong_gop' => 'Hội thảo rất bổ ích, diễn giả nhiệt tình và giải đáp cặn kẽ mọi thắc mắc!',
                ],
            ],
            // 4.2 Vé A2: SV2 - DaCheckIn (chưa check out)
            [
                'ma_dang_ky' => 410102,
                'ma_su_kien' => 4101,
                'user' => $student2,
                'uuid' => '41010200-0000-4000-8000-000000410102',
                'trang_thai' => 'DaCheckIn',
                'da_check_in' => 1,
                'da_check_out' => 0,
                'thoi_gian_check_in' => $timeEventAStart->copy()->addMinutes(25),
                'thoi_gian_check_out' => null,
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 0.00,
                'da_feedback' => 0,
                'du_dieu_kien_drl' => 0,
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 1,
                'feedback' => null,
            ],
            // 4.3 Vé A3: SV3 - DaCheckOut + Feedback (4 sao)
            [
                'ma_dang_ky' => 410103,
                'ma_su_kien' => 4101,
                'user' => $student3,
                'uuid' => '41010300-0000-4000-8000-000000410103',
                'trang_thai' => 'DaCheckOut',
                'da_check_in' => 1,
                'da_check_out' => 1,
                'thoi_gian_check_in' => $timeEventAStart->copy()->addMinutes(20),
                'thoi_gian_check_out' => $timeEventAEnd->copy()->subMinutes(5),
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 1,
                'ti_le_drl' => 0.50,
                'da_feedback' => 1,
                'du_dieu_kien_drl' => 1,
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 1,
                'feedback' => [
                    'id' => 410103,
                    'diem_noi_dung' => 4,
                    'diem_dien_gia' => 4,
                    'diem_to_chuc' => 4,
                    'y_kien_dong_gop' => 'Nội dung thực tế, tuy nhiên slide hơi nhỏ ở phía cuối khán phòng.',
                ],
            ],
            // 4.4 Vé A4: SV4 - DaDangKy (chưa check-in, no-show)
            [
                'ma_dang_ky' => 410104,
                'ma_su_kien' => 4101,
                'user' => $student4,
                'uuid' => '41010400-0000-4000-8000-000000410104',
                'trang_thai' => 'DaDangKy',
                'da_check_in' => 0,
                'da_check_out' => 0,
                'thoi_gian_check_in' => null,
                'thoi_gian_check_out' => null,
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 0.00,
                'da_feedback' => 0,
                'du_dieu_kien_drl' => 0,
                'vi_pham_no_show' => 1,
                'da_gui_nhac_nho' => 1,
                'feedback' => null,
            ],

            // --- Sự kiện B (4102 - UC-REP-01 Exception 403) ---
            // 4.5 Vé B1: SV2 - DaCheckOut + Feedback
            [
                'ma_dang_ky' => 410201,
                'ma_su_kien' => 4102,
                'user' => $student2,
                'uuid' => '41020100-0000-4000-8000-000000410201',
                'trang_thai' => 'DaCheckOut',
                'da_check_in' => 1,
                'da_check_out' => 1,
                'thoi_gian_check_in' => $timeEventBStart->copy()->addMinutes(15),
                'thoi_gian_check_out' => $timeEventBEnd->copy()->subMinutes(15),
                'tham_gia_tron_ven' => 1,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 1.00,
                'da_feedback' => 1,
                'du_dieu_kien_drl' => 1,
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 1,
                'feedback' => [
                    'id' => 410201,
                    'diem_noi_dung' => 5,
                    'diem_dien_gia' => 5,
                    'diem_to_chuc' => 5,
                    'y_kien_dong_gop' => 'Workshop rất thực chiến, code demo mượt mà!',
                ],
            ],
            // 4.6 Vé B2: SV3 - DaCheckIn
            [
                'ma_dang_ky' => 410202,
                'ma_su_kien' => 4102,
                'user' => $student3,
                'uuid' => '41020200-0000-4000-8000-000000410202',
                'trang_thai' => 'DaCheckIn',
                'da_check_in' => 1,
                'da_check_out' => 0,
                'thoi_gian_check_in' => $timeEventBStart->copy()->addMinutes(10),
                'thoi_gian_check_out' => null,
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 0.00,
                'da_feedback' => 0,
                'du_dieu_kien_drl' => 0,
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 1,
                'feedback' => null,
            ],

            // --- Sự kiện C (4103 - UC-NOTIF-01 & UC-SYS-01 Upcoming Event 12h) ---
            // 4.7 Vé C1: SV1 - DaDangKy, chưa gửi nhắc nhở (da_gui_nhac_nho = 0)
            [
                'ma_dang_ky' => 410301,
                'ma_su_kien' => 4103,
                'user' => $student1,
                'uuid' => '41030100-0000-4000-8000-000000410301',
                'trang_thai' => 'DaDangKy',
                'da_check_in' => 0,
                'da_check_out' => 0,
                'thoi_gian_check_in' => null,
                'thoi_gian_check_out' => null,
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 0.00,
                'da_feedback' => 0,
                'du_dieu_kien_drl' => 0,
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 0, // CHƯA GỬI NHẮC NHỞ -> Lệnh events:send-reminders sẽ quét trúng!
                'feedback' => null,
            ],

            // --- Sự kiện E (4108 - UC-SYS-01 Scan No-show Candidate) ---
            // 4.8 Vé E1: SV2 - DaCheckIn (Chứng minh BTC có tổ chức điểm danh)
            [
                'ma_dang_ky' => 410801,
                'ma_su_kien' => 4108,
                'user' => $student2,
                'uuid' => '41080100-0000-4000-8000-000000410801',
                'trang_thai' => 'DaCheckIn',
                'da_check_in' => 1,
                'da_check_out' => 0,
                'thoi_gian_check_in' => $timeEventEStart->copy()->addMinutes(15),
                'thoi_gian_check_out' => null,
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 0.00,
                'da_feedback' => 0,
                'du_dieu_kien_drl' => 0,
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 1,
                'feedback' => null,
            ],
            // 4.9 Vé E2: SV5 - DaDangKy, chưa check-in, vi_pham_no_show = 0 -> Candidate cho lệnh ceh:scan-no-show
            [
                'ma_dang_ky' => 410802,
                'ma_su_kien' => 4108,
                'user' => $student5,
                'uuid' => '41080200-0000-4000-8000-000000410802',
                'trang_thai' => 'DaDangKy',
                'da_check_in' => 0,
                'da_check_out' => 0,
                'thoi_gian_check_in' => null,
                'thoi_gian_check_out' => null,
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 0.00,
                'da_feedback' => 0,
                'du_dieu_kien_drl' => 0,
                'vi_pham_no_show' => 0, // ĐANG = 0, lệnh ceh:scan-no-show sẽ bật lên 1!
                'da_gui_nhac_nho' => 1,
                'feedback' => null,
            ],
        ];

        foreach ($ticketsData as $tData) {
            $user = $tData['user'];
            $hmac = $cryptoService->signTicket($tData['uuid'], (int) $user->ma_tai_khoan, (int) $tData['ma_su_kien']);

            DB::table('dang_ky')->insert([
                'ma_dang_ky' => $tData['ma_dang_ky'],
                'ma_tai_khoan' => $user->ma_tai_khoan,
                'ma_su_kien' => $tData['ma_su_kien'],
                'ma_ve_uuid' => $tData['uuid'],
                'chu_ky_hmac' => $hmac,
                'trang_thai' => $tData['trang_thai'],
                'thoi_gian_dang_ky' => $now->copy()->subDays(5),
                'thoi_gian_check_in' => $tData['thoi_gian_check_in'],
                'thoi_gian_check_out' => $tData['thoi_gian_check_out'],
                'thoi_gian_huy' => null,
                'ly_do_huy' => null,
                'da_check_in' => $tData['da_check_in'],
                'da_check_out' => $tData['da_check_out'],
                'ma_thiet_bi_check_in' => $tData['da_check_in'] ? 'KIOSK-DEV-01' : null,
                'ma_thiet_bi_check_out' => $tData['da_check_out'] ? 'KIOSK-DEV-02' : null,
                'ma_thiet_bi_nghi_van' => null,
                'nghi_van_gian_lan' => 0,
                'tham_gia_tron_ven' => $tData['tham_gia_tron_ven'],
                'tham_gia_mot_phan' => $tData['tham_gia_mot_phan'],
                'ti_le_drl' => $tData['ti_le_drl'],
                'da_feedback' => $tData['da_feedback'],
                'han_an_han_feedback' => null,
                'du_dieu_kien_drl' => $tData['du_dieu_kien_drl'],
                'vi_pham_no_show' => $tData['vi_pham_no_show'],
                'da_gui_nhac_nho' => $tData['da_gui_nhac_nho'],
                'ghi_chu' => 'E2E Fixture Registration',
            ]);

            if ($tData['feedback'] !== null) {
                $fb = $tData['feedback'];
                DB::table('danh_gia_feedback')->insert([
                    'id' => $fb['id'],
                    'ma_dang_ky' => $tData['ma_dang_ky'],
                    'ma_su_kien' => $tData['ma_su_kien'],
                    'diem_noi_dung' => $fb['diem_noi_dung'],
                    'diem_dien_gia' => $fb['diem_dien_gia'],
                    'diem_to_chuc' => $fb['diem_to_chuc'],
                    'y_kien_dong_gop' => $fb['y_kien_dong_gop'],
                    'thoi_gian_gui' => $now->copy()->subDays(1),
                ]);
            }

            $this->command->info(sprintf(
                '  -> [Ticket] ID: %6d | Event: %4d | SV: %-22s | TT: %-11s | In: %d | Out: %d | FB: %d | NoShow: %d',
                $tData['ma_dang_ky'],
                $tData['ma_su_kien'],
                $user->email,
                $tData['trang_thai'],
                $tData['da_check_in'],
                $tData['da_check_out'],
                $tData['da_feedback'],
                $tData['vi_pham_no_show']
            ));
        }

        // -------------------------------------------------------------------------
        // 5. THIẾT LẬP DỮ LIỆU BÁO CÁO CHIẾN LƯỢC VĨ MÔ (thong_ke_su_kien_ngay - UC-REP-02)
        // -------------------------------------------------------------------------
        $statsRows = [
            // Ngày subDays(2): Sự kiện A
            [
                'ngay_thong_ke' => $now->copy()->subDays(2)->toDateString(),
                'ma_su_kien' => 4101,
                'tong_ve_phat_hanh' => 100,
                'tong_ve_dang_ky' => 4,
                'tong_luot_tham_du' => 3,
                'tong_luot_check_out' => 2,
                'tong_luot_no_show' => 1,
                'so_phut_chay_ve' => 120,
                'diem_hai_long_trung_binh' => 4.50,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Ngày subDays(3): Sự kiện B
            [
                'ngay_thong_ke' => $now->copy()->subDays(3)->toDateString(),
                'ma_su_kien' => 4102,
                'tong_ve_phat_hanh' => 80,
                'tong_ve_dang_ky' => 2,
                'tong_luot_tham_du' => 2,
                'tong_luot_check_out' => 1,
                'tong_luot_no_show' => 0,
                'so_phut_chay_ve' => 95,
                'diem_hai_long_trung_binh' => 5.00,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Ngày subDays(4): Sự kiện A tổng hợp tiếp diễn
            [
                'ngay_thong_ke' => $now->copy()->subDays(4)->toDateString(),
                'ma_su_kien' => 4101,
                'tong_ve_phat_hanh' => 100,
                'tong_ve_dang_ky' => 50,
                'tong_luot_tham_du' => 45,
                'tong_luot_check_out' => 40,
                'tong_luot_no_show' => 5,
                'so_phut_chay_ve' => 120,
                'diem_hai_long_trung_binh' => 4.70,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Ngày subDays(5): Sự kiện B tổng hợp tiếp diễn
            [
                'ngay_thong_ke' => $now->copy()->subDays(5)->toDateString(),
                'ma_su_kien' => 4102,
                'tong_ve_phat_hanh' => 80,
                'tong_ve_dang_ky' => 70,
                'tong_luot_tham_du' => 65,
                'tong_luot_check_out' => 60,
                'tong_luot_no_show' => 5,
                'so_phut_chay_ve' => 95,
                'diem_hai_long_trung_binh' => 4.80,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Ngày subDays(6): Sự kiện A
            [
                'ngay_thong_ke' => $now->copy()->subDays(6)->toDateString(),
                'ma_su_kien' => 4101,
                'tong_ve_phat_hanh' => 100,
                'tong_ve_dang_ky' => 80,
                'tong_luot_tham_du' => 75,
                'tong_luot_check_out' => 70,
                'tong_luot_no_show' => 5,
                'so_phut_chay_ve' => 120,
                'diem_hai_long_trung_binh' => 4.60,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Ngày subDays(7): Sự kiện B
            [
                'ngay_thong_ke' => $now->copy()->subDays(7)->toDateString(),
                'ma_su_kien' => 4102,
                'tong_ve_phat_hanh' => 80,
                'tong_ve_dang_ky' => 75,
                'tong_luot_tham_du' => 70,
                'tong_luot_check_out' => 68,
                'tong_luot_no_show' => 5,
                'so_phut_chay_ve' => 95,
                'diem_hai_long_trung_binh' => 4.90,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Ngày yesterday: Sự kiện A
            [
                'ngay_thong_ke' => $now->copy()->subDay()->toDateString(),
                'ma_su_kien' => 4101,
                'tong_ve_phat_hanh' => 100,
                'tong_ve_dang_ky' => 4,
                'tong_luot_tham_du' => 3,
                'tong_luot_check_out' => 2,
                'tong_luot_no_show' => 1,
                'so_phut_chay_ve' => 120,
                'diem_hai_long_trung_binh' => 4.50,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        foreach ($statsRows as $stat) {
            DB::table('thong_ke_su_kien_ngay')->insert($stat);
            $this->command->info(sprintf(
                '  -> [Macro BI] Ngày: %s | Event: %4d | Đăng ký: %2d | Tham dự: %2d | Out: %2d | No-show: %2d | Điểm TB: %.2f',
                $stat['ngay_thong_ke'],
                $stat['ma_su_kien'],
                $stat['tong_ve_dang_ky'],
                $stat['tong_luot_tham_du'],
                $stat['tong_luot_check_out'],
                $stat['tong_luot_no_show'],
                $stat['diem_hai_long_trung_binh']
            ));
        }

        // -------------------------------------------------------------------------
        // 6. THIẾT LẬP THÔNG BÁO CHO SINH VIÊN 1 (thong_bao - UC-NOTIF-01)
        // -------------------------------------------------------------------------
        $notifications = [
            // Thông báo 1: Chưa đọc (HE_THONG)
            [
                'ma_tai_khoan' => $student1->ma_tai_khoan,
                'tieu_de' => 'Chào mừng bạn đến với Campus Event Hub',
                'noi_dung' => 'Tài khoản sinh viên UIT của bạn đã được kích hoạt thành công trên cổng Campus Event Hub.',
                'loai_thong_bao' => 'HE_THONG',
                'lien_ket' => '/dashboard',
                'da_doc' => 0,
                'thoi_gian_gui' => $now->copy()->subHours(6),
            ],
            // Thông báo 2: Chưa đọc (VE_MOI)
            [
                'ma_tai_khoan' => $student1->ma_tai_khoan,
                'tieu_de' => 'Vé sự kiện mới được cấp thành công',
                'noi_dung' => 'Bạn đã đăng ký thành công vé tham dự sự kiện "E2E-NOTIF-01: Hội thảo Điện toán Đám mây AWS & Kubernetes". Mã vé của bạn đã sẵn sàng trong ví.',
                'loai_thong_bao' => 'VE_MOI',
                'lien_ket' => '/my-tickets',
                'da_doc' => 0,
                'thoi_gian_gui' => $now->copy()->subHours(3),
            ],
            // Thông báo 3: Chưa đọc (NHAC_HEN)
            [
                'ma_tai_khoan' => $student1->ma_tai_khoan,
                'tieu_de' => 'Nhắc hẹn: Hội thảo AWS & Kubernetes sắp diễn ra trong 12h',
                'noi_dung' => 'Sự kiện "Hội thảo Điện toán Đám mây AWS & Kubernetes" sẽ diễn ra lúc '.$timeEventCStart->format('H:i d/m/Y').' tại Hội trường E. Vui lòng có mặt trước 15 phút.',
                'loai_thong_bao' => 'NHAC_HEN',
                'lien_ket' => '/events/4103',
                'da_doc' => 0,
                'thoi_gian_gui' => $now->copy()->subMinutes(45),
            ],
            // Thông báo 4: Chưa đọc (DOI_PHONG_KHAN_CAP)
            [
                'ma_tai_khoan' => $student1->ma_tai_khoan,
                'tieu_de' => 'Thông báo điều chỉnh địa điểm tổ chức khẩn cấp',
                'noi_dung' => 'Sự kiện sắp tới đã được điều phối chuyển sang Hội trường E để tăng cường máy lạnh và sức chứa.',
                'loai_thong_bao' => 'DOI_PHONG_KHAN_CAP',
                'lien_ket' => '/events/4103',
                'da_doc' => 0,
                'thoi_gian_gui' => $now->copy()->subMinutes(15),
            ],
            // Thông báo 5: Đã đọc (HE_THONG)
            [
                'ma_tai_khoan' => $student1->ma_tai_khoan,
                'tieu_de' => 'Hệ thống đã nâng cấp phiên bản 3.2.3 thành công',
                'noi_dung' => 'Giao diện trung tâm thông báo và tính năng xuất dữ liệu báo cáo đã sẵn sàng sử dụng.',
                'loai_thong_bao' => 'HE_THONG',
                'lien_ket' => null,
                'da_doc' => 1,
                'thoi_gian_gui' => $now->copy()->subDays(1),
            ],
        ];

        foreach ($notifications as $notif) {
            $insertedId = DB::table('thong_bao')->insertGetId($notif);
            $this->command->info(sprintf(
                '  -> [Notification] ID: %4d | SV: %s | Đã đọc: %d | Loại: %-18s | Tiêu đề: %s',
                $insertedId,
                $student1->email,
                $notif['da_doc'],
                $notif['loai_thong_bao'],
                $notif['tieu_de']
            ));
        }

        $this->command->info('==============================================================================');
        $this->command->info('=== HOÀN TẤT THIẾT LẬP E2E FIXTURES (UC-REP-01, REP-02, NOTIF-01, SYS-01) ===');
        $this->command->info('==============================================================================');
    }
}
