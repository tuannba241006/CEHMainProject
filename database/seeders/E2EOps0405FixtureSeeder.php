<?php

namespace Database\Seeders;

use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class E2EOps0405FixtureSeeder extends Seeder
{
    /**
     * Run the database seeds for E2E Fixtures (UC-OPS-04 & UC-OPS-05).
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $hashedPassword = Hash::make('Password123@', $passwordCost);
        $cryptoService = app(CryptoService::class);

        $this->command->info('======================================================================');
        $this->command->info('=== BẮT ĐẦU THIẾT LẬP E2E FIXTURES (UC-OPS-04 & UC-OPS-05)        ===');
        $this->command->info('======================================================================');

        // -------------------------------------------------------------------------
        // 1. TÀI KHOẢN NGƯỜI DÙNG (Mật khẩu đồng bộ: Password123@)
        // -------------------------------------------------------------------------
        $accounts = [
            // 1.1 Ban Tổ chức (ToChuc)
            [
                'email' => 'bch.clb.it@uit.edu.vn',
                'mssv' => null,
                'ho_ten' => 'Ban Chấp Hành CLB IT (BTC E2E)',
                'khoa' => 'Khoa Hệ thống Thông tin',
                'ma_khoa' => 1,
                'lop_sinh_hoat' => null,
                'so_dien_thoai' => '0909000001',
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 1, // Khoa Hệ thống Thông tin
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.2 Sinh viên A: MSSV 22520001, sv1@gm.uit.edu.vn - Test override sang DaCheckIn
            [
                'email' => 'sv1@gm.uit.edu.vn',
                'mssv' => '22520001',
                'ho_ten' => 'Nguyễn Văn A (Sinh viên A)',
                'khoa' => 'Khoa Hệ thống Thông tin',
                'ma_khoa' => 1,
                'lop_sinh_hoat' => 'HTTT2022',
                'so_dien_thoai' => '0901000001',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.3 Sinh viên B: MSSV 22520002, sv2@gm.uit.edu.vn - Test gỡ cờ gian lận & override sang DaCheckOut
            [
                'email' => 'sv2@gm.uit.edu.vn',
                'mssv' => '22520002',
                'ho_ten' => 'Trần Thị B (Sinh viên B)',
                'khoa' => 'Khoa Hệ thống Thông tin',
                'ma_khoa' => 1,
                'lop_sinh_hoat' => 'HTTT2022',
                'so_dien_thoai' => '0901000002',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.4 Sinh viên C: MSSV 22520003, sv3@gm.uit.edu.vn - Test Exception Course cấm override vé đã hủy
            [
                'email' => 'sv3@gm.uit.edu.vn',
                'mssv' => '22520003',
                'ho_ten' => 'Lê Văn C (Sinh viên C)',
                'khoa' => 'Khoa Hệ thống Thông tin',
                'ma_khoa' => 1,
                'lop_sinh_hoat' => 'HTTT2022',
                'so_dien_thoai' => '0901000003',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.5 Sinh viên D: MSSV 22520004, sv4@gm.uit.edu.vn - Test phân công staff và lối tắt /scanner
            [
                'email' => 'sv4@gm.uit.edu.vn',
                'mssv' => '22520004',
                'ho_ten' => 'Phạm Văn D (Sinh viên D)',
                'khoa' => 'Khoa Hệ thống Thông tin',
                'ma_khoa' => 1,
                'lop_sinh_hoat' => 'HTTT2022',
                'so_dien_thoai' => '0901000004',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.6 Sinh viên E: MSSV 22520005, sv5@gm.uit.edu.vn - Test thu hồi quyền Staff (Delete/Revoke Staff)
            [
                'email' => 'sv5@gm.uit.edu.vn',
                'mssv' => '22520005',
                'ho_ten' => 'Hoàng Thị E (Sinh viên E)',
                'khoa' => 'Khoa Hệ thống Thông tin',
                'ma_khoa' => 1,
                'lop_sinh_hoat' => 'HTTT2022',
                'so_dien_thoai' => '0901000005',
                'loai_tai_khoan' => 'SinhVien',
                'ma_don_vi_to_chuc' => null,
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.7 Sinh viên F: MSSV 22520006, sv6@gm.uit.edu.vn - Test xóa cờ No-show vi_pham_no_show = 1
            [
                'email' => 'sv6@gm.uit.edu.vn',
                'mssv' => '22520006',
                'ho_ten' => 'Đặng Văn F (Sinh viên No-Show)',
                'khoa' => 'Khoa Hệ thống Thông tin',
                'ma_khoa' => 1,
                'lop_sinh_hoat' => 'HTTT2022',
                'so_dien_thoai' => '0901000006',
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
            $query = DB::table('tai_khoan');
            if (!empty($acc['mssv'])) {
                $query->where(function ($q) use ($acc) {
                    $q->where('mssv', $acc['mssv'])
                      ->orWhere('email', $acc['email']);
                });
            } else {
                $query->where('email', $acc['email']);
            }
            $existing = $query->first();

            $record = array_merge($acc, [
                'mat_khau' => $hashedPassword,
                'thoi_gian_cap_nhat' => $now,
            ]);

            if ($existing) {
                DB::table('tai_khoan')->where('ma_tai_khoan', $existing->ma_tai_khoan)->update($record);
                $userId = $existing->ma_tai_khoan;
            } else {
                $record['thoi_gian_tao'] = $now;
                $userId = DB::table('tai_khoan')->insertGetId($record);
            }

            $freshUser = DB::table('tai_khoan')->where('ma_tai_khoan', $userId)->first();
            $userMap[$acc['email']] = $freshUser;
            if (!empty($acc['mssv'])) {
                $userMap[$acc['mssv']] = $freshUser;
            }

            $this->command->info(sprintf(
                '[User] ID: %d | MSSV: %-8s | %-32s | %-24s | Pass: Password123@',
                $userId,
                $acc['mssv'] ?? 'N/A',
                $acc['ho_ten'],
                $acc['email']
            ));
        }

        // -------------------------------------------------------------------------
        // 2. DỌN DẸP DỮ LIỆU CŨ PHỤC VỤ IDEMPOTENT (SỰ KIỆN 851, 852, 853)
        // -------------------------------------------------------------------------
        $fixtureEventIds = [851, 852, 853];

        $oldTicketIds = DB::table('dang_ky')->whereIn('ma_su_kien', $fixtureEventIds)->pluck('ma_dang_ky');
        if ($oldTicketIds->isNotEmpty()) {
            DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('danh_gia_feedback')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('chung_nhan')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
            DB::table('dang_ky')->whereIn('ma_dang_ky', $oldTicketIds)->delete();
        }

        DB::table('nhan_vien_check_in')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('phien_kiosk')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('nhat_ky_kiem_duyet')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('hang_doi_waitlist')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien_dong_to_chuc')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('thong_ke_su_kien_ngay')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('dat_phong')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien')->whereIn('ma_su_kien', $fixtureEventIds)->delete();

        // -------------------------------------------------------------------------
        // 3. THIẾT LẬP SỰ KIỆN THỬ NGHIỆM
        // -------------------------------------------------------------------------
        $events = [
            // Sự kiện 1 (851): Đang diễn ra hôm nay - Test UC-OPS-04 normal, UC-OPS-05
            [
                'ma_su_kien' => 851,
                'ma_don_vi_to_chuc' => 1, // Khoa Hệ thống Thông tin
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 1,          // Hội trường E
                'ten_su_kien' => 'E2E-OPS: Hội thảo Công nghệ AI & Vận hành Sự kiện (Đang diễn ra)',
                'anh_bia' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Chấp Hành CLB IT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Điểm danh thủ công sang DaCheckIn & Phân công Staff (UC-OPS-04, UC-OPS-05)',
                'lo_trinh' => json_encode([
                    ['time' => '08:00', 'title' => 'Mở cổng Check-in'],
                    ['time' => '11:00', 'title' => 'Bế mạc sự kiện'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->subHour(),
                'thoi_gian_ket_thuc' => $now->copy()->addHours(2),
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
                'cong_check_in_mo' => 1,
                'thoi_gian_mo_cong_check_in' => $now->copy()->subHour(),
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // Sự kiện 2 (852): Đã kết thúc, da_chot_drl = 0 - Test UC-OPS-04 completed & fraud UX
            [
                'ma_su_kien' => 852,
                'ma_don_vi_to_chuc' => 1, // Khoa Hệ thống Thông tin
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 2,          // Hội trường A
                'ten_su_kien' => 'E2E-OPS: Diễn đàn Chuyển đổi số & Đối soát Gian lận (Đã kết thúc)',
                'anh_bia' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Chấp Hành CLB IT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Gỡ cờ gian lận và override sang DaCheckOut hưởng 100% ĐRL (UC-OPS-04)',
                'lo_trinh' => json_encode([
                    ['time' => '13:00', 'title' => 'Khai mạc diễn đàn'],
                    ['time' => '16:00', 'title' => 'Bế mạc diễn đàn'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => $now->copy()->subHours(5),
                'thoi_gian_ket_thuc' => $now->copy()->subHours(2),
                'thoi_gian_ket_thuc_thuc_te' => $now->copy()->subHours(2),
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 98,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => $now->copy()->subHours(5),
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // Sự kiện 3 (853): Đã khóa chốt ĐRL, da_chot_drl = 1 - Test UC-OPS-04.EX.1 Cấm override
            [
                'ma_su_kien' => 853,
                'ma_don_vi_to_chuc' => 1, // Khoa Hệ thống Thông tin
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 3,          // Phòng C109
                'ten_su_kien' => 'E2E-OPS: Talkshow Khởi nghiệp Đã Khóa Chốt ĐRL (Đã chốt ĐRL)',
                'anh_bia' => 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Chấp Hành CLB IT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Cấm override khi sự kiện đã khóa chốt ĐRL (UC-OPS-04.EX.1)',
                'lo_trinh' => json_encode([
                    ['time' => '08:00', 'title' => 'Bắt đầu talkshow'],
                    ['time' => '11:00', 'title' => 'Bế mạc talkshow'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(4),
                'thoi_gian_bat_dau' => $now->copy()->subHours(10),
                'thoi_gian_ket_thuc' => $now->copy()->subHours(7),
                'thoi_gian_ket_thuc_thuc_te' => $now->copy()->subHours(7),
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 99,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => $now->copy()->subHours(10),
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 1,
                'thoi_gian_chot_drl' => $now->copy()->subHour(),
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        foreach ($events as $event) {
            DB::table('su_kien')->insert($event);

            // Đặt phòng chính thức CONFIRMED
            DB::table('dat_phong')->insert([
                'ma_phong' => $event['ma_phong'],
                'ma_su_kien' => $event['ma_su_kien'],
                'thoi_gian_bat_dau' => $event['thoi_gian_bat_dau'],
                'thoi_gian_ket_thuc' => $event['thoi_gian_ket_thuc'],
                'trang_thai' => 'CONFIRMED',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Đặt phòng chính thức: ' . $event['ten_su_kien'],
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]);

            $this->command->info(sprintf(
                '[Event] ID: %d | %s | TT: %s | Bắt đầu: %s | ĐRL Chốt: %d',
                $event['ma_su_kien'],
                $event['ten_su_kien'],
                $event['trang_thai'],
                $event['thoi_gian_bat_dau']->toDateTimeString(),
                $event['da_chot_drl']
            ));
        }

        // Tạo phiên Kiosk cho Sự kiện 851 (Happening)
        $organizerUser = $userMap['bch.clb.it@uit.edu.vn'];
        DB::table('phien_kiosk')->insert([
            'ma_su_kien' => 851,
            'nguoi_kich_hoat' => $organizerUser->ma_tai_khoan,
            'kiosk_token_hash' => hash('sha256', Str::random(32)),
            'totp_secret' => 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'E2E-Test-Agent',
            'thoi_gian_bat_dau' => $now->copy()->subHour(),
            'thoi_gian_het_han' => $now->copy()->addHours(3),
            'da_thu_hoi' => 0,
            'thoi_gian_thu_hoi' => null,
        ]);

        // -------------------------------------------------------------------------
        // 4. PHÂN CÔNG NHÂN VIÊN SOÁT VÉ (UC-OPS-05)
        // -------------------------------------------------------------------------
        // Sinh viên E (22520005) được gán trước tại Sự kiện 851 để test Thu hồi quyền (Revoke Staff)
        // Sinh viên D (22520004) CHƯA được gán, dùng để test Phân công Staff mới và kiểm tra lối tắt /scanner
        $studentE = $userMap['22520005'];
        DB::table('nhan_vien_check_in')->insert([
            'ma_tai_khoan' => $studentE->ma_tai_khoan,
            'ma_su_kien' => 851,
            'nguoi_phan_cong' => $organizerUser->ma_tai_khoan,
            'thoi_gian_phan_cong' => $now,
        ]);
        $this->command->info(sprintf(
            '[Staff] Phân công Staff trước: ID %d (MSSV: %s, %s) vào Sự kiện 851 để test thu hồi quyền',
            $studentE->ma_tai_khoan,
            $studentE->mssv,
            $studentE->email
        ));

        // -------------------------------------------------------------------------
        // 5. TẠO VÉ VÀ KÝ CHỮ KÝ HMAC QR (dang_ky)
        // -------------------------------------------------------------------------
        $ticketsConfig = [
            // 5.1 Vé Sự kiện 851: Sinh viên A (MSSV 22520001) - DaDangKy -> test override sang DaCheckIn
            [
                'label' => 'Vé 851 (sv1 - Test override sang DaCheckIn)',
                'email' => 'sv1@gm.uit.edu.vn',
                'ma_su_kien' => 851,
                'trang_thai' => 'DaDangKy',
                'thoi_gian_huy' => null,
                'ly_do_huy' => null,
                'nghi_van_gian_lan' => 0,
                'ma_thiet_bi_nghi_van' => null,
                'vi_pham_no_show' => 0,
                'ghi_chu' => 'E2E Fixture Ticket: UC-OPS-04 Override sang DaCheckIn',
            ],

            // 5.2 Vé Sự kiện 851: Sinh viên C (MSSV 22520003) - DaHuy -> test cấm override vé đã hủy
            [
                'label' => 'Vé 851 (sv3 - Test Exception cấm override vé đã hủy)',
                'email' => 'sv3@gm.uit.edu.vn',
                'ma_su_kien' => 851,
                'trang_thai' => 'DaHuy',
                'thoi_gian_huy' => $now->copy()->subMinutes(30),
                'ly_do_huy' => 'Bận việc gia đình đột xuất',
                'nghi_van_gian_lan' => 0,
                'ma_thiet_bi_nghi_van' => null,
                'vi_pham_no_show' => 0,
                'ghi_chu' => 'E2E Fixture Ticket: UC-OPS-04 Cấm override vé đã hủy',
            ],

            // 5.3 Vé Sự kiện 852: Sinh viên B (MSSV 22520002) - Cờ gian lận -> test gỡ gian lận & override DaCheckOut 100% ĐRL
            // Ghi chú schema: chk_dangky_noshow bắt buộc vi_pham_no_show = 0 khi nghi_van_gian_lan = 1
            [
                'label' => 'Vé 852 (sv2 - Test Fraud UX & override DaCheckOut 100% ĐRL)',
                'email' => 'sv2@gm.uit.edu.vn',
                'ma_su_kien' => 852,
                'trang_thai' => 'DaDangKy',
                'thoi_gian_huy' => null,
                'ly_do_huy' => null,
                'nghi_van_gian_lan' => 1,
                'ma_thiet_bi_nghi_van' => 'DEVICE_SUSPECT_01',
                'vi_pham_no_show' => 0,
                'ghi_chu' => 'E2E Fixture Ticket: UC-OPS-04 Gỡ cờ gian lận & Override sang DaCheckOut',
            ],

            // 5.4 Vé Sự kiện 852: Sinh viên F (MSSV 22520006) - Cờ No-Show -> test xóa cờ vi_pham_no_show = 1
            [
                'label' => 'Vé 852 (sv6 - Test xóa cờ No-show vi_pham_no_show = 1)',
                'email' => 'sv6@gm.uit.edu.vn',
                'ma_su_kien' => 852,
                'trang_thai' => 'DaDangKy',
                'thoi_gian_huy' => null,
                'ly_do_huy' => null,
                'nghi_van_gian_lan' => 0,
                'ma_thiet_bi_nghi_van' => null,
                'vi_pham_no_show' => 1,
                'ghi_chu' => 'E2E Fixture Ticket: UC-OPS-04 Xóa cờ No-show & Override',
            ],

            // 5.5 Vé Sự kiện 853: Sinh viên A (MSSV 22520001) - ĐRL đã khóa chốt -> test UC-OPS-04.EX.1 cấm override
            [
                'label' => 'Vé 853 (sv1 - Test Exception cấm override khi ĐRL đã chốt)',
                'email' => 'sv1@gm.uit.edu.vn',
                'ma_su_kien' => 853,
                'trang_thai' => 'DaDangKy',
                'thoi_gian_huy' => null,
                'ly_do_huy' => null,
                'nghi_van_gian_lan' => 0,
                'ma_thiet_bi_nghi_van' => null,
                'vi_pham_no_show' => 0,
                'ghi_chu' => 'E2E Fixture Ticket: UC-OPS-04.EX.1 Cấm override khi ĐRL đã chốt',
            ],
        ];

        $summaryTickets = [];

        foreach ($ticketsConfig as $tc) {
            $user = $userMap[$tc['email']];
            $uuid = (string) Str::uuid();
            $signature = $cryptoService->signTicket($uuid, (int) $user->ma_tai_khoan, (int) $tc['ma_su_kien']);
            $qrCode = "CEH1.{$uuid}.{$user->ma_tai_khoan}.{$tc['ma_su_kien']}.{$signature}";

            $ticketId = DB::table('dang_ky')->insertGetId([
                'ma_tai_khoan' => $user->ma_tai_khoan,
                'ma_su_kien' => $tc['ma_su_kien'],
                'ma_ve_uuid' => $uuid,
                'chu_ky_hmac' => $signature,
                'trang_thai' => $tc['trang_thai'],
                'thoi_gian_dang_ky' => $now->copy()->subHours(2),
                'thoi_gian_check_in' => null,
                'thoi_gian_check_out' => null,
                'thoi_gian_huy' => $tc['thoi_gian_huy'],
                'ly_do_huy' => $tc['ly_do_huy'],
                'da_check_in' => 0,
                'da_check_out' => 0,
                'ma_thiet_bi_check_in' => null,
                'ma_thiet_bi_check_out' => null,
                'ma_thiet_bi_nghi_van' => $tc['ma_thiet_bi_nghi_van'],
                'nghi_van_gian_lan' => $tc['nghi_van_gian_lan'],
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 0.00,
                'da_feedback' => 0,
                'han_an_han_feedback' => null,
                'du_dieu_kien_drl' => 0,
                'vi_pham_no_show' => $tc['vi_pham_no_show'],
                'da_gui_nhac_nho' => 0,
                'ghi_chu' => $tc['ghi_chu'],
            ]);

            $summaryTickets[] = [
                'label' => $tc['label'],
                'ticket_id' => $ticketId,
                'event_id' => $tc['ma_su_kien'],
                'user_id' => $user->ma_tai_khoan,
                'mssv' => $user->mssv,
                'email' => $user->email,
                'uuid' => $uuid,
                'qr_code' => $qrCode,
            ];

            $this->command->info(sprintf(
                '[Ticket] ID: %d | Sự kiện: %d | User ID: %d (MSSV: %s, %s) | UUID: %s',
                $ticketId,
                $tc['ma_su_kien'],
                $user->ma_tai_khoan,
                $user->mssv ?? 'N/A',
                $user->email,
                $uuid
            ));
        }

        // -------------------------------------------------------------------------
        // 6. TỔNG KẾT DỮ LIỆU ĐÃ TẠO
        // -------------------------------------------------------------------------
        $this->command->info('======================================================================');
        $this->command->info('=== TỔNG KẾT DỮ LIỆU E2E FIXTURES (UC-OPS-04 & UC-OPS-05)          ===');
        $this->command->info('======================================================================');
        $this->command->table(
            ['Mục tiêu kiểm thử', 'Mã Sự kiện', 'Mã Vé ID', 'MSSV', 'Email', 'UUID Vé'],
            array_map(fn ($t) => [
                $t['label'],
                $t['event_id'],
                $t['ticket_id'],
                $t['mssv'] ?? 'N/A',
                $t['email'],
                $t['uuid'],
            ], $summaryTickets)
        );

        $this->command->info('=== HOÀN TẤT THIẾT LẬP E2E FIXTURES THÀNH CÔNG ===');
    }
}
