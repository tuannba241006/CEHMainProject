<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class E2EEvt0102FixtureSeeder extends Seeder
{
    /**
     * Run the database seeds for E2E Test Fixtures (UC-EVT-01, UC-EVT-02).
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $hashedOrganizerPassword = Hash::make('Organizer@123', $passwordCost);

        $this->command->info('=== BẮT ĐẦU THIẾT LẬP E2E FIXTURES (UC-EVT-01, UC-EVT-02) ===');

        // -------------------------------------------------------------------------
        // 1. TÀI KHOẢN NGƯỜI DÙNG (Host A CLB WebDev, Host Cấp Khoa HTTT, P.CTSV)
        // -------------------------------------------------------------------------

        // 1.1 Host A CLB: webdev@uit.edu.vn (CLB WebDev UIT, ma_don_vi = 9, cha = 1)
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => 'webdev@uit.edu.vn'],
            [
                'mssv' => null,
                'email' => 'webdev@uit.edu.vn',
                'ho_ten' => 'Ban Chủ nhiệm CLB WebDev UIT',
                'mat_khau' => $hashedOrganizerPassword,
                'so_dien_thoai' => '0907654321',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => null,
                'avatar_url' => null,
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );
        $webdevUser = DB::table('tai_khoan')->where('email', 'webdev@uit.edu.vn')->first();
        $this->command->info(sprintf(
            "Đã cấu hình tài khoản Host A CLB: %s (ID: %d, Đơn vị: %d, pass: Organizer@123)",
            $webdevUser->email,
            $webdevUser->ma_tai_khoan,
            $webdevUser->ma_don_vi_to_chuc
        ));

        // 1.2 Host A Cấp Khoa / Co-host: httt@uit.edu.vn (Khoa HTTT, ma_don_vi = 1, cha = NULL)
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => 'httt@uit.edu.vn'],
            [
                'mssv' => null,
                'email' => 'httt@uit.edu.vn',
                'ho_ten' => 'Ban Tổ chức Khoa Hệ thống Thông tin',
                'mat_khau' => $hashedOrganizerPassword,
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
        $htttUser = DB::table('tai_khoan')->where('email', 'httt@uit.edu.vn')->first();
        $this->command->info(sprintf(
            "Đã cấu hình tài khoản Cấp Khoa / Co-host: %s (ID: %d, Đơn vị: %d, pass: Organizer@123)",
            $htttUser->email,
            $htttUser->ma_tai_khoan,
            $htttUser->ma_don_vi_to_chuc
        ));

        // 1.3 Co-host Đơn vị / Admin P.CTSV: pctsv@uit.edu.vn (P.CTSV, ma_don_vi = 7, cha = NULL)
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => 'pctsv@uit.edu.vn'],
            [
                'mssv' => null,
                'email' => 'pctsv@uit.edu.vn',
                'ho_ten' => 'Cán bộ Phòng Công tác Sinh viên',
                'mat_khau' => $hashedOrganizerPassword,
                'so_dien_thoai' => '02837252003',
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
        $pctsvUser = DB::table('tai_khoan')->where('email', 'pctsv@uit.edu.vn')->first();
        $this->command->info(sprintf(
            "Đã cấu hình tài khoản Đơn vị / Admin P.CTSV: %s (ID: %d, Đơn vị: %d, pass: Organizer@123)",
            $pctsvUser->email,
            $pctsvUser->ma_tai_khoan,
            $pctsvUser->ma_don_vi_to_chuc
        ));

        // -------------------------------------------------------------------------
        // 2. DỌN DẸP DỮ LIỆU CŨ CỦA FIXTURE (Idempotent cleanup)
        // -------------------------------------------------------------------------
        $fixtureEventIds = [801, 802, 803, 804, 805, 806];

        $oldTicketIds = DB::table('dang_ky')->whereIn('ma_su_kien', $fixtureEventIds)->pluck('ma_dang_ky');
        if ($oldTicketIds->isNotEmpty()) {
            DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('danh_gia_feedback')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('chung_nhan')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
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

        $this->command->info('Đã dọn dẹp dữ liệu cũ cho các sự kiện: ' . implode(', ', $fixtureEventIds));

        // -------------------------------------------------------------------------
        // 3. KHỞI TẠO CÁC SỰ KIỆN FIXTURE (801 - 806)
        // -------------------------------------------------------------------------
        $events = [
            // 801: Event 801 (DRAFT) - Host A CLB WebDev, Co-host Khoa HTTT, Phòng 1, Slot = 200, 08:00 - 11:30
            [
                'ma_su_kien' => 801,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E (sức chứa 500)
                'ten_su_kien' => 'E2E: Hội thảo Lập trình Web Fullstack với Next.js & Laravel (Bản nháp Có Co-host)',
                'anh_bia' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
                'dien_gia' => 'TS. Nguyễn Văn A',
                'mo_ta' => 'Bản nháp sự kiện phục vụ kiểm thử gửi đề xuất có đơn vị đồng tổ chức (UC-EVT-01, UC-EVT-02).',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Check-in & Khai mạc'], ['time' => '11:00', 'title' => 'Bế mạc']]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên UIT',
                'ngay_cong_bo' => '2026-11-20 08:00:00',
                'thoi_gian_bat_dau' => '2026-11-25 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-25 11:30:00',
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

            // 802: Event 802 (DRAFT No Co-host) - Host A CLB WebDev, Không Co-host, Phòng 1, Slot = 150, 13:30 - 16:30
            [
                'ma_su_kien' => 802,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'E2E: Workshop Lập trình Frontend Hiện đại (Bản nháp Không Co-host)',
                'anh_bia' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
                'dien_gia' => 'ThS. Trần Văn B',
                'mo_ta' => 'Bản nháp sự kiện đơn vị CLB gửi đề xuất trực tiếp chờ Cấp Khoa duyệt (UC-EVT-01, UC-EVT-02).',
                'lo_trinh' => json_encode([['time' => '13:30', 'title' => 'Check-in & Workshop'], ['time' => '16:00', 'title' => 'Tổng kết']]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT đam mê Frontend',
                'ngay_cong_bo' => '2026-11-20 08:00:00',
                'thoi_gian_bat_dau' => '2026-11-25 13:30:00',
                'thoi_gian_ket_thuc' => '2026-11-25 16:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 150,
                'so_ve_con_lai' => 150,
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

            // 803: Event 803 (DRAFT Faculty Host No Co-host) - Host Cấp Khoa HTTT, Không Co-host, Phòng 1, Slot = 250, 2026-11-27 08:00 - 11:30
            [
                'ma_su_kien' => 803,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT (ma_don_vi_cha = NULL)
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'E2E: Tọa đàm Định hướng Nghề nghiệp Hệ thống Thông tin (Khoa Host)',
                'anh_bia' => 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
                'dien_gia' => 'PGS.TS Lê Văn C',
                'mo_ta' => 'Bản nháp sự kiện do Khoa chủ trì gửi đề xuất trực tiếp chờ P.CTSV duyệt (UC-EVT-01, UC-EVT-02).',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Khai mạc & Giao lưu doanh nghiệp'], ['time' => '11:00', 'title' => 'Bế mạc']]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên Khoa HTTT',
                'ngay_cong_bo' => '2026-11-20 08:00:00',
                'thoi_gian_bat_dau' => '2026-11-27 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-27 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 250,
                'so_ve_con_lai' => 250,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 4,
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

            // 804: Event 804 (WAITING_COHOST_CONFIRM for Co-host Accept) - Host CLB WebDev, Co-host Khoa HTTT (CHO_XAC_NHAN), Phòng 2 (Hội trường A), Slot = 100, 2026-11-28
            [
                'ma_su_kien' => 804,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 2, // Hội trường A (sức chứa 300)
                'ten_su_kien' => 'E2E: Diễn đàn Công nghệ UIT Hackathon 2026 (Chờ Co-host Xác Nhận)',
                'anh_bia' => 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
                'dien_gia' => 'Chuyên gia Google Developers',
                'mo_ta' => 'Sự kiện thử nghiệm chức năng Co-host bấm Xác nhận Đồng ý (UC-EVT-02.AC.1).',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Khai mạc Hackathon'], ['time' => '11:00', 'title' => 'Trao giải chặng 1']]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT và các trường thành viên ĐHQG',
                'ngay_cong_bo' => '2026-11-20 08:00:00',
                'thoi_gian_bat_dau' => '2026-11-28 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-28 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 100,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
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

            // 805: Event 805 (WAITING_COHOST_CONFIRM for Co-host Decline) - Host CLB WebDev, Co-host Khoa HTTT (CHO_XAC_NHAN), Phòng 3 (Phòng C109), Slot = 100, 2026-11-29
            [
                'ma_su_kien' => 805,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 3, // Phòng C109 (sức chứa 150)
                'ten_su_kien' => 'E2E: Hội thảo AI & Cloud Computing 2026 (Thử nghiệm Từ chối Co-host)',
                'anh_bia' => 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
                'dien_gia' => 'Chuyên gia AWS / Microsoft',
                'mo_ta' => 'Sự kiện thử nghiệm chức năng Co-host bấm Từ chối kèm lý do >= 5 ký tự (UC-EVT-02.AC.2).',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Bắt đầu hội thảo'], ['time' => '11:00', 'title' => 'Hỏi đáp & Bế mạc']]),
                'doi_tuong_tham_gia' => 'Sinh viên ngành Hệ thống Thông tin & CNTT',
                'ngay_cong_bo' => '2026-11-20 08:00:00',
                'thoi_gian_bat_dau' => '2026-11-29 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-29 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 100,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
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

            // 806: Event 806 (PENDING_FACULTY for Withdraw Proposal) - Host CLB WebDev, Phòng 4 (Phòng B114), Slot = 80, 2026-11-30
            [
                'ma_su_kien' => 806,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 4, // Phòng B114 (sức chứa 100)
                'ten_su_kien' => 'E2E: Hội thảo Kỹ năng DevOps & CI/CD (Thử nghiệm Rút đề xuất)',
                'anh_bia' => 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&h=400&fit=crop',
                'dien_gia' => 'Kỹ sư DevOps Senior',
                'mo_ta' => 'Sự kiện thử nghiệm chức năng Host A chủ động Rút đề xuất về trạng thái DRAFT (UC-EVT-02.AC.3).',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Thực hành CI/CD pipeline'], ['time' => '11:00', 'title' => 'Tổng kết']]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => '2026-11-20 08:00:00',
                'thoi_gian_bat_dau' => '2026-11-30 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-30 11:30:00',
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
        ];

        DB::table('su_kien')->insert($events);
        $this->command->info('Đã tạo thành công 6 bản ghi sự kiện (801 - 806).');

        // -------------------------------------------------------------------------
        // 4. THIẾT LẬP CO-HOST CHO SỰ KIỆN 801, 804, 805
        // -------------------------------------------------------------------------
        $cohosts = [
            // Sự kiện 801 (DRAFT): Đã mời Khoa HTTT (ma_don_vi = 1)
            [
                'ma_su_kien' => 801,
                'ma_don_vi_to_chuc' => 1,
                'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
                'thoi_gian_phan_hoi' => null,
                'ghi_chu_tu_choi' => null,
                'thoi_gian_tao' => $now,
            ],
            // Sự kiện 804 (WAITING_COHOST_CONFIRM): Chờ Khoa HTTT xác nhận (sẽ bấm Đồng ý)
            [
                'ma_su_kien' => 804,
                'ma_don_vi_to_chuc' => 1,
                'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
                'thoi_gian_phan_hoi' => null,
                'ghi_chu_tu_choi' => null,
                'thoi_gian_tao' => $now,
            ],
            // Sự kiện 805 (WAITING_COHOST_CONFIRM): Chờ Khoa HTTT xác nhận (sẽ bấm Từ chối)
            [
                'ma_su_kien' => 805,
                'ma_don_vi_to_chuc' => 1,
                'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
                'thoi_gian_phan_hoi' => null,
                'ghi_chu_tu_choi' => null,
                'thoi_gian_tao' => $now,
            ],
        ];

        DB::table('su_kien_dong_to_chuc')->insert($cohosts);
        $this->command->info('Đã tạo 3 bản ghi lời mời đồng tổ chức cho sự kiện 801, 804, 805.');

        // -------------------------------------------------------------------------
        // 5. THIẾT LẬP ĐẶT PHÒNG (dat_phong) CHO 804, 805, 806 (PENDING)
        // -------------------------------------------------------------------------
        $softHoldDeadline = $now->copy()->addHours(48);

        $bookings = [
            // Sự kiện 804: Đặt phòng 2 (Hội trường A)
            [
                'ma_phong' => 2,
                'ma_su_kien' => 804,
                'thoi_gian_bat_dau' => '2026-11-28 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-28 11:30:00',
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => $softHoldDeadline,
                'ghi_chu' => 'Giữ chỗ Soft Hold 48h chờ Co-host đồng thuận (E2E Test 804)',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 805: Đặt phòng 3 (Phòng C109)
            [
                'ma_phong' => 3,
                'ma_su_kien' => 805,
                'thoi_gian_bat_dau' => '2026-11-29 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-29 11:30:00',
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => $softHoldDeadline,
                'ghi_chu' => 'Giữ chỗ Soft Hold 48h chờ Co-host đồng thuận (E2E Test 805)',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // Sự kiện 806: Đặt phòng 4 (Phòng B114)
            [
                'ma_phong' => 4,
                'ma_su_kien' => 806,
                'thoi_gian_bat_dau' => '2026-11-30 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-30 11:30:00',
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => $softHoldDeadline,
                'ghi_chu' => 'Giữ chỗ chờ Cấp Khoa duyệt (E2E Test 806 Rút đề xuất)',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        DB::table('dat_phong')->insert($bookings);
        $this->command->info('Đã tạo 3 bản ghi giữ phòng PENDING cho sự kiện 804, 805, 806.');

        // -------------------------------------------------------------------------
        // 6. GHI NHẬT KÝ KIỂM DUYỆT (nhat_ky_kiem_duyet) BAN ĐẦU
        // -------------------------------------------------------------------------
        $auditLogs = [
            [
                'ma_su_kien' => 804,
                'ma_dang_ky' => null,
                'ma_tai_khoan_muc_tieu' => null,
                'nguoi_thuc_hien' => $webdevUser->ma_tai_khoan,
                'hanh_dong' => 'SUBMIT',
                'trang_thai_truoc' => 'DRAFT',
                'trang_thai_sau' => 'WAITING_COHOST_CONFIRM',
                'ly_do' => 'Gửi đề xuất sự kiện kèm lời mời đồng tổ chức đến Khoa HTTT.',
                'thoi_gian_tao' => $now,
            ],
            [
                'ma_su_kien' => 805,
                'ma_dang_ky' => null,
                'ma_tai_khoan_muc_tieu' => null,
                'nguoi_thuc_hien' => $webdevUser->ma_tai_khoan,
                'hanh_dong' => 'SUBMIT',
                'trang_thai_truoc' => 'DRAFT',
                'trang_thai_sau' => 'WAITING_COHOST_CONFIRM',
                'ly_do' => 'Gửi đề xuất sự kiện kèm lời mời đồng tổ chức đến Khoa HTTT.',
                'thoi_gian_tao' => $now,
            ],
            [
                'ma_su_kien' => 806,
                'ma_dang_ky' => null,
                'ma_tai_khoan_muc_tieu' => null,
                'nguoi_thuc_hien' => $webdevUser->ma_tai_khoan,
                'hanh_dong' => 'SUBMIT',
                'trang_thai_truoc' => 'DRAFT',
                'trang_thai_sau' => 'PENDING_FACULTY',
                'ly_do' => 'Gửi đề xuất sự kiện chờ Khoa Hệ thống Thông tin duyệt.',
                'thoi_gian_tao' => $now,
            ],
        ];

        DB::table('nhat_ky_kiem_duyet')->insert($auditLogs);
        $this->command->info('Đã ghi nhật ký kiểm toán cho sự kiện 804, 805, 806.');

        $this->command->info('=== HOÀN TẤT THIẾT LẬP E2E FIXTURES (UC-EVT-01, UC-EVT-02) THÀNH CÔNG ===');
    }
}
