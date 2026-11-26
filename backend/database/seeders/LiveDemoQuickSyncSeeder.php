<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LiveDemoQuickSyncSeeder extends Seeder
{
    /**
     * Đồng bộ tài khoản quick-login Sinh viên / CTV và tạo thêm 4 sự kiện
     * đang mở đăng ký (theo giờ Asia/Ho_Chi_Minh) mà không xóa dữ liệu hiện có.
     */
    public function run(): void
    {
        $now = Carbon::now('Asia/Ho_Chi_Minh');
        $passwordCost = ['cost' => 12];

        DB::transaction(function () use ($now, $passwordCost): void {
            // 1. Đồng bộ mật khẩu / tài khoản quick-login Sinh viên & CTV
            $quickAccounts = [
                [
                    'email' => '22520001@gm.uit.edu.vn',
                    'mssv' => '22520001',
                    'ho_ten' => 'Nguyễn Văn An',
                    'password' => 'Student@123',
                    'so_dien_thoai' => '0912345678',
                ],
                [
                    'email' => '22521999@gm.uit.edu.vn',
                    'mssv' => '22521999',
                    'ho_ten' => 'Trần Minh Phúc (CTV Soát vé)',
                    'password' => 'Checkin@123',
                    'so_dien_thoai' => '0909888777',
                ],
            ];

            foreach ($quickAccounts as $acc) {
                $existing = DB::table('tai_khoan')->where('email', $acc['email'])->first();

                if ($existing) {
                    DB::table('tai_khoan')
                        ->where('ma_tai_khoan', $existing->ma_tai_khoan)
                        ->update([
                            'mat_khau' => Hash::make($acc['password'], $passwordCost),
                            'hoat_dong' => 1,
                            'buoc_doi_mat_khau' => 0,
                            'thoi_gian_cap_nhat' => $now,
                        ]);
                    $this->command?->info("[Cập nhật mật khẩu] {$acc['email']}");
                } else {
                    DB::table('tai_khoan')->insert([
                        'mssv' => $acc['mssv'],
                        'email' => $acc['email'],
                        'ho_ten' => $acc['ho_ten'],
                        'mat_khau' => Hash::make($acc['password'], $passwordCost),
                        'so_dien_thoai' => $acc['so_dien_thoai'],
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
                    $this->command?->info("[Tạo mới tài khoản] {$acc['email']}");
                }
            }

            // 2. Tạo 4 sự kiện mẫu đang mở đăng ký (ID 951-954) theo giờ Việt Nam
            $upcomingEvents = [
                [
                    'ma_su_kien' => 951,
                    'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                    'ma_chuyen_de' => 1, // Công nghệ
                    'ma_phong' => 1, // Hội trường A
                    'ten_su_kien' => 'Ngày hội Nghề nghiệp AI & Kỹ thuật Dữ liệu 2026',
                    'anh_bia' => 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
                    'dien_gia' => 'TS. Nguyễn Minh Anh – Chuyên gia AI Viettel',
                    'mo_ta' => 'Cơ hội kết nối nghề nghiệp, phỏng vấn trực tiếp cùng hơn 30 doanh nghiệp công nghệ hàng đầu trong lĩnh vực Trí tuệ Nhân tạo và Khoa học Dữ liệu.',
                    'lo_trinh' => json_encode([
                        ['time' => '08:30 - 09:00', 'title' => 'Đón tiếp và Check-in Kiosk'],
                        ['time' => '09:00 - 10:30', 'title' => 'Tọa đàm Xu hướng AI & Big Data 2026'],
                        ['time' => '10:30 - 11:30', 'title' => 'Phỏng vấn thử và kết nối doanh nghiệp'],
                    ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                    'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                    'ngay_cong_bo' => $now->copy()->subDays(1),
                    'thoi_gian_bat_dau' => $now->copy()->addDays(2)->setTime(8, 30, 0),
                    'thoi_gian_ket_thuc' => $now->copy()->addDays(2)->setTime(11, 30, 0),
                    'khong_gioi_han_slot' => 0,
                    'so_luong_toi_da' => 200,
                    'so_ve_con_lai' => 180,
                    'thoi_diem_het_ve' => null,
                    'dieu_khoan_drl' => 'Dieu3',
                    'diem_drl_du_kien' => 5,
                ],
                [
                    'ma_su_kien' => 952,
                    'ma_don_vi_to_chuc' => 9, // CLB WebDev
                    'ma_chuyen_de' => 1, // Công nghệ
                    'ma_phong' => 5, // Hội trường E
                    'ten_su_kien' => 'Hội thảo Điện toán Đám mây & Thực hành DevOps',
                    'anh_bia' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
                    'dien_gia' => 'Trần Quốc Bảo – Cloud Architect tại AWS',
                    'mo_ta' => 'Thực chiến triển khai hạ tầng CI/CD, container hóa ứng dụng với Docker, Kubernetes và giám sát hệ thống production trên nền tảng AWS Cloud.',
                    'lo_trinh' => json_encode([
                        ['time' => '14:00 - 14:30', 'title' => 'Check-in và cài đặt môi trường lab'],
                        ['time' => '14:30 - 16:00', 'title' => 'Thực hành Kubernetes & CI/CD Pipeline'],
                        ['time' => '16:00 - 17:00', 'title' => 'Hỏi đáp kỹ thuật & trao chứng nhận'],
                    ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                    'doi_tuong_tham_gia' => 'Sinh viên đam mê Cloud & DevOps',
                    'ngay_cong_bo' => $now->copy()->subDays(1),
                    'thoi_gian_bat_dau' => $now->copy()->addDays(4)->setTime(14, 0, 0),
                    'thoi_gian_ket_thuc' => $now->copy()->addDays(4)->setTime(17, 0, 0),
                    'khong_gioi_han_slot' => 0,
                    'so_luong_toi_da' => 150,
                    'so_ve_con_lai' => 120,
                    'thoi_diem_het_ve' => null,
                    'dieu_khoan_drl' => 'Dieu3',
                    'diem_drl_du_kien' => 5,
                ],
                [
                    'ma_su_kien' => 953,
                    'ma_don_vi_to_chuc' => 7, // P.CTSV
                    'ma_chuyen_de' => 4, // Kỹ năng mềm
                    'ma_phong' => 2, // Phòng B114 / CS2
                    'ten_su_kien' => 'Workshop Kỹ năng Lãnh đạo & Thuyết trình Chuyên nghiệp',
                    'anh_bia' => 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop',
                    'dien_gia' => 'Lê Hoàng Yến – Chuyên gia Đào tạo Kỹ năng mềm',
                    'mo_ta' => 'Rèn luyện phong thái tự tin trước đám đông, phương pháp xây dựng slide thuyết phục, kỹ năng điều phối cuộc họp và dẫn dắt đội ngũ dự án hiệu quả.',
                    'lo_trinh' => json_encode([
                        ['time' => '09:00 - 09:30', 'title' => 'Khởi động & Mini games tương tác'],
                        ['time' => '09:30 - 11:00', 'title' => 'Chiến lược thuyết trình & Thực hành'],
                        ['time' => '11:00 - 11:30', 'title' => 'Tổng kết và công nhận ĐRL'],
                    ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                    'doi_tuong_tham_gia' => 'Cán bộ Lớp, Đoàn - Hội và sinh viên UIT',
                    'ngay_cong_bo' => $now->copy()->subDays(2),
                    'thoi_gian_bat_dau' => $now->copy()->addDays(6)->setTime(9, 0, 0),
                    'thoi_gian_ket_thuc' => $now->copy()->addDays(6)->setTime(11, 30, 0),
                    'khong_gioi_han_slot' => 0,
                    'so_luong_toi_da' => 100,
                    'so_ve_con_lai' => 0, // Hết chỗ để test Waitlist FIFO
                    'thoi_diem_het_ve' => $now,
                    'dieu_khoan_drl' => 'Dieu4',
                    'diem_drl_du_kien' => 4,
                ],
                [
                    'ma_su_kien' => 954,
                    'ma_don_vi_to_chuc' => 8, // Đoàn Thanh niên
                    'ma_chuyen_de' => 2, // Học thuật
                    'ma_phong' => 3, // Phòng C109
                    'ten_su_kien' => 'Seminar Blockchain & Smart Contracts Thực chiến',
                    'anh_bia' => 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop',
                    'dien_gia' => 'ThS. Đặng Minh Tuấn – Trưởng Lab Blockchain',
                    'mo_ta' => 'Chuyên đề nghiên cứu ứng dụng công nghệ chuỗi khối trong xác thực văn bằng và chứng chỉ số sinh viên theo Nghị định 13.',
                    'lo_trinh' => json_encode([
                        ['time' => '14:00 - 14:30', 'title' => 'Tổng quan kiến trúc EVM'],
                        ['time' => '14:30 - 16:00', 'title' => 'Viết Smart Contract với Solidity'],
                        ['time' => '16:00 - 16:30', 'title' => 'Q&A và Check-out nhận ĐRL'],
                    ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                    'doi_tuong_tham_gia' => 'Sinh viên CNTT toàn trường',
                    'ngay_cong_bo' => $now->copy()->subDays(1),
                    'thoi_gian_bat_dau' => $now->copy()->addDays(8)->setTime(14, 0, 0),
                    'thoi_gian_ket_thuc' => $now->copy()->addDays(8)->setTime(16, 30, 0),
                    'khong_gioi_han_slot' => 0,
                    'so_luong_toi_da' => 80,
                    'so_ve_con_lai' => 80,
                    'thoi_diem_het_ve' => null,
                    'dieu_khoan_drl' => 'Dieu3',
                    'diem_drl_du_kien' => 5,
                ],
            ];

            foreach ($upcomingEvents as $evt) {
                if (DB::table('su_kien')->where('ma_su_kien', $evt['ma_su_kien'])->exists()) {
                    $this->command?->line("[Bỏ qua] Sự kiện {$evt['ma_su_kien']} đã tồn tại.");
                    continue;
                }

                DB::table('su_kien')->insert([
                    'ma_su_kien' => $evt['ma_su_kien'],
                    'ma_don_vi_to_chuc' => $evt['ma_don_vi_to_chuc'],
                    'ma_chuyen_de' => $evt['ma_chuyen_de'],
                    'ma_phong' => $evt['ma_phong'],
                    'ten_su_kien' => $evt['ten_su_kien'],
                    'anh_bia' => $evt['anh_bia'],
                    'dien_gia' => $evt['dien_gia'],
                    'mo_ta' => $evt['mo_ta'],
                    'lo_trinh' => $evt['lo_trinh'],
                    'doi_tuong_tham_gia' => $evt['doi_tuong_tham_gia'],
                    'ngay_cong_bo' => $evt['ngay_cong_bo'],
                    'thoi_gian_bat_dau' => $evt['thoi_gian_bat_dau'],
                    'thoi_gian_ket_thuc' => $evt['thoi_gian_ket_thuc'],
                    'thoi_gian_ket_thuc_thuc_te' => null,
                    'khong_gioi_han_slot' => $evt['khong_gioi_han_slot'],
                    'so_luong_toi_da' => $evt['so_luong_toi_da'],
                    'so_ve_con_lai' => $evt['so_ve_con_lai'],
                    'so_slot_dong_bang' => 0,
                    'thoi_diem_het_ve' => $evt['thoi_diem_het_ve'],
                    'dieu_khoan_drl' => $evt['dieu_khoan_drl'],
                    'diem_drl_du_kien' => $evt['diem_drl_du_kien'],
                    'gio_tinh_nguyen' => 0.0,
                    'trang_thai' => 'PUBLISHED',
                    'cong_check_in_mo' => 0,
                    'thoi_gian_mo_cong_check_in' => null,
                    'cong_check_out_mo' => 0,
                    'da_chot_drl' => 0,
                    'thoi_gian_chot_drl' => null,
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ]);

                DB::table('dat_phong')->insert([
                    'ma_phong' => $evt['ma_phong'],
                    'ma_su_kien' => $evt['ma_su_kien'],
                    'thoi_gian_bat_dau' => $evt['thoi_gian_bat_dau'],
                    'thoi_gian_ket_thuc' => $evt['thoi_gian_ket_thuc'],
                    'trang_thai' => 'CONFIRMED',
                    'han_giu_cho_tam' => null,
                    'ghi_chu' => 'Đặt phòng sự kiện mẫu đang mở đăng ký.',
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ]);

                $this->command?->info("[Tạo sự kiện] ID {$evt['ma_su_kien']} | {$evt['ten_su_kien']}");
            }
        });

        $this->command?->info('=== HOÀN TẤT ĐỒNG BỘ QUICK-LOGIN & SEED 4 SỰ KIỆN ĐANG MỞ ===');
    }
}
