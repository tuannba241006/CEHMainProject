<?php

namespace Database\Seeders;

use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class E2ETestOpsFixtureSeeder extends Seeder
{
    /**
     * Run the database seeds for E2E Ops Fixtures (UC-OPS-01, UC-OPS-03).
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $hashedOrganizerPassword = Hash::make('Organizer@123', $passwordCost);
        $hashedStudentPassword = Hash::make('Student@123', $passwordCost);
        $cryptoService = app(CryptoService::class);

        $this->command->info('=== BẮT ĐẦU THIẾT LẬP E2E OPS FIXTURES (UC-OPS-01, UC-OPS-03) ===');

        // -------------------------------------------------------------------------
        // 1. TÀI KHOẢN BAN TỔ CHỨC (HOST ORGANIZER)
        // -------------------------------------------------------------------------
        $organizerEmail = 'tochuc.doan@uit.edu.vn';
        DB::table('tai_khoan')->updateOrInsert(
            ['email' => $organizerEmail],
            [
                'email' => $organizerEmail,
                'mssv' => null,
                'ho_ten' => 'Đoàn Thanh niên - Hội Sinh viên (BTC)',
                'mat_khau' => $hashedOrganizerPassword,
                'so_dien_thoai' => '02837252002',
                'ma_khoa' => null,
                'khoa' => null,
                'lop_sinh_hoat' => null,
                'avatar_url' => null,
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 8, // Đoàn Thanh niên - Hội Sinh viên
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]
        );

        $organizer = DB::table('tai_khoan')->where('email', $organizerEmail)->first();
        $this->command->info(sprintf(
            'Đã cấu hình tài khoản BTC: %s (ID: %d, đơn vị: %d, pass: Organizer@123)',
            $organizer->email,
            $organizer->ma_tai_khoan,
            $organizer->ma_don_vi_to_chuc
        ));

        // -------------------------------------------------------------------------
        // 2. TÀI KHOẢN SINH VIÊN (22520001 & 22520002)
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
                'Đã cấu hình tài khoản SV: %s (ID: %d, MSSV: %s, pass: Student@123)',
                $savedUser->email,
                $savedUser->ma_tai_khoan,
                $savedUser->mssv
            ));
        }

        // -------------------------------------------------------------------------
        // 3. DỌN DẸP DỮ LIỆU CŨ CHO SỰ KIỆN FIXTURE (901, 902) ĐẢM BẢO IDEMPOTENT
        // -------------------------------------------------------------------------
        $fixtureEventIds = [901, 902];

        // Lấy danh sách mã đăng ký cũ để dọn dẹp nhật ký phụ thuộc trước
        $oldTicketIds = DB::table('dang_ky')->whereIn('ma_su_kien', $fixtureEventIds)->pluck('ma_dang_ky');
        if ($oldTicketIds->isNotEmpty()) {
            DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('danh_gia_feedback')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('chung_nhan')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('dang_ky')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
        }

        DB::table('phien_kiosk')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('nhat_ky_kiem_duyet')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('hang_doi_waitlist')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('dat_phong')->whereIn('ma_su_kien', $fixtureEventIds)->delete();

        // -------------------------------------------------------------------------
        // 4. THIẾT LẬP SỰ KIỆN 901 & 902
        // -------------------------------------------------------------------------
        $events = [
            // Sự kiện 901: Kiosk & Two-way Attendance (UC-OPS-01, UC-OPS-03)
            // Thời gian: NOW() - 60m đến NOW() + 15m (còn 15m trước T_end <= 25m -> mở được Check-out sớm với CONFIRM)
            [
                'ma_su_kien' => 901,
                'ma_don_vi_to_chuc' => 8, // Đoàn Hội
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 1,          // Hội trường E
                'ten_su_kien' => 'E2E: Kiosk Điểm danh & Chống Gian lận Thiết bị',
                'anh_bia' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
                'dien_gia' => 'Đoàn Thanh niên - Hội Sinh viên UIT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Kiosk Điểm danh Dynamic TOTP & Chống Gian lận Thiết bị (UC-OPS-01, UC-OPS-03)',
                'lo_trinh' => json_encode([
                    ['time' => '13:30', 'title' => 'Khai mạc & Mở Kiosk Check-in'],
                    ['time' => '14:30', 'title' => 'Nội dung chuyên đề'],
                    ['time' => '15:15', 'title' => 'Mở Check-out sớm & Kết thúc'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->subMinutes(60),
                'thoi_gian_ket_thuc' => $now->copy()->addMinutes(15),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 98,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'HAPPENING',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // Sự kiện 902: Ràng buộc Khóa Check-out khi còn xa T_end > 25m (UC-OPS-01)
            // Thời gian: NOW() - 10m đến NOW() + 90m (còn 90m trước T_end > 25m -> mở Check-out bị chặn cứng CHECKOUT_TOO_EARLY 409)
            [
                'ma_su_kien' => 902,
                'ma_don_vi_to_chuc' => 8, // Đoàn Hội
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 2,          // Hội trường A
                'ten_su_kien' => 'E2E: Khóa Cổng Check-out Trước 25 Phút',
                'anh_bia' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
                'dien_gia' => 'Đoàn Thanh niên - Hội Sinh viên UIT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Ràng buộc Khóa Cổng Check-out Trước 25 Phút (UC-OPS-01.EX.1)',
                'lo_trinh' => json_encode([
                    ['time' => '15:00', 'title' => 'Bắt đầu chương trình'],
                    ['time' => '16:30', 'title' => 'Kết thúc chương trình'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->subMinutes(10),
                'thoi_gian_ket_thuc' => $now->copy()->addMinutes(90),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 100,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'HAPPENING',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
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
                    'ghi_chu' => 'E2E Fixture Booking Room (UC-OPS-01, UC-OPS-03)',
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ]
            );

            $this->command->info(sprintf(
                'Đã cấu hình sự kiện ID %d: %s (Trạng thái: %s, Bắt đầu: %s, Kết thúc: %s, Cổng In/Out: %d/%d)',
                $event['ma_su_kien'],
                $event['ten_su_kien'],
                $event['trang_thai'],
                $event['thoi_gian_bat_dau']->toDateTimeString(),
                $event['thoi_gian_ket_thuc']->toDateTimeString(),
                $event['cong_check_in_mo'],
                $event['cong_check_out_mo']
            ));
        }

        // -------------------------------------------------------------------------
        // 5. TẠO 2 VÉ CHO SỰ KIỆN 901 (Sinh viên 1 & Sinh viên 2)
        // -------------------------------------------------------------------------
        $student1 = $studentMap['22520001@gm.uit.edu.vn'];
        $student2 = $studentMap['22520002@gm.uit.edu.vn'];

        $ticketsData = [
            [
                'student' => $student1,
                'label' => 'Vé 1 (Sinh viên 1)',
            ],
            [
                'student' => $student2,
                'label' => 'Vé 2 (Sinh viên 2)',
            ],
        ];

        foreach ($ticketsData as $ticketItem) {
            $student = $ticketItem['student'];
            $uuid = (string) Str::uuid();
            $signature = $cryptoService->signTicket($uuid, (int) $student->ma_tai_khoan, 901);

            $ticketId = DB::table('dang_ky')->insertGetId([
                'ma_tai_khoan' => $student->ma_tai_khoan,
                'ma_su_kien' => 901,
                'ma_ve_uuid' => $uuid,
                'chu_ky_hmac' => $signature,
                'trang_thai' => 'DaDangKy',
                'thoi_gian_dang_ky' => $now->copy()->subMinutes(30),
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
                'ghi_chu' => 'E2E Fixture Ticket for UC-OPS-01 & UC-OPS-03',
            ]);

            $this->command->info(sprintf(
                'Đã tạo %s - Mã ĐK: %d | User ID: %d (%s) | Event: 901 | Trạng thái: DaDangKy | UUID: %s',
                $ticketItem['label'],
                $ticketId,
                $student->ma_tai_khoan,
                $student->email,
                $uuid
            ));
        }

        $this->command->info('=== HOÀN TẤT THIẾT LẬP E2E OPS FIXTURES THÀNH CÔNG ===');
    }
}
