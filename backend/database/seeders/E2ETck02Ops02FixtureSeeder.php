<?php

namespace Database\Seeders;

use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class E2ETck02Ops02FixtureSeeder extends Seeder
{
    /**
     * Run the database seeds for E2E Fixtures (UC-TCK-02, UC-OPS-02).
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $hashedPassword = Hash::make('Password@123', $passwordCost);
        $cryptoService = app(CryptoService::class);

        $this->command->info('======================================================================');
        $this->command->info('=== BẮT ĐẦU THIẾT LẬP E2E FIXTURES (UC-TCK-02 & UC-OPS-02)        ===');
        $this->command->info('======================================================================');

        // -------------------------------------------------------------------------
        // 1. TÀI KHOẢN NGƯỜI DÙNG (Mật khẩu đồng bộ: Password@123)
        // -------------------------------------------------------------------------
        $accounts = [
            [
                'email' => 'sv_cancel_valid@gm.uit.edu.vn',
                'mssv' => '22529001',
                'ho_ten' => 'Nguyễn Văn Hủy Hợp Lệ',
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
            [
                'email' => 'sv_cancel_late@gm.uit.edu.vn',
                'mssv' => '22529002',
                'ho_ten' => 'Trần Thị Hủy Muộn',
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
            [
                'email' => 'sv_checkin@gm.uit.edu.vn',
                'mssv' => '22529003',
                'ho_ten' => 'Lê Văn Checkin',
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
            [
                'email' => 'staff_e2e@gm.uit.edu.vn',
                'mssv' => '22529004',
                'ho_ten' => 'Phạm Văn Staff',
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
        ];

        $userMap = [];
        foreach ($accounts as $acc) {
            $existing = DB::table('tai_khoan')
                ->where('email', $acc['email'])
                ->orWhere('mssv', $acc['mssv'])
                ->first();

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

            $userMap[$acc['email']] = DB::table('tai_khoan')->where('ma_tai_khoan', $userId)->first();
            $this->command->info(sprintf(
                '[User] ID: %d | MSSV: %s | %s | Email: %s | Pass: Password@123',
                $userId,
                $acc['mssv'],
                $acc['ho_ten'],
                $acc['email']
            ));
        }

        // -------------------------------------------------------------------------
        // 2. DỌN DẸP DỮ LIỆU CŨ PHỤC VỤ IDEMPOTENT (SỰ KIỆN 801, 802, 803, 804)
        // -------------------------------------------------------------------------
        $fixtureEventIds = [801, 802, 803, 804];

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
            // Sự kiện 801: Cho UC-TCK-02 Hủy hợp lệ trước T-4h
            // Bắt đầu: Ngày mai lúc 10:00:00 (cách hiện tại > 4h)
            [
                'ma_su_kien' => 801,
                'ma_don_vi_to_chuc' => 1, // Khoa Hệ thống Thông tin
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 1,          // Hội trường E
                'ten_su_kien' => 'E2E: Hội thảo Hủy vé Hợp lệ Trước T-4h',
                'anh_bia' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
                'dien_gia' => 'Khoa Hệ thống Thông tin UIT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Hủy vé hợp lệ trước mốc T-4h (UC-TCK-02)',
                'lo_trinh' => json_encode([
                    ['time' => '10:00', 'title' => 'Khai mạc hội thảo'],
                    ['time' => '12:00', 'title' => 'Bế mạc hội thảo'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addDay()->setTime(10, 0, 0),
                'thoi_gian_ket_thuc' => $now->copy()->addDay()->setTime(12, 0, 0),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 99,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // Sự kiện 802: Cho UC-TCK-02 Khóa Hủy vé khi quá hạn T-4h
            // Bắt đầu: Hôm nay, cách hiện tại đúng 2 tiếng (now() + 2h <= 4h)
            [
                'ma_su_kien' => 802,
                'ma_don_vi_to_chuc' => 1, // Khoa Hệ thống Thông tin
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 2,          // Hội trường A
                'ten_su_kien' => 'E2E: Hội thảo Khóa Hủy vé Sau Mốc T-4h',
                'anh_bia' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
                'dien_gia' => 'Khoa Hệ thống Thông tin UIT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Khóa Hủy vé khi đã vào mốc T-4h (UC-TCK-02.EX.1)',
                'lo_trinh' => json_encode([
                    ['time' => '14:00', 'title' => 'Bắt đầu chương trình'],
                    ['time' => '16:00', 'title' => 'Kết thúc chương trình'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addHours(2),
                'thoi_gian_ket_thuc' => $now->copy()->addHours(4),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 99,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 0,
                'thoi_gian_mo_cong_check_in' => null,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // Sự kiện 803: Cho UC-OPS-02 Staff Check-in thành công khi Cổng Check-in mở
            // Bắt đầu: Hôm nay, đang diễn ra (now() - 2h đến now() + 6h), HAPPENING
            [
                'ma_su_kien' => 803,
                'ma_don_vi_to_chuc' => 1, // Khoa Hệ thống Thông tin
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 3,          // Phòng C109
                'ten_su_kien' => 'E2E: Diễn đàn Công nghệ Soát vé Check-in',
                'anh_bia' => 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop',
                'dien_gia' => 'Khoa Hệ thống Thông tin UIT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Nhân viên Soát vé Check-in thành công khi Cổng Check-in đang mở (UC-OPS-02)',
                'lo_trinh' => json_encode([
                    ['time' => '08:00', 'title' => 'Khai mạc & Mở Cổng Check-in'],
                    ['time' => '22:00', 'title' => 'Bế mạc sự kiện'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->subHours(2),
                'thoi_gian_ket_thuc' => $now->copy()->addHours(6),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 99,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'HAPPENING',
                'cong_check_in_mo' => 1,
                'thoi_gian_mo_cong_check_in' => $now->copy()->subHours(1),
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // Sự kiện 804: Cho UC-OPS-02 Cổng Check-in đang đóng (GATE_CLOSED 409)
            // Bắt đầu: Hôm nay, đang diễn ra (now() - 2h đến now() + 6h), HAPPENING, cong_check_in_mo = 0
            [
                'ma_su_kien' => 804,
                'ma_don_vi_to_chuc' => 1, // Khoa Hệ thống Thông tin
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 4,          // Phòng B114
                'ten_su_kien' => 'E2E: Sự kiện Cổng Check-in Đang Đóng',
                'anh_bia' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
                'dien_gia' => 'Khoa Hệ thống Thông tin UIT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Nhân viên Soát vé Check-in bị chặn GATE_CLOSED (409) do Cổng Check-in đang đóng (UC-OPS-02.EX.1)',
                'lo_trinh' => json_encode([
                    ['time' => '08:00', 'title' => 'Khai mạc chương trình'],
                    ['time' => '22:00', 'title' => 'Bế mạc chương trình'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->subHours(2),
                'thoi_gian_ket_thuc' => $now->copy()->addHours(6),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 99,
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
            DB::table('su_kien')->insert($event);

            // Đặt phòng chính thức CONFIRMED
            DB::table('dat_phong')->insert([
                'ma_phong' => $event['ma_phong'],
                'ma_su_kien' => $event['ma_su_kien'],
                'thoi_gian_bat_dau' => $event['thoi_gian_bat_dau'],
                'thoi_gian_ket_thuc' => $event['thoi_gian_ket_thuc'],
                'trang_thai' => 'CONFIRMED',
                'han_giu_cho_tam' => null,
                'ghi_chu' => 'Đặt phòng chính thức: '.$event['ten_su_kien'],
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ]);

            $this->command->info(sprintf(
                '[Event] ID: %d | %s | TT: %s | Bắt đầu: %s | Cổng In: %d',
                $event['ma_su_kien'],
                $event['ten_su_kien'],
                $event['trang_thai'],
                $event['thoi_gian_bat_dau']->toDateTimeString(),
                $event['cong_check_in_mo']
            ));
        }

        // -------------------------------------------------------------------------
        // 4. PHÂN CÔNG STAFF CHO SỰ KIỆN 803 & 804 (nhan_vien_check_in)
        // -------------------------------------------------------------------------
        $staffUser = $userMap['staff_e2e@gm.uit.edu.vn'];
        $hostOrganizer = DB::table('tai_khoan')->where('ma_don_vi_to_chuc', 1)->first();
        $assignerId = $hostOrganizer ? $hostOrganizer->ma_tai_khoan : $staffUser->ma_tai_khoan;

        $staffAssignments = [
            [
                'ma_tai_khoan' => $staffUser->ma_tai_khoan,
                'ma_su_kien' => 803,
                'nguoi_phan_cong' => $assignerId,
                'thoi_gian_phan_cong' => $now,
            ],
            [
                'ma_tai_khoan' => $staffUser->ma_tai_khoan,
                'ma_su_kien' => 804,
                'nguoi_phan_cong' => $assignerId,
                'thoi_gian_phan_cong' => $now,
            ],
        ];

        foreach ($staffAssignments as $assignment) {
            DB::table('nhan_vien_check_in')->insert($assignment);
            $this->command->info(sprintf(
                '[Staff] Phân công Staff ID %d (%s) vào Sự kiện %d',
                $assignment['ma_tai_khoan'],
                $staffUser->email,
                $assignment['ma_su_kien']
            ));
        }

        // -------------------------------------------------------------------------
        // 5. TẠO VÉ VÀ KÝ CHỮ KÝ HMAC QR (dang_ky)
        // -------------------------------------------------------------------------
        $ticketsConfig = [
            // Vé sự kiện 801: Sinh viên 1 (Hủy hợp lệ trước T-4h)
            [
                'label' => 'Vé 801 (sv_cancel_valid - Hủy hợp lệ trước T-4h)',
                'email' => 'sv_cancel_valid@gm.uit.edu.vn',
                'ma_su_kien' => 801,
                'ghi_chu' => 'E2E Fixture Ticket: UC-TCK-02 Hủy vé trước T-4h',
            ],
            // Vé sự kiện 802: Sinh viên 2 (Khóa hủy sau T-4h)
            [
                'label' => 'Vé 802 (sv_cancel_late - Khóa hủy sau T-4h)',
                'email' => 'sv_cancel_late@gm.uit.edu.vn',
                'ma_su_kien' => 802,
                'ghi_chu' => 'E2E Fixture Ticket: UC-TCK-02 Quá hạn T-4h',
            ],
            // Vé sự kiện 803: Sinh viên 3 (Staff check-in thành công)
            [
                'label' => 'Vé 803 (sv_checkin - Check-in thành công Cổng mở)',
                'email' => 'sv_checkin@gm.uit.edu.vn',
                'ma_su_kien' => 803,
                'ghi_chu' => 'E2E Fixture Ticket: UC-OPS-02 Check-in thành công',
            ],
            // Vé sự kiện 804: Sinh viên 3 (Cổng check-in đóng GATE_CLOSED)
            [
                'label' => 'Vé 804 (sv_checkin - Cổng Check-in đang đóng)',
                'email' => 'sv_checkin@gm.uit.edu.vn',
                'ma_su_kien' => 804,
                'ghi_chu' => 'E2E Fixture Ticket: UC-OPS-02 Cổng đóng GATE_CLOSED',
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
                'trang_thai' => 'DaDangKy',
                'thoi_gian_dang_ky' => $now->copy()->subHours(1),
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
                'ghi_chu' => $tc['ghi_chu'],
            ]);

            $summaryTickets[] = [
                'label' => $tc['label'],
                'ticket_id' => $ticketId,
                'event_id' => $tc['ma_su_kien'],
                'user_id' => $user->ma_tai_khoan,
                'email' => $user->email,
                'uuid' => $uuid,
                'qr_code' => $qrCode,
            ];

            $this->command->info(sprintf(
                '[Ticket] ID: %d | Event: %d | User ID: %d (%s) | UUID: %s',
                $ticketId,
                $tc['ma_su_kien'],
                $user->ma_tai_khoan,
                $user->email,
                $uuid
            ));
            $this->command->line("  -> QR: {$qrCode}");
        }

        // -------------------------------------------------------------------------
        // 6. TỔNG KẾT DỮ LIỆU ĐÃ TẠO
        // -------------------------------------------------------------------------
        $this->command->info('======================================================================');
        $this->command->info('=== TỔNG KẾT DỮ LIỆU E2E FIXTURES (UC-TCK-02 & UC-OPS-02)          ===');
        $this->command->info('======================================================================');
        $this->command->table(
            ['Mục', 'Mã Sự Kiện', 'Mã Vé ID', 'User ID', 'Email', 'UUID Vé'],
            array_map(fn ($t) => [
                $t['label'],
                $t['event_id'],
                $t['ticket_id'],
                $t['user_id'],
                $t['email'],
                $t['uuid'],
            ], $summaryTickets)
        );

        $this->command->info('=== HOÀN TẤT THIẾT LẬP E2E FIXTURES THÀNH CÔNG ===');
    }
}
