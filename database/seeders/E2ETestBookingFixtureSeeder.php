<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class E2ETestBookingFixtureSeeder extends Seeder
{
    /**
     * Run the database seeds for E2E Test Fixtures (UC-BOOK-01, UC-BOOK-02, UC-BOOK-03).
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $hashedStudentPassword = Hash::make('Student@123', $passwordCost);

        $this->command->info('=== BẮT ĐẦU THIẾT LẬP E2E FIXTURES (UC-BOOK-01, 02, 03) ===');

        // -------------------------------------------------------------------------
        // 1. TÀI KHOẢN SINH VIÊN (Requirement 6)
        // -------------------------------------------------------------------------
        $studentsData = [
            [
                'email' => '22520001@gm.uit.edu.vn',
                'mssv' => '22520001',
                'ho_ten' => 'Nguyễn Văn An (E2E Test)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0912345678',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'email' => '22520002@gm.uit.edu.vn',
                'mssv' => '22520002',
                'ho_ten' => 'Trần Minh Bình (E2E Test)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0912345679',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'email' => '22520003@gm.uit.edu.vn',
                'mssv' => '22520003',
                'ho_ten' => 'Lê Thị Cúc (E2E Test)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0912345680',
                'ma_khoa' => 1,
                'khoa' => 'Khoa Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
        ];

        $studentMap = [];
        foreach ($studentsData as $student) {
            DB::table('tai_khoan')->updateOrInsert(
                ['email' => $student['email']],
                array_merge($student, [
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ])
            );

            $savedUser = DB::table('tai_khoan')->where('email', $student['email'])->first();
            $studentMap[$student['email']] = $savedUser;
            $this->command->info(sprintf(
                "Đã cấu hình tài khoản: %s (ID: %d, MSSV: %s, pass: Student@123)",
                $savedUser->email,
                $savedUser->ma_tai_khoan,
                $savedUser->mssv
            ));
        }

        // -------------------------------------------------------------------------
        // 2. DANH SÁCH SỰ KIỆN FIXTURE (Requirements 1, 2, 3, 4, 5)
        // -------------------------------------------------------------------------
        $fixtureEventIds = [801, 802, 803, 804, 805, 806];

        // Dọn dẹp các vé test và hàng đợi cũ của các sự kiện fixture (đảm bảo idempotent)
        DB::table('dang_ky')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('hang_doi_waitlist')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('dat_phong')->whereIn('ma_su_kien', $fixtureEventIds)->delete();

        $events = [
            // Sự kiện A: Dành cho UC-BOOK-01 Normal
            [
                'ma_su_kien' => 801,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1,
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'E2E: Sự kiện A (Normal Booking UC-BOOK-01)',
                'anh_bia' => 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
                'dien_gia' => 'TS. Nguyễn Minh Anh – Chuyên gia AI Viettel',
                'mo_ta' => 'Sự kiện kiểm thử E2E UC-BOOK-01 Normal: Đăng ký vé thành công khi sự kiện hợp lệ và còn vé.',
                'lo_trinh' => json_encode([['time' => '08:30', 'title' => 'Đón tiếp và Check-in']]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addDays(3),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(3)->addHours(3),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 50,
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

            // Sự kiện B: Trùng giờ với Sự kiện A để kiểm thử UC-BOOK-01.EX.1 (Hard Block)
            [
                'ma_su_kien' => 802,
                'ma_don_vi_to_chuc' => 1,
                'ma_chuyen_de' => 1,
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'E2E: Sự kiện B (Schedule Overlap UC-BOOK-01.EX.1)',
                'anh_bia' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
                'dien_gia' => 'ThS. Trần Quốc Bảo – Cloud Architect',
                'mo_ta' => 'Sự kiện kiểm thử E2E UC-BOOK-01.EX.1: Diễn ra cùng khung giờ với Sự kiện A, kiểm tra chặn cứng Hard Block 409.',
                'lo_trinh' => json_encode([['time' => '08:30', 'title' => 'Bắt đầu tọa đàm']]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addDays(3), // Trùng chính xác khung giờ với Sự kiện A
                'thoi_gian_ket_thuc' => $now->copy()->addDays(3)->addHours(3),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 50,
                'so_ve_con_lai' => 20,
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

            // Sự kiện C: Quá hạn T-2h (UC-BOOK-01.EX.3 & UC-BOOK-02.EX.1)
            [
                'ma_su_kien' => 803,
                'ma_don_vi_to_chuc' => 1,
                'ma_chuyen_de' => 1,
                'ma_phong' => 3, // Phòng C109
                'ten_su_kien' => 'E2E: Sự kiện C (Cutoff T-2h UC-BOOK-01.EX.3 & UC-BOOK-02.EX.1)',
                'anh_bia' => 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop',
                'dien_gia' => 'Lê Hoàng Yến – Chuyên viên Kỹ năng mềm',
                'mo_ta' => 'Sự kiện kiểm thử E2E Cutoff T-2h: Thời gian bắt đầu là NOW() + 1 HOUR (< 2h), hệ thống chặn đăng ký và chặn vào Waitlist.',
                'lo_trinh' => json_encode([['time' => '10:00', 'title' => 'Bắt đầu workshop']]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addHour(), // Dưới 2 tiếng so với hiện tại
                'thoi_gian_ket_thuc' => $now->copy()->addHours(4),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 50,
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

            // Sự kiện D: Hết vé để vào Danh sách chờ (UC-BOOK-02 Normal & UC-BOOK-03 Claim Offer)
            [
                'ma_su_kien' => 804,
                'ma_don_vi_to_chuc' => 1,
                'ma_chuyen_de' => 1,
                'ma_phong' => 4, // Phòng B114
                'ten_su_kien' => 'E2E: Sự kiện D (Sold Out Waitlist UC-BOOK-02 & Offer Claim UC-BOOK-03)',
                'anh_bia' => 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop',
                'dien_gia' => 'Chuyên gia An toàn Thông tin UIT',
                'mo_ta' => 'Sự kiện kiểm thử E2E hết vé (so_ve_con_lai = 0), phục vụ vào hàng chờ (UC-BOOK-02) và nhận suất giữ chỗ Claim (UC-BOOK-03).',
                'lo_trinh' => json_encode([['time' => '08:00', 'title' => 'Diễn đàn an ninh']]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addDays(5),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(5)->addHours(3),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 10,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subHour(),
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

            // Sự kiện E: Hết vé để kiểm thử luồng Từ chối Offer (UC-BOOK-03 Decline)
            [
                'ma_su_kien' => 805,
                'ma_don_vi_to_chuc' => 1,
                'ma_chuyen_de' => 1,
                'ma_phong' => 5, // Hội trường CS2
                'ten_su_kien' => 'E2E: Sự kiện E (Offer Decline UC-BOOK-03)',
                'anh_bia' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
                'dien_gia' => 'TS. Vũ Hoàng Hải – Vi mạch Bán dẫn',
                'mo_ta' => 'Sự kiện kiểm thử E2E luồng Từ chối suất Offer (DECLINED) và kiểm tra nhường suất kế tiếp.',
                'lo_trinh' => json_encode([['time' => '13:30', 'title' => 'Workshop thiết kế vi mạch']]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addDays(6),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(6)->addHours(3),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 20,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subHours(2),
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

            // Sự kiện 806: Hết vé dự phòng, Danh sách chờ rỗng hoàn toàn để khẳng định vị trí #1 khi join (UC-BOOK-02)
            [
                'ma_su_kien' => 806,
                'ma_don_vi_to_chuc' => 1,
                'ma_chuyen_de' => 1,
                'ma_phong' => 92, // Phòng Hội thảo C201
                'ten_su_kien' => 'E2E: Sự kiện D2 (Empty Waitlist Guarantee #1 UC-BOOK-02)',
                'anh_bia' => 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
                'dien_gia' => 'PGS.TS Nguyễn Thanh Sơn',
                'mo_ta' => 'Sự kiện hết vé với danh sách chờ ban đầu rỗng 100% để kiểm thử UC-BOOK-02 sinh viên tham gia hàng chờ nhận ngay vị trí #1.',
                'lo_trinh' => json_encode([['time' => '14:00', 'title' => 'Báo cáo chuyên đề']]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addDays(5)->addHours(4),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(5)->addHours(7),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 10,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subHours(1),
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
        ];

        foreach ($events as $event) {
            DB::table('su_kien')->updateOrInsert(
                ['ma_su_kien' => $event['ma_su_kien']],
                $event
            );

            // Seed đặt phòng chính thức tương ứng
            DB::table('dat_phong')->updateOrInsert(
                [
                    'ma_su_kien' => $event['ma_su_kien'],
                    'ma_phong' => $event['ma_phong'],
                ],
                [
                    'thoi_gian_bat_dau' => $event['thoi_gian_bat_dau'],
                    'thoi_gian_ket_thuc' => $event['thoi_gian_ket_thuc'],
                    'trang_thai' => 'CONFIRMED',
                    'ghi_chu' => 'E2E Fixture Booking Room',
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ]
            );

            $this->command->info(sprintf(
                "Đã cấu hình sự kiện ID %d: %s (trạng thái: %s, còn lại: %s/%s)",
                $event['ma_su_kien'],
                $event['ten_su_kien'],
                $event['trang_thai'],
                $event['so_ve_con_lai'] ?? 'null',
                $event['so_luong_toi_da'] ?? 'null'
            ));
        }

        // -------------------------------------------------------------------------
        // 3. THIẾT LẬP WAITLIST OFFER CHO UC-BOOK-03 (Requirement 5)
        // -------------------------------------------------------------------------
        $student2 = $studentMap['22520002@gm.uit.edu.vn'];
        $student3 = $studentMap['22520003@gm.uit.edu.vn'];

        // Bản ghi 1: Cho sinh viên 22520002@gm.uit.edu.vn nhận Offer (trên Sự kiện D - ID 804)
        $waitlistOffer2Id = DB::table('hang_doi_waitlist')->insertGetId([
            'ma_su_kien' => 804,
            'ma_tai_khoan' => $student2->ma_tai_khoan,
            'so_thu_tu' => 1,
            'trang_thai' => 'OFFERED',
            'thoi_gian_dang_ky' => $now->copy()->subMinutes(30),
            'han_chot_xac_nhan' => $now->copy()->addMinutes(45),
            'thoi_gian_phan_hoi' => null,
        ]);

        $this->command->info(sprintf(
            "Đã tạo Waitlist Offer [CLAIM] - Entry ID: %d | User: %s (ID %d) | Event: 804 | Thứ tự: 1 | Hạn: +45 phút",
            $waitlistOffer2Id,
            $student2->email,
            $student2->ma_tai_khoan
        ));

        // Bản ghi 2: Cho sinh viên 22520003@gm.uit.edu.vn nhận Offer để thử nghiệm Từ chối (trên Sự kiện E - ID 805)
        $waitlistOffer3Id = DB::table('hang_doi_waitlist')->insertGetId([
            'ma_su_kien' => 805,
            'ma_tai_khoan' => $student3->ma_tai_khoan,
            'so_thu_tu' => 1,
            'trang_thai' => 'OFFERED',
            'thoi_gian_dang_ky' => $now->copy()->subMinutes(30),
            'han_chot_xac_nhan' => $now->copy()->addMinutes(45),
            'thoi_gian_phan_hoi' => null,
        ]);

        $this->command->info(sprintf(
            "Đã tạo Waitlist Offer [DECLINE] - Entry ID: %d | User: %s (ID %d) | Event: 805 | Thứ tự: 1 | Hạn: +45 phút",
            $waitlistOffer3Id,
            $student3->email,
            $student3->ma_tai_khoan
        ));

        $this->command->info('=== HOÀN TẤT THIẾT LẬP E2E FIXTURES THÀNH CÔNG ===');
    }
}
