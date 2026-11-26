<?php

namespace Database\Seeders;

use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class E2EFeedCertDrlFixtureSeeder extends Seeder
{
    /**
     * Run the database seeds for E2E Fixtures:
     * - UC-FEED-01: Khảo sát Đánh giá Chất lượng Sự kiện (Thời hạn 48h & Ân hạn)
     * - UC-CERT-01: Cấp Giấy chứng nhận số HMAC-SHA256, Che mờ PII & Thu hồi Chứng nhận
     * - UC-DRL-01: Khóa Chốt Danh sách & Kết xuất File Điểm Rèn Luyện (Chuẩn Mẫu CTSV)
     */
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $cryptoService = app(CryptoService::class);

        $this->command->info('======================================================================');
        $this->command->info('=== BẮT ĐẦU THIẾT LẬP E2E FIXTURES (UC-FEED-01, CERT-01, DRL-01)   ===');
        $this->command->info('======================================================================');

        // -------------------------------------------------------------------------
        // 1. TÀI KHOẢN NGƯỜI DÙNG (Admin, BTC ToChuc, SinhVien 1, 2, 3)
        // -------------------------------------------------------------------------
        $accounts = [
            // 1.1 Admin Hệ thống (P.CTSV)
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
                'ma_don_vi_to_chuc' => 7, // P.CTSV
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            // 1.2 Ban Tổ chức Khoa Hệ thống Thông tin (Host sự kiện)
            [
                'email' => 'httt@uit.edu.vn',
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
            // 1.3 Sinh viên 1: Nguyễn Văn An (MSSV: 22520001)
            [
                'email' => 'sv1@gm.uit.edu.vn',
                'mssv' => '22520001',
                'ho_ten' => 'Nguyễn Văn An',
                'mat_khau' => Hash::make('Password123@', $passwordCost),
                'so_dien_thoai' => '0901000001',
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
            // 1.4 Sinh viên 2: Trần Thị Bình (MSSV: 22520002)
            [
                'email' => 'sv2@gm.uit.edu.vn',
                'mssv' => '22520002',
                'ho_ten' => 'Trần Thị Bình',
                'mat_khau' => Hash::make('Password123@', $passwordCost),
                'so_dien_thoai' => '0901000002',
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
            // 1.5 Sinh viên 3: Lê Văn Cường (MSSV: 22520003)
            [
                'email' => 'sv3@gm.uit.edu.vn',
                'mssv' => '22520003',
                'ho_ten' => 'Lê Văn Cường',
                'mat_khau' => Hash::make('Password123@', $passwordCost),
                'so_dien_thoai' => '0901000003',
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
            $query = DB::table('tai_khoan');
            if (! empty($acc['mssv'])) {
                $query->where(function ($q) use ($acc) {
                    $q->where('mssv', $acc['mssv'])
                        ->orWhere('email', $acc['email']);
                });
            } else {
                $query->where('email', $acc['email']);
            }
            $existing = $query->first();

            $record = array_merge($acc, [
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
            if (! empty($acc['mssv'])) {
                $userMap[$acc['mssv']] = $freshUser;
            }

            $this->command->info(sprintf(
                '[User] ID: %d | MSSV: %-8s | %-32s | %-24s | Role: %s',
                $userId,
                $acc['mssv'] ?? 'N/A',
                $acc['ho_ten'],
                $acc['email'],
                $acc['loai_tai_khoan']
            ));
        }

        // -------------------------------------------------------------------------
        // 2. DỌN DẸP DỮ LIỆU CŨ CHO FIXTURE (SỰ KIỆN 951, 952, 953 & VÉ LIÊN QUAN)
        // -------------------------------------------------------------------------
        $fixtureEventIds = [951, 952, 953];
        $fixtureTicketIds = [95101, 95102, 95201, 95301, 95302, 95303];

        // Xóa các bảng liên quan đến vé (Certificate, Feedback, Check-in Log, Tickets)
        DB::table('chung_nhan')->whereIn('ma_dang_ky', $fixtureTicketIds)->delete();
        DB::table('danh_gia_feedback')->whereIn('ma_dang_ky', $fixtureTicketIds)->delete();
        DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $fixtureTicketIds)->delete();
        DB::table('dang_ky')->whereIn('ma_dang_ky', $fixtureTicketIds)->delete();

        // Xóa vé theo event IDs phòng ngừa vé phát sinh
        $extraTicketIds = DB::table('dang_ky')->whereIn('ma_su_kien', $fixtureEventIds)->pluck('ma_dang_ky');
        if ($extraTicketIds->isNotEmpty()) {
            DB::table('chung_nhan')->whereIn('ma_dang_ky', $extraTicketIds)->delete();
            DB::table('danh_gia_feedback')->whereIn('ma_dang_ky', $extraTicketIds)->delete();
            DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $extraTicketIds)->delete();
            DB::table('dang_ky')->whereIn('ma_dang_ky', $extraTicketIds)->delete();
        }

        // Xóa các bảng con của sự kiện
        DB::table('nhat_ky_kiem_duyet')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('nhan_vien_check_in')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('phien_kiosk')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('hang_doi_waitlist')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien_dong_to_chuc')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('thong_ke_su_kien_ngay')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('dat_phong')->whereIn('ma_su_kien', $fixtureEventIds)->delete();
        DB::table('su_kien')->whereIn('ma_su_kien', $fixtureEventIds)->delete();

        // -------------------------------------------------------------------------
        // 3. THIẾT LẬP CÁC SỰ KIỆN THỬ NGHIỆM (KỊCH BẢN A, B, C)
        // -------------------------------------------------------------------------
        // Mốc thời gian tương đối
        $timeEndA = $now->copy()->subHours(2);
        $timeStartA = $timeEndA->copy()->subHours(3);

        $timeEndB = $now->copy()->subHours(72);
        $timeStartB = $timeEndB->copy()->subHours(3);

        $timeEndC = $now->copy()->subHours(50);
        $timeStartC = $timeEndC->copy()->subHours(3);

        $events = [
            // Kịch bản A (951): Vừa kết thúc 2 giờ trước (trong hạn 48h)
            // Phục vụ: UC-FEED-01 Normal & UC-CERT-01 Normal / Revoke
            [
                'ma_su_kien' => 951,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 1,          // Hội trường E
                'ten_su_kien' => 'E2E-FEED-CERT: Hội thảo Điện toán Đám mây & AI (Vừa kết thúc 2 giờ trước)',
                'anh_bia' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
                'dien_gia' => 'TS. Nguyễn Văn Giảng Viên & Ban Chấp Hành HTTT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Nộp Feedback luồng chính trong hạn 48h (UC-FEED-01) và Cấp/Thu hồi Giấy chứng nhận HMAC (UC-CERT-01)',
                'lo_trinh' => json_encode([
                    ['time' => '13:30', 'title' => 'Mở cổng Check-in'],
                    ['time' => '17:00', 'title' => 'Bế mạc sự kiện'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $timeStartA->copy()->subDays(5),
                'thoi_gian_bat_dau' => $timeStartA,
                'thoi_gian_ket_thuc' => $timeEndA,
                'thoi_gian_ket_thuc_thuc_te' => $timeEndA,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 50,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 1,
                'thoi_gian_mo_cong_check_in' => $timeStartA,
                'cong_check_out_mo' => 1,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // Kịch bản B (952): Đã kết thúc 72 giờ trước (quá hạn 48h)
            // Phục vụ: UC-FEED-01.EX.1 Chặn quá hạn 48h & UC-FEED-01.AC.1 Admin mở ân hạn 24h
            [
                'ma_su_kien' => 952,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 2,          // Hội trường A
                'ten_su_kien' => 'E2E-FEED-GRACE: Workshop An toàn Thông tin & Phòng chống Mã độc (Đã kết thúc 72 giờ trước)',
                'anh_bia' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
                'dien_gia' => 'Chuyên gia An ninh mạng UIT',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Chặn nộp Feedback quá hạn 48 giờ và Admin cấp ân hạn 24 giờ (UC-FEED-01.EX.1, UC-FEED-01.AC.1)',
                'lo_trinh' => json_encode([
                    ['time' => '08:00', 'title' => 'Bắt đầu Workshop'],
                    ['time' => '11:30', 'title' => 'Bế mạc Workshop'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $timeStartB->copy()->subDays(5),
                'thoi_gian_bat_dau' => $timeStartB,
                'thoi_gian_ket_thuc' => $timeEndB,
                'thoi_gian_ket_thuc_thuc_te' => $timeEndB,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 50,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 1,
                'thoi_gian_mo_cong_check_in' => $timeStartB,
                'cong_check_out_mo' => 1,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],

            // Kịch bản C (953): Đã kết thúc 50 giờ trước (> 48h), da_chot_drl = 0
            // Phục vụ: UC-DRL-01 Khóa chốt ĐRL, Kết xuất Excel CTSV và Admin mở khóa
            [
                'ma_su_kien' => 953,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1,      // Công nghệ
                'ma_phong' => 3,          // Phòng C109
                'ten_su_kien' => 'E2E-DRL-LOCK: Tọa đàm Hướng nghiệp và Kết nối Doanh nghiệp IT (Đã kết thúc 50 giờ trước)',
                'anh_bia' => 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop',
                'dien_gia' => 'Đại diện Doanh nghiệp IT Top đầu',
                'mo_ta' => 'Sự kiện kiểm thử E2E: Xem danh sách ĐRL, Khóa chốt ĐRL (da_chot_drl = 1), Xuất Excel chuẩn CTSV, Admin Mở khóa (UC-DRL-01)',
                'lo_trinh' => json_encode([
                    ['time' => '13:00', 'title' => 'Khai mạc tọa đàm'],
                    ['time' => '16:30', 'title' => 'Bế mạc tọa đàm'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $timeStartC->copy()->subDays(5),
                'thoi_gian_bat_dau' => $timeStartC,
                'thoi_gian_ket_thuc' => $timeEndC,
                'thoi_gian_ket_thuc_thuc_te' => $timeEndC,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 50,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 1,
                'thoi_gian_mo_cong_check_in' => $timeStartC,
                'cong_check_out_mo' => 1,
                'da_chot_drl' => 0,
                'thoi_gian_chot_drl' => null,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        foreach ($events as $event) {
            DB::table('su_kien')->insert($event);

            // Đặt phòng tương ứng (CONFIRMED)
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
                '[Event] ID: %d | %s | TT: %s | Kết thúc: %s | da_chot_drl: %d',
                $event['ma_su_kien'],
                $event['ten_su_kien'],
                $event['trang_thai'],
                $event['thoi_gian_ket_thuc']->toDateTimeString(),
                $event['da_chot_drl']
            ));
        }

        // -------------------------------------------------------------------------
        // 4. THIẾT LẬP VÉ VÀ TRẠNG THÁI KIỂM THỬ (dang_ky)
        // -------------------------------------------------------------------------
        $student1 = $userMap['sv1@gm.uit.edu.vn'];
        $student2 = $userMap['sv2@gm.uit.edu.vn'];
        $student3 = $userMap['sv3@gm.uit.edu.vn'];

        $ticketsConfig = [
            // 4.1 Vé A1 (ID 95101, Sự kiện 951, SV1):
            // Trang thai DaCheckOut, da_feedback = 0, du_dieu_kien_drl = 0
            // Phục vụ: Test submit feedback luồng chính trong hạn 48h
            [
                'ma_dang_ky' => 95101,
                'ma_su_kien' => 951,
                'user' => $student1,
                'ma_ve_uuid' => '95101000-0000-4000-8000-000000095101',
                'thoi_gian_check_in' => $timeStartA,
                'thoi_gian_check_out' => $timeEndA,
                'ti_le_drl' => 1.00,
                'tham_gia_tron_ven' => 1,
                'tham_gia_mot_phan' => 0,
                'da_feedback' => 0,
                'han_an_han_feedback' => null,
                'du_dieu_kien_drl' => 0,
                'has_feedback_record' => false,
                'has_cert_record' => false,
                'muc_dich' => 'Test Submit Feedback trong hạn 48h (UC-FEED-01 Normal)',
            ],

            // 4.2 Vé A2 (ID 95102, Sự kiện 951, SV2):
            // Trang thai DaCheckOut, da_feedback = 1, du_dieu_kien_drl = 1
            // Phục vụ: Test cấp Giấy chứng nhận HMAC, verify public che PII, và Admin thu hồi
            [
                'ma_dang_ky' => 95102,
                'ma_su_kien' => 951,
                'user' => $student2,
                'ma_ve_uuid' => '95102000-0000-4000-8000-000000095102',
                'thoi_gian_check_in' => $timeStartA,
                'thoi_gian_check_out' => $timeEndA,
                'ti_le_drl' => 1.00,
                'tham_gia_tron_ven' => 1,
                'tham_gia_mot_phan' => 0,
                'da_feedback' => 1,
                'han_an_han_feedback' => null,
                'du_dieu_kien_drl' => 1,
                'has_feedback_record' => true,
                'has_cert_record' => false, // Chưa cấp ban đầu để test luồng issue certificate
                'muc_dich' => 'Test Cấp Cert HMAC, Verify PII & Thu hồi (UC-CERT-01 Normal/Revoke)',
            ],

            // 4.3 Vé B1 (ID 95201, Sự kiện 952, SV1):
            // Trang thai DaCheckOut, ket thuc 72h truoc, da_feedback = 0, han_an_han_feedback = NULL
            // Phục vụ: Test chặn feedback sau 48h (409) & sau đó Admin mở ân hạn 24h
            [
                'ma_dang_ky' => 95201,
                'ma_su_kien' => 952,
                'user' => $student1,
                'ma_ve_uuid' => '95201000-0000-4000-8000-000000095201',
                'thoi_gian_check_in' => $timeStartB,
                'thoi_gian_check_out' => $timeEndB,
                'ti_le_drl' => 1.00,
                'tham_gia_tron_ven' => 1,
                'tham_gia_mot_phan' => 0,
                'da_feedback' => 0,
                'han_an_han_feedback' => null,
                'du_dieu_kien_drl' => 0,
                'has_feedback_record' => false,
                'has_cert_record' => false,
                'muc_dich' => 'Test Chặn Feedback hết hạn 48h & Admin mở ân hạn 24h (UC-FEED-01.EX.1/AC.1)',
            ],

            // 4.4 Vé C1 (ID 95301, Sự kiện 953, SV1):
            // Trang thai DaCheckOut, da_feedback = 1, du_dieu_kien_drl = 1 (100% ĐRL)
            [
                'ma_dang_ky' => 95301,
                'ma_su_kien' => 953,
                'user' => $student1,
                'ma_ve_uuid' => '95301000-0000-4000-8000-000000095301',
                'thoi_gian_check_in' => $timeStartC,
                'thoi_gian_check_out' => $timeEndC,
                'ti_le_drl' => 1.00,
                'tham_gia_tron_ven' => 1,
                'tham_gia_mot_phan' => 0,
                'da_feedback' => 1,
                'han_an_han_feedback' => null,
                'du_dieu_kien_drl' => 1,
                'has_feedback_record' => true,
                'has_cert_record' => false,
                'muc_dich' => 'Phục vụ danh sách ĐRL (SV1 100% ĐRL = 5.0) - UC-DRL-01',
            ],

            // 4.5 Vé C2 (ID 95302, Sự kiện 953, SV2):
            // Trang thai DaCheckOut, da_feedback = 1, du_dieu_kien_drl = 1 (100% ĐRL)
            [
                'ma_dang_ky' => 95302,
                'ma_su_kien' => 953,
                'user' => $student2,
                'ma_ve_uuid' => '95302000-0000-4000-8000-000000095302',
                'thoi_gian_check_in' => $timeStartC,
                'thoi_gian_check_out' => $timeEndC,
                'ti_le_drl' => 1.00,
                'tham_gia_tron_ven' => 1,
                'tham_gia_mot_phan' => 0,
                'da_feedback' => 1,
                'han_an_han_feedback' => null,
                'du_dieu_kien_drl' => 1,
                'has_feedback_record' => true,
                'has_cert_record' => false,
                'muc_dich' => 'Phục vụ danh sách ĐRL (SV2 100% ĐRL = 5.0) - UC-DRL-01',
            ],

            // 4.6 Vé C3 (ID 95303, Sự kiện 953, SV3):
            // Trang thai DaCheckOut, da_feedback = 1, du_dieu_kien_drl = 1 (50% ĐRL)
            [
                'ma_dang_ky' => 95303,
                'ma_su_kien' => 953,
                'user' => $student3,
                'ma_ve_uuid' => '95303000-0000-4000-8000-000000095303',
                'thoi_gian_check_in' => $timeStartC,
                'thoi_gian_check_out' => $timeStartC->copy()->addMinutes(90),
                'ti_le_drl' => 0.50,
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 1,
                'da_feedback' => 1,
                'han_an_han_feedback' => null,
                'du_dieu_kien_drl' => 1,
                'has_feedback_record' => true,
                'has_cert_record' => false,
                'muc_dich' => 'Phục vụ danh sách ĐRL (SV3 50% ĐRL = 2.5) - UC-DRL-01',
            ],
        ];

        $summaryTickets = [];

        foreach ($ticketsConfig as $tc) {
            $user = $tc['user'];
            $uuid = $tc['ma_ve_uuid'];
            $signature = $cryptoService->signTicket($uuid, (int) $user->ma_tai_khoan, (int) $tc['ma_su_kien']);

            DB::table('dang_ky')->insert([
                'ma_dang_ky' => $tc['ma_dang_ky'],
                'ma_tai_khoan' => $user->ma_tai_khoan,
                'ma_su_kien' => $tc['ma_su_kien'],
                'ma_ve_uuid' => $uuid,
                'chu_ky_hmac' => $signature,
                'trang_thai' => 'DaCheckOut',
                'thoi_gian_dang_ky' => $tc['thoi_gian_check_in']->copy()->subDays(2),
                'thoi_gian_check_in' => $tc['thoi_gian_check_in'],
                'thoi_gian_check_out' => $tc['thoi_gian_check_out'],
                'thoi_gian_huy' => null,
                'ly_do_huy' => null,
                'da_check_in' => 1,
                'da_check_out' => 1,
                'ma_thiet_bi_check_in' => 'KIOSK_E2E_IN',
                'ma_thiet_bi_check_out' => 'KIOSK_E2E_OUT',
                'ma_thiet_bi_nghi_van' => null,
                'nghi_van_gian_lan' => 0,
                'tham_gia_tron_ven' => $tc['tham_gia_tron_ven'],
                'tham_gia_mot_phan' => $tc['tham_gia_mot_phan'],
                'ti_le_drl' => $tc['ti_le_drl'],
                'da_feedback' => $tc['da_feedback'],
                'han_an_han_feedback' => $tc['han_an_han_feedback'],
                'du_dieu_kien_drl' => $tc['du_dieu_kien_drl'],
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 0,
                'ghi_chu' => $tc['muc_dich'],
            ]);

            // Nếu vé đã feedback, thêm bản ghi khảo sát vào bảng danh_gia_feedback
            if ($tc['has_feedback_record']) {
                DB::table('danh_gia_feedback')->insert([
                    'ma_dang_ky' => $tc['ma_dang_ky'],
                    'ma_su_kien' => $tc['ma_su_kien'],
                    'diem_noi_dung' => 5,
                    'diem_dien_gia' => 5,
                    'diem_to_chuc' => 5,
                    'y_kien_dong_gop' => 'Nội dung sự kiện rất thiết thực và tổ chức chuyên nghiệp.',
                    'thoi_gian_gui' => $tc['thoi_gian_check_out']->copy()->addHours(1),
                ]);
            }

            $summaryTickets[] = [
                'muc_dich' => $tc['muc_dich'],
                'ma_su_kien' => $tc['ma_su_kien'],
                'ma_dang_ky' => $tc['ma_dang_ky'],
                'mssv' => $user->mssv,
                'email' => $user->email,
                'da_feedback' => $tc['da_feedback'],
                'du_drl' => $tc['du_dieu_kien_drl'],
            ];

            $this->command->info(sprintf(
                '[Ticket] ID: %d | Event: %d | SV: %s (%s) | Feedback: %d | ĐRL: %d',
                $tc['ma_dang_ky'],
                $tc['ma_su_kien'],
                $user->ho_ten,
                $user->email,
                $tc['da_feedback'],
                $tc['du_dieu_kien_drl']
            ));
        }

        // -------------------------------------------------------------------------
        // 5. TỔNG KẾT VÀ BÁO CÁO BÀN GIAO FIXTURE
        // -------------------------------------------------------------------------
        $this->command->info('======================================================================');
        $this->command->info('=== TỔNG KẾT DỮ LIỆU E2E FIXTURES (UC-FEED-01, CERT-01, DRL-01)   ===');
        $this->command->info('======================================================================');
        $this->command->table(
            ['Mục tiêu kịch bản', 'Sự kiện ID', 'Vé ID', 'MSSV', 'Email', 'Đã Feedback', 'Đủ ĐRL'],
            array_map(fn ($t) => [
                $t['muc_dich'],
                $t['ma_su_kien'],
                $t['ma_dang_ky'],
                $t['mssv'] ?? 'N/A',
                $t['email'],
                $t['da_feedback'] ? 'Đã FB (1)' : 'Chưa FB (0)',
                $t['du_drl'] ? 'Đạt ĐRL (1)' : 'Chưa đạt (0)',
            ], $summaryTickets)
        );

        $this->command->info('=== HOÀN TẤT THIẾT LẬP E2E FEED-CERT-DRL FIXTURES THÀNH CÔNG ===');
    }
}
