<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SuKienSeeder extends Seeder
{
    /**
     * Seed danh sách sự kiện mẫu ban đầu cho Discovery và Quản trị (Phase 2).
     */
    public function run(): void
    {
        $now = now();

        $events = [
            [
                'ma_su_kien' => 101,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1, // AI & Data
                'ma_phong' => 1, // Hội trường A
                'ten_su_kien' => 'Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026',
                'anh_bia' => 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
                'dien_gia' => 'TS. Nguyễn Minh Anh – Chuyên gia AI Viettel',
                'mo_ta' => 'Cơ hội kết nối nghề nghiệp, phỏng vấn trực tiếp cùng hơn 30 doanh nghiệp công nghệ hàng đầu trong lĩnh vực Trí tuệ Nhân tạo và Khoa học Dữ liệu.',
                'lo_trinh' => json_encode([
                    ['time' => '08:30 - 09:00', 'title' => 'Đón tiếp và Check-in Kiosk'],
                    ['time' => '09:00 - 10:30', 'title' => 'Tọa đàm Xu hướng AI & Big Data 2026'],
                    ['time' => '10:30 - 11:30', 'title' => 'Phỏng vấn thử và kết nối doanh nghiệp'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(5),
                'thoi_gian_bat_dau' => '2026-11-20 08:30:00',
                'thoi_gian_ket_thuc' => '2026-11-20 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 200,
                'so_ve_con_lai' => 20,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_su_kien' => 102,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1,
                'ma_phong' => 5, // Hội trường E
                'ten_su_kien' => 'Hội thảo Điện toán đám mây & Thực hành DevOps',
                'anh_bia' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
                'dien_gia' => 'Trần Quốc Bảo – Cloud Architect tại AWS',
                'mo_ta' => 'Thực chiến triển khai hạ tầng CI/CD, container hóa ứng dụng với Docker, Kubernetes và giám sát hệ thống production trên nền tảng AWS Cloud.',
                'lo_trinh' => json_encode([
                    ['time' => '14:00 - 14:30', 'title' => 'Check-in và cài đặt môi trường lab'],
                    ['time' => '14:30 - 16:00', 'title' => 'Thực hành Kubernetes & CI/CD Pipeline'],
                    ['time' => '16:00 - 17:00', 'title' => 'Hỏi đáp kỹ thuật & trao chứng nhận'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên đam mê Cloud & DevOps',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => '2026-11-22 14:00:00',
                'thoi_gian_ket_thuc' => '2026-11-22 17:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 150,
                'so_ve_con_lai' => 55,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_su_kien' => 103,
                'ma_don_vi_to_chuc' => 7, // P.CTSV
                'ma_chuyen_de' => 2, // Kỹ năng mềm
                'ma_phong' => 2, // Hội trường B
                'ten_su_kien' => 'Workshop Kỹ năng lãnh đạo & Thuyết trình chuyên nghiệp',
                'anh_bia' => 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop',
                'dien_gia' => 'Lê Hoàng Yến – Chuyên gia Đào tạo Kỹ năng mềm',
                'mo_ta' => 'Rèn luyện phong thái tự tin trước đám đông, phương pháp xây dựng slide thuyết phục, kỹ năng điều phối cuộc họp và dẫn dắt đội ngũ dự án hiệu quả.',
                'lo_trinh' => json_encode([
                    ['time' => '09:00 - 09:30', 'title' => 'Khởi động & Mini games tương tác'],
                    ['time' => '09:30 - 11:00', 'title' => 'Chiến lược thuyết trình đỉnh cao & Thực hành'],
                    ['time' => '11:00 - 11:30', 'title' => 'Tổng kết và công nhận ĐRL'],
                ]),
                'doi_tuong_tham_gia' => 'Cán bộ Lớp, Đoàn - Hội và sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(6),
                'thoi_gian_bat_dau' => '2026-11-25 09:00:00',
                'thoi_gian_ket_thuc' => '2026-11-25 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_su_kien' => 104,
                'ma_don_vi_to_chuc' => 8, // Đoàn Thanh niên
                'ma_chuyen_de' => 3, // Văn hóa & Nghệ thuật
                'ma_phong' => 1, // Hội trường A
                'ten_su_kien' => 'Lễ hội Âm nhạc Sinh viên & Đêm nhạc UIT 2026',
                'anh_bia' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=400&fit=crop',
                'dien_gia' => 'Đoàn Thanh niên - Hội Sinh viên',
                'mo_ta' => 'Chương trình ca nhạc nghệ thuật chào đón tân sinh viên với sự góp mặt của các ban nhạc acoustic sinh viên và nghệ sĩ khách mời nổi tiếng.',
                'lo_trinh' => json_encode([
                    ['time' => '18:00 - 18:30', 'title' => 'Check-in nhận quà lưu niệm'],
                    ['time' => '18:30 - 20:30', 'title' => 'Các tiết mục văn nghệ & Giao lưu nghệ sĩ'],
                    ['time' => '20:30 - 21:00', 'title' => 'Check-out nhận điểm rèn luyện'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường UIT',
                'ngay_cong_bo' => $now->copy()->subDays(7),
                'thoi_gian_bat_dau' => '2026-11-28 18:00:00',
                'thoi_gian_ket_thuc' => '2026-11-28 21:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 250,
                'so_ve_con_lai' => 70,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
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

            // Seed đặt phòng hợp lệ tương ứng
            DB::table('dat_phong')->updateOrInsert(
                [
                    'ma_su_kien' => $event['ma_su_kien'],
                    'ma_phong' => $event['ma_phong'],
                ],
                [
                    'thoi_gian_bat_dau' => $event['thoi_gian_bat_dau'],
                    'thoi_gian_ket_thuc' => $event['thoi_gian_ket_thuc'],
                    'trang_thai' => 'CONFIRMED',
                    'ghi_chu' => 'Đặt phòng chính thức đã được CTSV duyệt',
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ]
            );
        }
    }
}

