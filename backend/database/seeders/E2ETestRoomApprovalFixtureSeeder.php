<?php

namespace Database\Seeders;

use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class E2ETestRoomApprovalFixtureSeeder extends Seeder
{
    /**
     * Run the database seeds for E2E Test Fixtures (UC-ROOM-02, UC-EVT-03).
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $hashedAdminPassword = Hash::make('Admin@123', $passwordCost);
        $hashedFacultyPassword = Hash::make('Faculty@123', $passwordCost);
        $hashedClubPassword = Hash::make('Club@123', $passwordCost);
        $hashedStudentPassword = Hash::make('Student@123', $passwordCost);
        $cryptoService = app(CryptoService::class);

        $this->command->info('=== BẮT ĐẦU THIẾT LẬP E2E FIXTURES (UC-ROOM-02, UC-EVT-03) ===');

        // -------------------------------------------------------------------------
        // 1. TÀI KHOẢN NGƯỜI DÙNG (Admin P.CTSV, Cán bộ Khoa, CLB WebDev, SV1, SV2)
        // -------------------------------------------------------------------------

        // 1.1 Admin P.CTSV
        $adminEmail = 'admin.pctsv@uit.edu.vn';
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => $adminEmail],
            [
                'email' => $adminEmail,
                'mssv' => null,
                'ho_ten' => 'Quản trị viên P.CTSV (E2E Test)',
                'mat_khau' => $hashedAdminPassword,
                'so_dien_thoai' => '02837252002',
                'ma_khoa' => null,
                'khoa' => null,
                'lop_sinh_hoat' => null,
                'avatar_url' => null,
                'loai_tai_khoan' => 'Admin',
                'ma_don_vi_to_chuc' => 7, // Phòng Công tác Sinh viên
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
            'Đã cấu hình tài khoản Admin P.CTSV: %s (ID: %d, pass: Admin@123)',
            $adminUser->email,
            $adminUser->ma_tai_khoan
        ));

        // 1.2 Cán bộ Khoa HTTT
        $facultyEmail = 'canbo.httt@uit.edu.vn';
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => $facultyEmail],
            [
                'email' => $facultyEmail,
                'mssv' => null,
                'ho_ten' => 'Cán bộ Khoa HTTT (E2E Test)',
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
        $facultyUser = DB::table('tai_khoan')->where('email', $facultyEmail)->first();
        $this->command->info(sprintf(
            'Đã cấu hình tài khoản Cán bộ Khoa HTTT: %s (ID: %d, đơn vị: %d, pass: Faculty@123)',
            $facultyUser->email,
            $facultyUser->ma_tai_khoan,
            $facultyUser->ma_don_vi_to_chuc
        ));

        // 1.3 CLB WebDev (Host A)
        $clubEmail = 'clb.webdev@uit.edu.vn';
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => $clubEmail],
            [
                'email' => $clubEmail,
                'mssv' => null,
                'ho_ten' => 'Ban Chủ nhiệm CLB WebDev (E2E Test)',
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
        $clubUser = DB::table('tai_khoan')->where('email', $clubEmail)->first();
        $this->command->info(sprintf(
            'Đã cấu hình tài khoản CLB WebDev: %s (ID: %d, đơn vị: %d, pass: Club@123)',
            $clubUser->email,
            $clubUser->ma_tai_khoan,
            $clubUser->ma_don_vi_to_chuc
        ));

        // 1.4 Sinh viên 1 (MSSV: 22520001, Target ID: 5)
        $student1Email = '22520001@gm.uit.edu.vn';
        $sv1Existing = DB::table('tai_khoan')->where('email', $student1Email)->first();
        if ($sv1Existing) {
            DB::table('tai_khoan')->where('email', $student1Email)->update([
                'mat_khau' => $hashedStudentPassword,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_cap_nhat' => $now,
            ]);
        } else {
            DB::table('tai_khoan')->insert([
                'ma_tai_khoan' => 5,
                'email' => $student1Email,
                'mssv' => '22520001',
                'ho_ten' => 'Nguyễn Văn An (E2E Test)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0912345678',
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
            ]);
        }
        $student1User = DB::table('tai_khoan')->where('email', $student1Email)->first();
        $this->command->info(sprintf(
            'Đã cấu hình tài khoản Sinh viên 1: %s (ID: %d, MSSV: %s, pass: Student@123)',
            $student1User->email,
            $student1User->ma_tai_khoan,
            $student1User->mssv
        ));

        // 1.5 Sinh viên 2 (MSSV: 22520002, Target ID: 344)
        $student2Email = '22520002@gm.uit.edu.vn';
        $sv2Existing = DB::table('tai_khoan')->where('email', $student2Email)->first();
        if ($sv2Existing) {
            DB::table('tai_khoan')->where('email', $student2Email)->update([
                'mat_khau' => $hashedStudentPassword,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_cap_nhat' => $now,
            ]);
        } else {
            DB::table('tai_khoan')->insert([
                'ma_tai_khoan' => 344,
                'email' => $student2Email,
                'mssv' => '22520002',
                'ho_ten' => 'Trần Minh Bình (E2E Test)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0912345679',
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
            ]);
        }
        $student2User = DB::table('tai_khoan')->where('email', $student2Email)->first();
        $this->command->info(sprintf(
            'Đã cấu hình tài khoản Sinh viên 2: %s (ID: %d, MSSV: %s, pass: Student@123)',
            $student2User->email,
            $student2User->ma_tai_khoan,
            $student2User->mssv
        ));

        // -------------------------------------------------------------------------
        // 2. DỌN DẸP DỮ LIỆU CŨ CỦA FIXTURE (Idempotent cleanup)
        // -------------------------------------------------------------------------
        $fixtureEventIds = [701, 702, 703, 704, 705];

        $oldTicketIds = DB::table('dang_ky')->whereIn('ma_su_kien', $fixtureEventIds)->pluck('ma_dang_ky');
        if ($oldTicketIds->isNotEmpty()) {
            DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('danh_gia_feedback')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('chung_nhan')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('dang_ky')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
        }

        DB::table('hang_doi_waitlist')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('phien_kiosk')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('nhat_ky_kiem_duyet')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('dat_phong')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien_dong_to_chuc')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien')->whereIn('ma_su_kien', $fixtureEventIds)->delete();

        // -------------------------------------------------------------------------
        // 3. THIẾT LẬP CÁC SỰ KIỆN VÀ ĐẶT PHÒNG
        // -------------------------------------------------------------------------
        $time701Start = date('Y-m-d 10:00:00', strtotime('+1 day'));
        $time701End = date('Y-m-d 12:00:00', strtotime('+1 day'));

        $time702Start = date('Y-m-d 08:00:00', strtotime('+2 days'));
        $time702End = date('Y-m-d 11:00:00', strtotime('+2 days'));

        $time703Start = date('Y-m-d 08:00:00', strtotime('+3 days'));
        $time703End = date('Y-m-d 11:00:00', strtotime('+3 days'));

        $time704Start = date('Y-m-d 08:00:00', strtotime('+4 days'));
        $time704End = date('Y-m-d 11:00:00', strtotime('+4 days'));

        $time705Start = date('Y-m-d 08:00:00', strtotime('+5 days'));
        $time705End = date('Y-m-d 11:00:00', strtotime('+5 days'));

        $events = [
            // 701: UC-ROOM-02 - Đã chiếm phòng CONFIRMED Hội trường E (ma_phong = 1)
            [
                'ma_su_kien' => 701,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'E2E: Sự kiện Giữ Phòng Hội Trường E',
                'anh_bia' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
                'dien_gia' => 'PGS.TS Nguyễn Văn A',
                'mo_ta' => 'Sự kiện kiểm tra tra cứu lịch phòng & kiểm tra xung đột thời gian thực (UC-ROOM-02)',
                'lo_trinh' => json_encode([['time' => '10:00', 'title' => 'Khai mạc sự kiện']]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(1),
                'thoi_gian_bat_dau' => $time701Start,
                'thoi_gian_ket_thuc' => $time701End,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 500,
                'so_ve_con_lai' => 500,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // 702: UC-EVT-03 - Chờ Khoa duyệt (PENDING_FACULTY) - CLB WebDev (ma_don_vi = 9)
            [
                'ma_su_kien' => 702,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev thuộc Khoa HTTT
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'E2E: Hội thảo Chờ Khoa HTTT Thông Qua',
                'anh_bia' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
                'dien_gia' => 'ThS. Trần Văn B',
                'mo_ta' => 'Hội thảo CLB WebDev gửi phê duyệt cấp Khoa HTTT (UC-EVT-03)',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Bắt đầu hội thảo']]),
                'doi_tuong_tham_gia' => 'Thành viên CLB và sinh viên quan tâm WebDev',
                'ngay_cong_bo' => $now->copy()->subDays(1),
                'thoi_gian_bat_dau' => $time702Start,
                'thoi_gian_ket_thuc' => $time702End,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 200,
                'so_ve_con_lai' => 200,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PENDING_FACULTY',
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // 703: UC-EVT-03 - Chờ Trường duyệt (PENDING_ADMIN) - Đoàn Hội (ma_don_vi = 8)
            [
                'ma_su_kien' => 703,
                'ma_don_vi_to_chuc' => 8, // Đoàn Thanh niên - Hội Sinh viên
                'ma_chuyen_de' => 1,
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'E2E: Hội thảo Chờ P.CTSV Phê Duyệt',
                'anh_bia' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Giám hiệu & P.CTSV',
                'mo_ta' => 'Hội thảo cấp Trường chờ P.CTSV phê duyệt (UC-EVT-03)',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Bắt đầu hội thảo']]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(1),
                'thoi_gian_bat_dau' => $time703Start,
                'thoi_gian_ket_thuc' => $time703End,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 250,
                'so_ve_con_lai' => 250,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PENDING_ADMIN',
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // 704: UC-EVT-03 - Từ chối & Tái mở (REJECTED -> DRAFT) - CLB WebDev (ma_don_vi = 9)
            [
                'ma_su_kien' => 704,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 3, // C109
                'ten_su_kien' => 'E2E: Sự kiện Thử nghiệm Từ Chối & Reopen',
                'anh_bia' => 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop',
                'dien_gia' => 'CLB WebDev Mentor',
                'mo_ta' => 'Sự kiện kiểm tra luồng từ chối phê duyệt và mở lại DRAFT (UC-EVT-03)',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Bắt đầu workshop']]),
                'doi_tuong_tham_gia' => 'Thành viên CLB WebDev',
                'ngay_cong_bo' => $now->copy()->subDays(1),
                'thoi_gian_bat_dau' => $time704Start,
                'thoi_gian_ket_thuc' => $time704End,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 100,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'KhongCo',
                'diem_drl_du_kien' => 0,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PENDING_ADMIN',
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // 705: UC-EVT-03 - Hủy khẩn cấp (EMERGENCY CANCEL) - Đoàn Hội (ma_don_vi = 8)
            [
                'ma_su_kien' => 705,
                'ma_don_vi_to_chuc' => 8, // Đoàn Thanh niên - Hội Sinh viên
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'E2E: Sự kiện Thử nghiệm Hủy Khẩn Cấp',
                'anh_bia' => 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop',
                'dien_gia' => 'Đoàn Hội UIT',
                'mo_ta' => 'Sự kiện thử nghiệm quy trình hủy khẩn cấp (Emergency Cancel) (UC-EVT-03)',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Bắt đầu sự kiện']]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(1),
                'thoi_gian_bat_dau' => $time705Start,
                'thoi_gian_ket_thuc' => $time705End,
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 99, // 1 vé đã đăng ký cho SV1
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 2.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        foreach ($events as $event) {
            DB::table('su_kien')->insert($event);
            $this->command->info(sprintf(
                'Đã tạo sự kiện ID: %d | Trạng thái: %-15s | Phòng: %d | Bắt đầu: %s | Tên: %s',
                $event['ma_su_kien'],
                $event['trang_thai'],
                $event['ma_phong'],
                $event['thoi_gian_bat_dau'],
                $event['ten_su_kien']
            ));
        }

        // -------------------------------------------------------------------------
        // 4. THIẾT LẬP ĐẶT PHÒNG (dat_phong)
        // -------------------------------------------------------------------------
        $datPhongData = [
            // 701: Hội trường E, CONFIRMED
            [
                'ma_phong' => 1,
                'ma_su_kien' => 701,
                'thoi_gian_bat_dau' => $time701Start,
                'thoi_gian_ket_thuc' => $time701End,
                'trang_thai' => 'CONFIRMED',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Xác nhận giữ phòng Hội trường E (UC-ROOM-02)',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // 702: Hội trường E, PENDING (han_giu_cho_tam = null)
            [
                'ma_phong' => 1,
                'ma_su_kien' => 702,
                'thoi_gian_bat_dau' => $time702Start,
                'thoi_gian_ket_thuc' => $time702End,
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Chờ Khoa HTTT duyệt (UC-EVT-03)',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // 703: Hội trường A, PENDING
            [
                'ma_phong' => 2,
                'ma_su_kien' => 703,
                'thoi_gian_bat_dau' => $time703Start,
                'thoi_gian_ket_thuc' => $time703End,
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Chờ P.CTSV duyệt (UC-EVT-03)',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // 704: C109, PENDING
            [
                'ma_phong' => 3,
                'ma_su_kien' => 704,
                'thoi_gian_bat_dau' => $time704Start,
                'thoi_gian_ket_thuc' => $time704End,
                'trang_thai' => 'PENDING',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Chờ duyệt tái mở (UC-EVT-03)',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            // 705: Hội trường E, CONFIRMED
            [
                'ma_phong' => 1,
                'ma_su_kien' => 705,
                'thoi_gian_bat_dau' => $time705Start,
                'thoi_gian_ket_thuc' => $time705End,
                'trang_thai' => 'CONFIRMED',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Xác nhận giữ phòng Hội trường E (UC-EVT-03 Hủy khẩn cấp)',
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        foreach ($datPhongData as $dp) {
            $dpId = DB::table('dat_phong')->insertGetId($dp);
            $this->command->info(sprintf(
                'Đã tạo đặt phòng ID: %d | Phòng: %d | Sự kiện: %d | Trạng thái: %-9s | [%s -> %s]',
                $dpId,
                $dp['ma_phong'],
                $dp['ma_su_kien'],
                $dp['trang_thai'],
                $dp['thoi_gian_bat_dau'],
                $dp['thoi_gian_ket_thuc']
            ));
        }

        // -------------------------------------------------------------------------
        // 5. THIẾT LẬP VÉ ĐĂNG KÝ VÀ HÀNG CHỜ CHO SỰ KIỆN 705 (HỦY KHẨN CẤP)
        // -------------------------------------------------------------------------

        // 5.1 Tạo 1 vé dang_ky cho SV 1 (ma_tai_khoan = 5)
        $uuid705 = (string) Str::uuid();
        $signature705 = $cryptoService->signTicket($uuid705, (int) $student1User->ma_tai_khoan, 705);

        $ticket705Id = DB::table('dang_ky')->insertGetId([
            'ma_tai_khoan' => $student1User->ma_tai_khoan,
            'ma_su_kien' => 705,
            'ma_ve_uuid' => $uuid705,
            'chu_ky_hmac' => $signature705,
            'trang_thai' => 'DaDangKy',
            'thoi_gian_dang_ky' => $now,
            'thoi_gian_check_in' => null,
            'thoi_gian_check_out' => null,
            'thoi_gian_huy' => null,
            'ly_do_huy' => null,
            'da_check_in' => 0,
            'da_check_out' => 0,
            'ma_thiet_bi_check_in' => null,
            'ma_thiet_bi_check_out' => null,
            'ma_thiet_bi_nghi_van' => null,
            'nghi_van_gian_lan' => 0,
            'tham_gia_tron_ven' => 0,
            'tham_gia_mot_phan' => 0,
            'ti_le_drl' => 0.00,
            'da_feedback' => 0,
            'han_an_han_feedback' => null,
            'du_dieu_kien_drl' => 0,
            'vi_pham_no_show' => 0,
            'da_gui_nhac_nho' => 0,
            'ghi_chu' => 'Vé test cho SV1 trước khi hủy khẩn cấp (UC-EVT-03)',
        ]);

        $this->command->info(sprintf(
            'Đã tạo vé sự kiện 705 cho SV 1 | Mã ĐK: %d | User ID: %d (%s) | Trạng thái: DaDangKy | UUID: %s',
            $ticket705Id,
            $student1User->ma_tai_khoan,
            $student1User->email,
            $uuid705
        ));

        // 5.2 Tạo 1 hàng chờ hang_doi_waitlist cho SV 2 (ma_tai_khoan = 344)
        $waitlist705Id = DB::table('hang_doi_waitlist')->insertGetId([
            'ma_su_kien' => 705,
            'ma_tai_khoan' => $student2User->ma_tai_khoan,
            'so_thu_tu' => 1,
            'trang_thai' => 'WAITING',
            'thoi_gian_dang_ky' => $now,
            'han_chot_xac_nhan' => null,
            'thoi_gian_phan_hoi' => null,
        ]);

        $this->command->info(sprintf(
            'Đã tạo hàng chờ sự kiện 705 cho SV 2 | Waitlist ID: %d | User ID: %d (%s) | Thứ tự: 1 | Trạng thái: WAITING',
            $waitlist705Id,
            $student2User->ma_tai_khoan,
            $student2User->email
        ));

        $this->command->info('=== HOÀN TẤT THIẾT LẬP E2E FIXTURES (UC-ROOM-02, UC-EVT-03) THÀNH CÔNG ===');
    }
}
