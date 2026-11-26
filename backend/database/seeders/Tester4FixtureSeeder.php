<?php

namespace Database\Seeders;

use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class Tester4FixtureSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $passwordCost = ['cost' => 12];
        $hashedStudentPassword = Hash::make('Student@123', $passwordCost);

        // ═════════════════════════════════════════════════════════════════════
        // 1. TÀI KHOẢN SINH VIÊN KIỂM THỬ (10 SINH VIÊN SV1 -> SV10)
        // ═════════════════════════════════════════════════════════════════════
        $students = [
            [
                'ma_tai_khoan' => 5,
                'mssv' => '22520001',
                'email' => '22520001@gm.uit.edu.vn',
                'ho_ten' => 'Nguyễn Văn An (SV1)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234501',
                'ma_khoa' => 1, // Khoa HTTT
                'khoa' => 'Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'ma_tai_khoan' => 8,
                'mssv' => '22520002',
                'email' => '22520002@gm.uit.edu.vn',
                'ho_ten' => 'Trần Thị Bình (SV2)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234502',
                'ma_khoa' => 2, // Khoa KHMT
                'khoa' => 'Khoa học Máy tính',
                'lop_sinh_hoat' => 'KHMT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'ma_tai_khoan' => 9,
                'mssv' => '22520003',
                'email' => '22520003@gm.uit.edu.vn',
                'ho_ten' => 'Lê Hoàng Long (SV3)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234503',
                'ma_khoa' => 3, // Khoa KTMT
                'khoa' => 'Kỹ thuật Máy tính',
                'lop_sinh_hoat' => 'KTMT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'ma_tai_khoan' => 12,
                'mssv' => '22520004',
                'email' => '22520004@gm.uit.edu.vn',
                'ho_ten' => 'Phạm Minh Đức (SV4)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234504',
                'ma_khoa' => 4, // Khoa MMT&TT
                'khoa' => 'Mạng máy tính và Truyền thông',
                'lop_sinh_hoat' => 'MMT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'ma_tai_khoan' => 13,
                'mssv' => '22520005',
                'email' => '22520005@gm.uit.edu.vn',
                'ho_ten' => 'Võ Thị Cẩm Tú (SV5)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234505',
                'ma_khoa' => 5, // Khoa KTPM
                'khoa' => 'Kỹ thuật Phần mềm',
                'lop_sinh_hoat' => 'KTPM2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'ma_tai_khoan' => 14,
                'mssv' => '22520006',
                'email' => '22520006@gm.uit.edu.vn',
                'ho_ten' => 'Đặng Quốc Hưng (SV6)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234506',
                'ma_khoa' => 6, // Khoa KH&KTTT
                'khoa' => 'Khoa học và Kỹ thuật Thông tin',
                'lop_sinh_hoat' => 'KTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'ma_tai_khoan' => 15,
                'mssv' => '22520007',
                'email' => '22520007@gm.uit.edu.vn',
                'ho_ten' => 'Hoàng Gia Bảo (SV7)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234507',
                'ma_khoa' => 1, // Khoa HTTT
                'khoa' => 'Hệ thống Thông tin',
                'lop_sinh_hoat' => 'HTTT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'ma_tai_khoan' => 16,
                'mssv' => '22520008',
                'email' => '22520008@gm.uit.edu.vn',
                'ho_ten' => 'Bùi Mai Phương (SV8)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234508',
                'ma_khoa' => 2, // Khoa KHMT
                'khoa' => 'Khoa học Máy tính',
                'lop_sinh_hoat' => 'KHMT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'ma_tai_khoan' => 17,
                'mssv' => '22520009',
                'email' => '22520009@gm.uit.edu.vn',
                'ho_ten' => 'Đỗ Thành Đạt (SV9)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234509',
                'ma_khoa' => 5, // Khoa KTPM
                'khoa' => 'Kỹ thuật Phần mềm',
                'lop_sinh_hoat' => 'KTPM2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
            [
                'ma_tai_khoan' => 18,
                'mssv' => '22520010',
                'email' => '22520010@gm.uit.edu.vn',
                'ho_ten' => 'Ngô Tuyết Nhung (SV10)',
                'mat_khau' => $hashedStudentPassword,
                'so_dien_thoai' => '0901234510',
                'ma_khoa' => 4, // Khoa MMT&TT
                'khoa' => 'Mạng máy tính và Truyền thông',
                'lop_sinh_hoat' => 'MMT2022',
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'thoi_gian_dong_y_nd13' => $now,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
            ],
        ];

        foreach ($students as $stu) {
            DB::table('tai_khoan')->updateOrInsert(
                ['email' => $stu['email']],
                array_merge($stu, [
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ])
            );
        }

        $sv1 = DB::table('tai_khoan')->where('email', '22520001@gm.uit.edu.vn')->first();
        $sv2 = DB::table('tai_khoan')->where('email', '22520002@gm.uit.edu.vn')->first();
        $sv3 = DB::table('tai_khoan')->where('email', '22520003@gm.uit.edu.vn')->first();
        $sv4 = DB::table('tai_khoan')->where('email', '22520004@gm.uit.edu.vn')->first();
        $sv5 = DB::table('tai_khoan')->where('email', '22520005@gm.uit.edu.vn')->first();

        // ═════════════════════════════════════════════════════════════════════
        // 2. DANH SÁCH 25 SỰ KIỆN TEST TOÀN DIỆN CHO GÓI 4 (DISC & BOOK)
        // ═════════════════════════════════════════════════════════════════════
        $events = [
            // ─────────────────────────────────────────────────────────────────
            // NHÓM A: KIỂM THỬ ĐUA VÉ CHÓT (RACE CONDITION) & ĐẶT VÉ (UC-BOOK-01)
            // ─────────────────────────────────────────────────────────────────
            [
                'ma_su_kien' => 201,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'Hackathon UIT Coding Challenge 2026 (Chỉ còn 1 vé chót - Bộ 1)',
                'anh_bia' => 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Giám khảo Tech Hackathon',
                'mo_ta' => 'Cuộc thi lập trình 24h quy mô toàn trường. Hiện tại hệ thống chỉ còn đúng 1 vé cuối cùng! Dùng để kiểm thử tình huống 2 sinh viên (SV1 và SV2) cùng bấm đăng ký tranh vé chót.',
                'lo_trinh' => json_encode([
                    ['time' => '08:00 - 08:30', 'title' => 'Check-in Kiosk Hội trường A'],
                    ['time' => '08:30 - 11:30', 'title' => 'Khai mạc & Ra đề bài Hackathon'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên đam mê lập trình toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => '2026-11-23 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-23 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 10,
                'so_ve_con_lai' => 1, // 1 VÉ CUỐI CÙNG
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 211,
                'ma_don_vi_to_chuc' => 2, // Khoa KHMT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'AI Prompt Engineering & Generative AI Lab (Chỉ còn 1 vé chót - Bộ 2)',
                'anh_bia' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=400&fit=crop',
                'dien_gia' => 'TS. Nguyễn Văn Hùng (AI Lead Google Developer Expert)',
                'mo_ta' => 'Phòng thí nghiệm thực hành tối ưu hóa câu lệnh Prompt và fine-tuning mô hình AI sinh. Hệ thống chỉ còn đúng 1 vé dự bị.',
                'lo_trinh' => json_encode([
                    ['time' => '14:00 - 15:30', 'title' => 'Lý thuyết LLM Architecture'],
                    ['time' => '15:30 - 17:00', 'title' => 'Thực hành Prompt trên Gemini Flash'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên CNTT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => '2026-11-24 14:00:00',
                'thoi_gian_ket_thuc' => '2026-11-24 17:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 20,
                'so_ve_con_lai' => 1, // 1 VÉ CUỐI CÙNG
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 212,
                'ma_don_vi_to_chuc' => 4, // Khoa MMT&TT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 5, // Hội trường CS2
                'ten_su_kien' => 'Cloud Computing AWS & Kubernetes Masterclass (Chỉ còn 1 vé chót - Bộ 3)',
                'anh_bia' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
                'dien_gia' => 'AWS Community Hero',
                'mo_ta' => 'Chuyên đề hạ tầng đám mây phân tán quy mô lớn. Còn đúng 1 vé để tester chạy lại bài test Concurrency nhiều lần.',
                'lo_trinh' => json_encode([
                    ['time' => '08:00 - 11:30', 'title' => 'Deploy k8s Cluster'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên Mạng & HTTT',
                'ngay_cong_bo' => $now->copy()->subDays(1),
                'thoi_gian_bat_dau' => '2026-11-25 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-25 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 15,
                'so_ve_con_lai' => 1, // 1 VÉ CUỐI CÙNG
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 213,
                'ma_don_vi_to_chuc' => 5, // Khoa KTPM
                'ma_chuyen_de' => 3, // Kỹ năng mềm
                'ma_phong' => 4, // Phòng B114
                'ten_su_kien' => 'UI/UX Design Sprint & Prototyping (Còn 2 vé thử thách)',
                'anh_bia' => 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=400&fit=crop',
                'dien_gia' => 'Lead Product Designer Zalo',
                'mo_ta' => 'Sự kiện còn đúng 2 vé, phù hợp để test trường hợp 2 sinh viên cùng đặt vé thành công và người thứ 3 bị từ chối.',
                'lo_trinh' => json_encode([
                    ['time' => '13:30 - 16:30', 'title' => 'Figma Prototyping'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên KTPM & Thiết kế',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => '2026-11-26 13:30:00',
                'thoi_gian_ket_thuc' => '2026-11-26 16:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 30,
                'so_ve_con_lai' => 2, // 2 VÉ
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],

            // ─────────────────────────────────────────────────────────────────
            // NHÓM B: KIỂM THỬ CHỐNG TRÙNG LỊCH (SCHEDULE CONFLICT HARD BLOCK - UC-BOOK-01)
            // ─────────────────────────────────────────────────────────────────
            [
                'ma_su_kien' => 202,
                'ma_don_vi_to_chuc' => 2, // Khoa KHMT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'Seminar An ninh mạng & Defcon (Trùng giờ Hackathon 201: 09:00-10:30)',
                'anh_bia' => 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop',
                'dien_gia' => 'Chuyên gia Bảo mật Viettel Cyber Security',
                'mo_ta' => 'Hội thảo diễn ra vào khung giờ 09:00 - 10:30 ngày 23/11/2026 (nằm trọn trong khung giờ sự kiện 201 từ 08:00 - 11:30). Sinh viên đã có vé 201 khi bấm đặt sự kiện này bắt buộc phải nhận lỗi 409 SCHEDULE_CONFLICT!',
                'lo_trinh' => json_encode([
                    ['time' => '09:00 - 10:30', 'title' => 'Live Demo khai thác bảo mật'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên ATTT & KHMT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => '2026-11-23 09:00:00', // TRÙNG GIỜ VỚI 201
                'thoi_gian_ket_thuc' => '2026-11-23 10:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 80,
                'so_ve_con_lai' => 35,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 214,
                'ma_don_vi_to_chuc' => 3, // Khoa KTMT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 4, // Phòng B114
                'ten_su_kien' => 'Chuyên đề Robotics & Tự động hoá (Trùng giờ AI Lab 211: 14:30-16:00)',
                'anh_bia' => 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
                'dien_gia' => 'Kỹ sư Robotics VinAI',
                'mo_ta' => 'Diễn ra lúc 14:30 - 16:00 ngày 24/11/2026, giao thoa thời gian với sự kiện 211. Dùng làm cặp trùng lịch dự phòng.',
                'lo_trinh' => json_encode([
                    ['time' => '14:30 - 16:00', 'title' => 'Lắp ráp Robot arm'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên KTMT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => '2026-11-24 14:30:00',
                'thoi_gian_ket_thuc' => '2026-11-24 16:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 50,
                'so_ve_con_lai' => 20,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 215,
                'ma_don_vi_to_chuc' => 6, // Khoa KH&KTTT
                'ma_chuyen_de' => 2, // Học thuật
                'ma_phong' => 3, // Phòng C109
                'ten_su_kien' => 'Nghiên cứu Khoa học Sinh viên: Phương pháp & Trình bày (Trùng giờ AWS 212: 08:30-10:30)',
                'anh_bia' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop',
                'dien_gia' => 'Hội đồng Khoa học UIT',
                'mo_ta' => 'Diễn ra lúc 08:30 - 10:30 ngày 25/11/2026, giao thoa thời gian với sự kiện 212.',
                'lo_trinh' => json_encode([
                    ['time' => '08:30 - 10:30', 'title' => 'Hướng dẫn viết paper Scopus'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên đam mê NCKH',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => '2026-11-25 08:30:00',
                'thoi_gian_ket_thuc' => '2026-11-25 10:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 40,
                'so_ve_con_lai' => 15,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],

            // ─────────────────────────────────────────────────────────────────
            // NHÓM C: KIỂM THỬ WAITLIST FIFO & HỦY VÉ CẤP OFFER (UC-BOOK-02, UC-BOOK-03)
            // ─────────────────────────────────────────────────────────────────
            [
                'ma_su_kien' => 203,
                'ma_don_vi_to_chuc' => 4, // Khoa MMT&TT
                'ma_chuyen_de' => 4, // Khởi nghiệp
                'ma_phong' => 3, // Phòng C109
                'ten_su_kien' => 'Workshop Pitching Shark Tank & Kêu gọi vốn (Hết vé - SV1 có vé, SV2 ở FIFO #1, SV3 ở #2)',
                'anh_bia' => 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop',
                'dien_gia' => 'Shark Tank Guest & Founder',
                'mo_ta' => 'Sự kiện đã hết vé. SV1 đang giữ vé chính thức. SV2 đứng số 1 trong hàng chờ (FIFO #1), SV3 đứng số 2 (FIFO #2). Khi SV1 bấm Hủy vé, hệ thống phải tự động cấp Offer giữ chỗ cho SV2!',
                'lo_trinh' => json_encode([
                    ['time' => '14:00 - 15:30', 'title' => 'Pitching Masterclass'],
                    ['time' => '15:30 - 17:00', 'title' => 'Thực hành gọi vốn với nhà đầu tư'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên quan tâm khởi nghiệp',
                'ngay_cong_bo' => $now->copy()->subDays(4),
                'thoi_gian_bat_dau' => '2026-11-26 14:00:00',
                'thoi_gian_ket_thuc' => '2026-11-26 17:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 50,
                'so_ve_con_lai' => 0, // HẾT VÉ
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subDays(1),
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 216,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'Chuyên đề Data Engineering & Big Data Architecture (Hết vé - Bộ test Waitlist 2)',
                'anh_bia' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
                'dien_gia' => 'Principal Data Engineer Shopee',
                'mo_ta' => 'Hết vé. SV1 có vé, SV4 ở FIFO #1, SV5 ở FIFO #2. Dùng để test lặp lại chu trình Hủy vé -> Cấp Offer.',
                'lo_trinh' => json_encode([
                    ['time' => '08:00 - 11:30', 'title' => 'Spark & Kafka Streaming'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên HTTT & KHMT',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => '2026-11-27 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-27 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 60,
                'so_ve_con_lai' => 0, // HẾT VÉ
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subDays(2),
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 217,
                'ma_don_vi_to_chuc' => 7, // P.CTSV
                'ma_chuyen_de' => 3, // Kỹ năng mềm
                'ma_phong' => 4, // Phòng B114
                'ten_su_kien' => 'Tập huấn Kỹ năng Quản lý Thời gian và Cân bằng Cuộc sống (Hết vé - Bộ test Waitlist 3)',
                'anh_bia' => 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=400&fit=crop',
                'dien_gia' => 'Chuyên gia Tâm lý CTSV',
                'mo_ta' => 'Hết vé. SV2 có vé, SV1 đứng ở FIFO #1 trong hàng chờ.',
                'lo_trinh' => json_encode([
                    ['time' => '14:00 - 17:00', 'title' => 'Work-Life Balance Workshop'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(4),
                'thoi_gian_bat_dau' => '2026-11-28 14:00:00',
                'thoi_gian_ket_thuc' => '2026-11-28 17:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 40,
                'so_ve_con_lai' => 0, // HẾT VÉ
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subDays(1),
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],

            // ─────────────────────────────────────────────────────────────────
            // NHÓM D: KIỂM THỬ SÀN 15 PHÚT & ĐÓNG BĂNG SLOT (UC-BOOK-03)
            // ─────────────────────────────────────────────────────────────────
            [
                'ma_su_kien' => 204,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 4, // Phòng B114
                'ten_su_kien' => 'Chuyên đề Microservices (Cách T-2h đúng 5 phút -> Sàn 15p kích hoạt đóng băng)',
                'anh_bia' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop',
                'dien_gia' => 'Principal Architect FPT Software',
                'mo_ta' => 'Sự kiện bắt đầu lúc '.$now->copy()->addMinutes(125)->format('H:i d/m/Y').' (cách mốc chốt sổ T-2h chỉ còn 5 phút, dưới ngưỡng sàn 15 phút). Khi SV1 hủy vé, slot phải tự động chuyển vào so_slot_dong_bang, không được phát hành lại!',
                'lo_trinh' => json_encode([
                    ['time' => '10:00 - 12:00', 'title' => 'Kafka & Microservices'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên năm 3, 4',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addMinutes(125)->format('Y-m-d H:i:s'), // T-2h còn đúng 5 phút!
                'thoi_gian_ket_thuc' => $now->copy()->addMinutes(245)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 30,
                'so_ve_con_lai' => 0, // HẾT VÉ
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subDays(1),
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 218,
                'ma_don_vi_to_chuc' => 2, // Khoa KHMT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 3, // Phòng C109
                'ten_su_kien' => 'Chuyên đề AI in Healthcare & Chuẩn đoán Y khoa (Cách T-2h đúng 10 phút - Bộ 2)',
                'anh_bia' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
                'dien_gia' => 'Bác sĩ & Kỹ sư VinBrain',
                'mo_ta' => 'Sự kiện bắt đầu lúc '.$now->copy()->addMinutes(130)->format('H:i d/m/Y').' (cách mốc T-2h 10 phút, < 15 phút). Hủy vé sẽ kích hoạt quy tắc sàn 15 phút.',
                'lo_trinh' => json_encode([
                    ['time' => '10:30 - 12:30', 'title' => 'Chẩn đoán hình ảnh qua Deep Learning'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên KHMT & HTTT',
                'ngay_cong_bo' => $now->copy()->subDays(1),
                'thoi_gian_bat_dau' => $now->copy()->addMinutes(130)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addMinutes(250)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 40,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subHours(10),
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],

            // ─────────────────────────────────────────────────────────────────
            // NHÓM E: KIỂM THỬ SỰ KIỆN MỞ TỰ DO - KHÔNG GIỚI HẠN SLOT (UC-DISC-01, UC-BOOK-01)
            // ─────────────────────────────────────────────────────────────────
            [
                'ma_su_kien' => 205,
                'ma_don_vi_to_chuc' => 7, // P.CTSV
                'ma_chuyen_de' => 3, // Kỹ năng mềm
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'Ngày hội Tư vấn Hướng nghiệp & Tự tin Hội nhập (Sự kiện Mở tự do - Bộ 1)',
                'anh_bia' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop',
                'dien_gia' => 'Phòng Công tác Sinh viên & Khách mời Doanh nghiệp',
                'mo_ta' => 'Chương trình mở tự do toàn trường, không giới hạn số lượng sinh viên tham gia. Dùng để kiểm thử bộ lọc "Mở tự do" và tính năng đặt vé không trừ slot.',
                'lo_trinh' => json_encode([
                    ['time' => '08:30 - 11:30', 'title' => 'Tư vấn và giao lưu nghề nghiệp'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(5),
                'thoi_gian_bat_dau' => '2026-11-26 08:30:00',
                'thoi_gian_ket_thuc' => '2026-11-26 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 1, // MỞ TỰ DO
                'so_luong_toi_da' => null,
                'so_ve_con_lai' => null,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 2.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 219,
                'ma_don_vi_to_chuc' => 8, // Đoàn Thanh niên - HSV
                'ma_chuyen_de' => 2, // Học thuật
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'Ngày hội Sách và Văn hóa Đọc UIT 2026 (Sự kiện Mở tự do - Bộ 2)',
                'anh_bia' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=400&fit=crop',
                'dien_gia' => 'CLB Sách & Văn hóa UIT',
                'mo_ta' => 'Gian hàng trao đổi sách và giới thiệu các tựa sách công nghệ tiêu biểu. Mở tự do cho toàn thể sinh viên và giảng viên.',
                'lo_trinh' => json_encode([
                    ['time' => '08:00 - 17:00', 'title' => 'Triển lãm và trao đổi sách'],
                ]),
                'doi_tuong_tham_gia' => 'Toàn thể sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => '2026-11-29 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-29 17:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 1, // MỞ TỰ DO
                'so_luong_toi_da' => null,
                'so_ve_con_lai' => null,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 2,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],

            // ─────────────────────────────────────────────────────────────────
            // NHÓM F: KIỂM THỬ BỘ LỌC KHÔNG CỘNG ĐRL (dieu_khoan_drl = KhongCo - UC-DISC-01)
            // ─────────────────────────────────────────────────────────────────
            [
                'ma_su_kien' => 206,
                'ma_don_vi_to_chuc' => 8, // Đoàn Hội
                'ma_chuyen_de' => 3, // Kỹ năng mềm
                'ma_phong' => 5, // Hội trường CS2
                'ten_su_kien' => 'Giải Giao lưu Thể thao & Boardgame Cuối tuần (Không cộng ĐRL - Bộ 1)',
                'anh_bia' => 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop',
                'dien_gia' => 'CLB Thể thao Sinh viên UIT',
                'mo_ta' => 'Hoạt động vui chơi giải trí lành mạnh cuối tuần, không tính điểm rèn luyện. Dùng để kiểm thử bộ lọc "Không cộng ĐRL".',
                'lo_trinh' => json_encode([
                    ['time' => '15:00 - 18:00', 'title' => 'Thi đấu giao hữu'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => '2026-11-27 15:00:00',
                'thoi_gian_ket_thuc' => '2026-11-27 18:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 60,
                'so_ve_con_lai' => 60,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'KhongCo', // KHÔNG CỘNG ĐRL
                'diem_drl_du_kien' => 0,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 220,
                'ma_don_vi_to_chuc' => 8, // Đoàn Thanh niên
                'ma_chuyen_de' => 3, // Kỹ năng mềm
                'ma_phong' => 5, // Hội trường CS2
                'ten_su_kien' => 'Đêm Nhạc Hội Acoustic Giai Điệu Tuổi Trẻ (Không cộng ĐRL - Bộ 2)',
                'anh_bia' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop',
                'dien_gia' => 'Đội Văn nghệ Xung kích UIT',
                'mo_ta' => 'Đêm nhạc giao lưu chào đón tân sinh viên, miễn phí vé vào cổng và không tính điểm rèn luyện.',
                'lo_trinh' => json_encode([
                    ['time' => '18:30 - 21:00', 'title' => 'Biểu diễn âm nhạc'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(4),
                'thoi_gian_bat_dau' => '2026-11-30 18:30:00',
                'thoi_gian_ket_thuc' => '2026-11-30 21:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 150,
                'so_ve_con_lai' => 120,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'KhongCo', // KHÔNG CỘNG ĐRL
                'diem_drl_du_kien' => 0,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],

            // ─────────────────────────────────────────────────────────────────
            // NHÓM G: KIỂM THỬ BỘ LỌC ĐƠN VỊ TỔ CHỨC & ĐỒNG TỔ CHỨC (UC-DISC-01)
            // ─────────────────────────────────────────────────────────────────
            [
                'ma_su_kien' => 207,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'Techfest Sinh viên Sáng tạo 2026 (HTTT chủ trì, WebDev & AI Club đồng tổ chức)',
                'anh_bia' => 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
                'dien_gia' => 'Liên minh CLB Công nghệ UIT',
                'mo_ta' => 'Sự kiện có đơn vị chủ trì là Khoa HTTT và 2 đơn vị đồng tổ chức là CLB WebDev và CLB AI. Dùng để kiểm thử tính năng lọc theo đơn vị tổ chức: lọc Khoa HTTT hoặc lọc CLB WebDev đều phải hiển thị sự kiện này.',
                'lo_trinh' => json_encode([
                    ['time' => '08:00 - 12:00', 'title' => 'Triển lãm công nghệ'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(6),
                'thoi_gian_bat_dau' => '2026-11-28 08:00:00',
                'thoi_gian_ket_thuc' => '2026-11-28 12:00:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 120,
                'so_ve_con_lai' => 80,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 221,
                'ma_don_vi_to_chuc' => 4, // Khoa MMT&TT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'Diễn đàn An ninh Mạng Sinh viên & CTF (Khoa MMT chủ trì, CyberSecurity Club đồng tổ chức)',
                'anh_bia' => 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=400&fit=crop',
                'dien_gia' => 'Đội ngũ Pentest & Giảng viên MMT',
                'mo_ta' => 'Sự kiện do Khoa MMT&TT chủ trì cùng CLB CyberSecurity (An toàn Thông tin) đồng tổ chức.',
                'lo_trinh' => json_encode([
                    ['time' => '08:00 - 11:30', 'title' => 'Thi đấu CTF'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên ATTT & MMT',
                'ngay_cong_bo' => $now->copy()->subDays(5),
                'thoi_gian_bat_dau' => '2026-12-01 08:00:00',
                'thoi_gian_ket_thuc' => '2026-12-01 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 80,
                'so_ve_con_lai' => 50,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],

            // ─────────────────────────────────────────────────────────────────
            // NHÓM H: KIỂM THỬ TRẠNG THÁI HAPPENING, COMPLETED & ĐÓNG ĐĂNG KÝ (UC-DISC-01, UC-DISC-02)
            // ─────────────────────────────────────────────────────────────────
            [
                'ma_su_kien' => 208,
                'ma_don_vi_to_chuc' => 9, // CLB WebDev
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'Live Demo & Coding Trực tiếp trên Sân khấu (Trạng thái HAPPENING)',
                'anh_bia' => 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop',
                'dien_gia' => 'Lead Engineer WebDev',
                'mo_ta' => 'Sự kiện bắt đầu từ 30 phút trước và đang diễn ra tại Hội trường E. Dùng để test bộ lọc trạng thái HAPPENING và nút bấm thông minh SU_KIEN_DANG_DIEN_RA_DONG_DK.',
                'lo_trinh' => json_encode([
                    ['time' => '15:00 - 17:00', 'title' => 'Live coding'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên UIT',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => $now->copy()->subMinutes(30)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addMinutes(90)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subHours(5),
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'HAPPENING',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 222,
                'ma_don_vi_to_chuc' => 3, // Khoa KTMT
                'ma_chuyen_de' => 2, // Học thuật
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'Chung kết Cuộc thi Thiết kế Vi mạch VHDL/Verilog (Đang diễn ra HAPPENING)',
                'anh_bia' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Giám khảo Vi mạch',
                'mo_ta' => 'Chung kết cuộc thi vi mạch đang diễn ra gay cấn. Sự kiện trạng thái HAPPENING.',
                'lo_trinh' => json_encode([
                    ['time' => '13:00 - 17:00', 'title' => 'Chung kết thi đấu'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên KTMT',
                'ngay_cong_bo' => $now->copy()->subDays(4),
                'thoi_gian_bat_dau' => $now->copy()->subMinutes(45)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addMinutes(120)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 150,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subHours(6),
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'HAPPENING',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 209,
                'ma_don_vi_to_chuc' => 8, // Đoàn Thanh niên
                'ma_chuyen_de' => 3, // Kỹ năng mềm
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'Lễ Tuyên dương Sinh viên 5 Tốt & Thủ lĩnh Tiêu biểu (Đã kết thúc COMPLETED)',
                'anh_bia' => 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Chấp hành Đoàn trường',
                'mo_ta' => 'Lễ tuyên dương đã diễn ra và hoàn tất từ hôm qua. Dùng để kiểm thử bộ lọc COMPLETED và nút bấm thông minh SU_KIEN_DA_KET_THUC.',
                'lo_trinh' => json_encode([
                    ['time' => '08:00 - 11:30', 'title' => 'Lễ tuyên dương'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(10),
                'thoi_gian_bat_dau' => $now->copy()->subHours(14)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->subHours(10)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => $now->copy()->subHours(10)->format('Y-m-d H:i:s'),
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 200,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subDays(3),
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 223,
                'ma_don_vi_to_chuc' => 7, // P.CTSV
                'ma_chuyen_de' => 3, // Kỹ năng mềm
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => 'Hội thảo Kỹ năng Viết CV & Phỏng vấn Doanh nghiệp (Đã kết thúc COMPLETED)',
                'anh_bia' => 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop',
                'dien_gia' => 'HR Director TopCV',
                'mo_ta' => 'Chương trình rèn luyện kỹ năng phỏng vấn tuyển dụng đã kết thúc tuần trước.',
                'lo_trinh' => json_encode([
                    ['time' => '13:30 - 16:30', 'title' => 'Mock Interview'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên năm cuối',
                'ngay_cong_bo' => $now->copy()->subDays(14),
                'thoi_gian_bat_dau' => $now->copy()->subDays(2)->format('Y-m-d 13:30:00'),
                'thoi_gian_ket_thuc' => $now->copy()->subDays(2)->format('Y-m-d 16:30:00'),
                'thoi_gian_ket_thuc_thuc_te' => $now->copy()->subDays(2)->format('Y-m-d 16:45:00'),
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subDays(4),
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'COMPLETED',
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 210,
                'ma_don_vi_to_chuc' => 4, // Khoa MMT&TT
                'ma_chuyen_de' => 4, // Khởi nghiệp
                'ma_phong' => 3, // C109
                'ten_su_kien' => 'Toạ đàm Khởi nghiệp Đổi mới Sáng tạo (Đã đóng đăng ký vì qua mốc T-2h)',
                'anh_bia' => 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop',
                'dien_gia' => 'Venture Capitalists',
                'mo_ta' => 'Sự kiện sẽ bắt đầu sau 60 phút nữa (đã vượt qua mốc chốt sổ T-2h). Nút bấm thông minh phải hiển thị ĐÃ ĐÓNG ĐĂNG KÝ (DONG_DANG_KY) kể cả khi còn vé!',
                'lo_trinh' => json_encode([
                    ['time' => '16:00 - 18:00', 'title' => 'Pitch & Connect'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(1),
                'thoi_gian_bat_dau' => $now->copy()->addMinutes(60)->format('Y-m-d H:i:s'), // T-1h -> ĐÃ QUA MỐC T-2h
                'thoi_gian_ket_thuc' => $now->copy()->addMinutes(180)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 50,
                'so_ve_con_lai' => 10, // Dù còn vé vẫn phải đóng đăng ký!
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 224,
                'ma_don_vi_to_chuc' => 8, // Đoàn Thanh niên
                'ma_chuyen_de' => 5, // Tình nguyện
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'Chiến dịch Mùa Hè Xanh & Tình nguyện Vì Cộng đồng 2026',
                'anh_bia' => 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Chỉ huy Chiến dịch Tình nguyện',
                'mo_ta' => 'Chiến dịch tình nguyện cao điểm trong mùa hè. Cộng điểm rèn luyện Điều 4 và 15 giờ tình nguyện xã hội.',
                'lo_trinh' => json_encode([
                    ['time' => '07:30 - 11:30', 'title' => 'Lễ xuất quân'],
                ]),
                'doi_tuong_tham_gia' => 'Chiến sĩ tình nguyện UIT',
                'ngay_cong_bo' => $now->copy()->subDays(5),
                'thoi_gian_bat_dau' => '2026-12-05 07:30:00',
                'thoi_gian_ket_thuc' => '2026-12-05 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 300,
                'so_ve_con_lai' => 210,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 15.0, // 15 GIỜ TÌNH NGUYỆN
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 225,
                'ma_don_vi_to_chuc' => 2, // Khoa KHMT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => 'Workshop Xử lý Ngôn ngữ Tự nhiên & Large Language Models (Còn 75 vé)',
                'anh_bia' => 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop',
                'dien_gia' => 'Các nhà nghiên cứu NLP Lab UIT',
                'mo_ta' => 'Sự kiện chuyên sâu về NLP tiếng Việt và kiến trúc Transformer hiện đại. Còn 75 vé mở đăng ký bình thường.',
                'lo_trinh' => json_encode([
                    ['time' => '08:00 - 11:30', 'title' => 'Transformer & Attention Mechanism'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên KHMT & CNTT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => '2026-12-10 08:00:00',
                'thoi_gian_ket_thuc' => '2026-12-10 11:30:00',
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 75,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],

            // ─────────────────────────────────────────────────────────────────
            // NHÓM I: BỘ DỮ LIỆU ĐỐI SOÁT 12 LỖI ĐÃ SỬA (BUG-PKG04-06 -> 17)
            // ─────────────────────────────────────────────────────────────────
            [
                'ma_su_kien' => 226,
                'ma_don_vi_to_chuc' => 1, // Khoa HTTT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => '[TEST BUG-06] Sự kiện đã quá giờ kết thúc nhưng DB vẫn PUBLISHED (Chưa chạy Cron)',
                'anh_bia' => 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop',
                'dien_gia' => 'Ban Kỹ thuật Hệ thống',
                'mo_ta' => 'Dùng kiểm chứng BUG-PKG04-06: trạng thái DB là PUBLISHED nhưng thời gian kết thúc đã qua từ hôm qua. Phải bị ẩn ở bộ lọc Mặc định & Sắp diễn ra, chỉ xuất hiện khi chọn Đã kết thúc (COMPLETED), và nút chi tiết phải Disabled "Sự kiện đã kết thúc".',
                'lo_trinh' => json_encode([
                    ['time' => '08:00 - 11:00', 'title' => 'Hội thảo đã kết thúc'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(5),
                'thoi_gian_bat_dau' => $now->copy()->subHours(28)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->subHours(24)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 100,
                'so_ve_con_lai' => 25,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED', // Cố tình giữ PUBLISHED dù đã qua giờ kết thúc
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 227,
                'ma_don_vi_to_chuc' => 2, // Khoa KHMT
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 1, // Hội trường E
                'ten_su_kien' => '[TEST BUG-07] Hội thảo Đêm Khuya 01:00 ngày 29/11 giờ VN (Test lệch múi giờ UTC)',
                'anh_bia' => 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
                'dien_gia' => 'Đội ngũ Core Backend UIT',
                'mo_ta' => 'Dùng kiểm chứng BUG-PKG04-07: lưu trong DB là 2026-11-28 18:00:00 UTC (= 2026-11-29 01:00:00 giờ Việt Nam +07:00). Khi lọc Từ ngày 29/11/2026 đến 29/11/2026 bắt buộc phải trả về sự kiện này!',
                'lo_trinh' => json_encode([
                    ['time' => '01:00 - 03:00', 'title' => 'Coding xuyên đêm & Giải đáp Timezone'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên CNTT',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => Carbon::create(2026, 11, 29, 1, 0, 0, 'Asia/Ho_Chi_Minh')->utc()->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => Carbon::create(2026, 11, 29, 3, 0, 0, 'Asia/Ho_Chi_Minh')->utc()->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 80,
                'so_ve_con_lai' => 45,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 4,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 228,
                'ma_don_vi_to_chuc' => 7, // P.CTSV
                'ma_chuyen_de' => 3, // Kỹ năng mềm
                'ma_phong' => 2, // Hội trường A
                'ten_su_kien' => '[TEST BUG-09] Ngày hội Giao lưu Mở tự do Đang diễn ra (HAPPENING - Không giới hạn slot)',
                'anh_bia' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
                'dien_gia' => 'Phòng CTSV & Các CLB UIT',
                'mo_ta' => 'Sự kiện đang diễn ra (HAPPENING) nhưng thuộc loại Mở tự do (khong_gioi_han_slot = 1). Khách thấy "Đăng nhập để đặt vé", Sinh viên chưa có vé thấy "Đăng ký tham gia ngay" (cho phép đăng ký muộn đến trước giờ kết thúc).',
                'lo_trinh' => json_encode([
                    ['time' => 'Hiện tại', 'title' => 'Hoạt động giao lưu tự do đang diễn ra'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->subMinutes(20)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addMinutes(120)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 1,
                'so_luong_toi_da' => null,
                'so_ve_con_lai' => null,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => null,
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'HAPPENING',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 229,
                'ma_don_vi_to_chuc' => 5, // Khoa KTPM
                'ma_chuyen_de' => 1, // Công nghệ
                'ma_phong' => 4, // Phòng B114
                'ten_su_kien' => '[TEST BUG-09] Workshop System Design (SV1 đang có Offer Waitlist đếm ngược MM:SS)',
                'anh_bia' => 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=400&fit=crop',
                'dien_gia' => 'Staff Software Engineer VNG',
                'mo_ta' => 'Sự kiện hết vé. SV1 đang được cấp OFFER với hạn xác nhận còn 40 phút -> nút bấm hiển thị "Bạn có 1 slot đang chờ nhận - Còn MM:SS" đếm ngược trực tiếp. SV2 đang chờ ở vị trí #2 -> nút bấm hiển thị "Bạn đang ở vị trí số 2 trong danh sách chờ".',
                'lo_trinh' => json_encode([
                    ['time' => '14:00 - 17:00', 'title' => 'High Availability Architecture'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên KTPM & CNTT',
                'ngay_cong_bo' => $now->copy()->subDays(3),
                'thoi_gian_bat_dau' => $now->copy()->addDays(6)->setTime(7, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addDays(6)->setTime(10, 0, 0)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 40,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subHours(12),
                'dieu_khoan_drl' => 'Dieu3',
                'diem_drl_du_kien' => 5,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 1,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
            [
                'ma_su_kien' => 230,
                'ma_don_vi_to_chuc' => 4, // Khoa MMT&TT
                'ma_chuyen_de' => 4, // Khởi nghiệp
                'ma_phong' => 3, // Phòng C109
                'ten_su_kien' => '[TEST BUG-09] Talkshow Khởi nghiệp (Hết vé & Dưới mốc T-2h -> Đóng Waitlist)',
                'anh_bia' => 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
                'dien_gia' => 'Founder Startup Hub',
                'mo_ta' => 'Sự kiện giới hạn slot, đã hết vé (so_ve_con_lai = 0) và sắp bắt đầu trong 70 phút (đã qua mốc T-2h). Nút bấm bắt buộc hiển thị "Hết vé (Đã đóng danh sách chờ)" (Disabled) và không hiển thị box Waitlist.',
                'lo_trinh' => json_encode([
                    ['time' => 'Sắp bắt đầu', 'title' => 'Chia sẻ hành trình khởi nghiệp'],
                ]),
                'doi_tuong_tham_gia' => 'Sinh viên toàn trường',
                'ngay_cong_bo' => $now->copy()->subDays(2),
                'thoi_gian_bat_dau' => $now->copy()->addMinutes(70)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc' => $now->copy()->addMinutes(190)->format('Y-m-d H:i:s'),
                'thoi_gian_ket_thuc_thuc_te' => null,
                'khong_gioi_han_slot' => 0,
                'so_luong_toi_da' => 50,
                'so_ve_con_lai' => 0,
                'so_slot_dong_bang' => 0,
                'thoi_diem_het_ve' => $now->copy()->subHours(5),
                'dieu_khoan_drl' => 'Dieu4',
                'diem_drl_du_kien' => 3,
                'gio_tinh_nguyen' => 0.0,
                'trang_thai' => 'PUBLISHED',
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ],
        ];

        foreach ($events as $event) {
            DB::table('su_kien')->updateOrInsert(
                ['ma_su_kien' => $event['ma_su_kien']],
                array_merge($event, [
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ])
            );

            // Đặt phòng tương ứng
            DB::table('dat_phong')->updateOrInsert(
                [
                    'ma_su_kien' => $event['ma_su_kien'],
                ],
                [
                    'ma_phong' => $event['ma_phong'],
                    'thoi_gian_bat_dau' => $event['thoi_gian_bat_dau'],
                    'thoi_gian_ket_thuc' => $event['thoi_gian_ket_thuc'],
                    'trang_thai' => 'CONFIRMED',
                    'ghi_chu' => 'Đặt phòng kiểm thử hệ thống cho Tester 4',
                    'thoi_gian_tao' => $now,
                    'thoi_gian_cap_nhat' => $now,
                ]
            );
        }

        // ═════════════════════════════════════════════════════════════════════
        // 3. ĐỒNG TỔ CHỨC (CO-HOST UNITS) CHO CÁC SỰ KIỆN 207 & 221
        // ═════════════════════════════════════════════════════════════════════
        // Event 207: CLB WebDev (9) & CLB AI (10) đồng tổ chức
        DB::table('su_kien_dong_to_chuc')->updateOrInsert(
            ['ma_su_kien' => 207, 'ma_don_vi_to_chuc' => 9],
            ['trang_thai_xac_nhan' => 'DONG_Y', 'thoi_gian_phan_hoi' => $now, 'thoi_gian_tao' => $now]
        );
        DB::table('su_kien_dong_to_chuc')->updateOrInsert(
            ['ma_su_kien' => 207, 'ma_don_vi_to_chuc' => 10],
            ['trang_thai_xac_nhan' => 'DONG_Y', 'thoi_gian_phan_hoi' => $now, 'thoi_gian_tao' => $now]
        );

        // Event 221: CLB An toàn Thông tin (11) đồng tổ chức
        DB::table('su_kien_dong_to_chuc')->updateOrInsert(
            ['ma_su_kien' => 221, 'ma_don_vi_to_chuc' => 11],
            ['trang_thai_xac_nhan' => 'DONG_Y', 'thoi_gian_phan_hoi' => $now, 'thoi_gian_tao' => $now]
        );

        // ═════════════════════════════════════════════════════════════════════
        // 4. THIẾT LẬP VÉ ĐẶT TRƯỚC VÀ HÀNG CHỜ WAITLIST (ĐA KỊCH BẢN KIỂM THỬ)
        // ═════════════════════════════════════════════════════════════════════
        $cryptoService = app(CryptoService::class);

        // ─────────────────────────────────────────────────────────────────────
        // Kịch bản 1: Event 203 (Workshop Shark Tank)
        // - SV1 giữ vé chính thức (DaDangKy)
        // - SV2 đứng ở hàng chờ WAITING số #1 (FIFO #1)
        // - SV3 đứng ở hàng chờ WAITING số #2 (FIFO #2)
        // Khi SV1 bấm hủy vé -> Hệ thống tự động cấp OFFER cho SV2!
        // ─────────────────────────────────────────────────────────────────────
        if ($sv1) {
            $uuid203 = (string) Str::uuid();
            DB::table('dang_ky')->updateOrInsert(
                ['ma_su_kien' => 203, 'ma_tai_khoan' => $sv1->ma_tai_khoan],
                [
                    'ma_ve_uuid' => $uuid203,
                    'chu_ky_hmac' => $cryptoService->signTicket($uuid203, (int) $sv1->ma_tai_khoan, 203),
                    'trang_thai' => 'DaDangKy',
                    'thoi_gian_dang_ky' => $now->copy()->subDays(1),
                    'da_check_in' => 0,
                    'da_check_out' => 0,
                    'nghi_van_gian_lan' => 0,
                    'tham_gia_tron_ven' => 0,
                    'tham_gia_mot_phan' => 0,
                    'ti_le_drl' => 0,
                    'da_feedback' => 0,
                    'du_dieu_kien_drl' => 0,
                    'vi_pham_no_show' => 0,
                    'da_gui_nhac_nho' => 0,
                ]
            );
        }

        if ($sv2) {
            DB::table('hang_doi_waitlist')->updateOrInsert(
                ['ma_su_kien' => 203, 'ma_tai_khoan' => $sv2->ma_tai_khoan],
                [
                    'so_thu_tu' => 1,
                    'trang_thai' => 'WAITING',
                    'thoi_gian_dang_ky' => $now->copy()->subHours(3),
                    'han_chot_xac_nhan' => null,
                    'thoi_gian_phan_hoi' => null,
                ]
            );
        }

        if ($sv3) {
            DB::table('hang_doi_waitlist')->updateOrInsert(
                ['ma_su_kien' => 203, 'ma_tai_khoan' => $sv3->ma_tai_khoan],
                [
                    'so_thu_tu' => 2,
                    'trang_thai' => 'WAITING',
                    'thoi_gian_dang_ky' => $now->copy()->subHours(2),
                    'han_chot_xac_nhan' => null,
                    'thoi_gian_phan_hoi' => null,
                ]
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // Kịch bản 2: Event 216 (Chuyên đề Data Engineering)
        // - SV1 giữ vé chính thức
        // - SV4 đứng ở WAITING số #1
        // - SV5 đứng ở WAITING số #2
        // Dùng làm bộ dự phòng thứ hai cho test Waitlist Offer
        // ─────────────────────────────────────────────────────────────────────
        if ($sv1) {
            $uuid216 = (string) Str::uuid();
            DB::table('dang_ky')->updateOrInsert(
                ['ma_su_kien' => 216, 'ma_tai_khoan' => $sv1->ma_tai_khoan],
                [
                    'ma_ve_uuid' => $uuid216,
                    'chu_ky_hmac' => $cryptoService->signTicket($uuid216, (int) $sv1->ma_tai_khoan, 216),
                    'trang_thai' => 'DaDangKy',
                    'thoi_gian_dang_ky' => $now->copy()->subDays(2),
                    'da_check_in' => 0,
                    'da_check_out' => 0,
                    'nghi_van_gian_lan' => 0,
                    'tham_gia_tron_ven' => 0,
                    'tham_gia_mot_phan' => 0,
                    'ti_le_drl' => 0,
                    'da_feedback' => 0,
                    'du_dieu_kien_drl' => 0,
                    'vi_pham_no_show' => 0,
                    'da_gui_nhac_nho' => 0,
                ]
            );
        }

        if ($sv4) {
            DB::table('hang_doi_waitlist')->updateOrInsert(
                ['ma_su_kien' => 216, 'ma_tai_khoan' => $sv4->ma_tai_khoan],
                [
                    'so_thu_tu' => 1,
                    'trang_thai' => 'WAITING',
                    'thoi_gian_dang_ky' => $now->copy()->subHours(4),
                    'han_chot_xac_nhan' => null,
                    'thoi_gian_phan_hoi' => null,
                ]
            );
        }

        if ($sv5) {
            DB::table('hang_doi_waitlist')->updateOrInsert(
                ['ma_su_kien' => 216, 'ma_tai_khoan' => $sv5->ma_tai_khoan],
                [
                    'so_thu_tu' => 2,
                    'trang_thai' => 'WAITING',
                    'thoi_gian_dang_ky' => $now->copy()->subHours(3),
                    'han_chot_xac_nhan' => null,
                    'thoi_gian_phan_hoi' => null,
                ]
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // Kịch bản 3: Event 204 (Microservices) - Kiểm thử Sàn 15 phút
        // - Thời gian bắt đầu: $now + 125 phút (Cách T-2h đúng 5 phút, < 15 phút)
        // - SV1 giữ vé chính thức
        // - SV2 đứng ở hàng chờ WAITING số #1
        // Khi SV1 hủy vé -> Quy tắc sàn 15p: so_slot_dong_bang tăng lên 1, KHÔNG cấp vé cho SV2!
        // ─────────────────────────────────────────────────────────────────────
        if ($sv1) {
            $uuid204 = (string) Str::uuid();
            DB::table('dang_ky')->updateOrInsert(
                ['ma_su_kien' => 204, 'ma_tai_khoan' => $sv1->ma_tai_khoan],
                [
                    'ma_ve_uuid' => $uuid204,
                    'chu_ky_hmac' => $cryptoService->signTicket($uuid204, (int) $sv1->ma_tai_khoan, 204),
                    'trang_thai' => 'DaDangKy',
                    'thoi_gian_dang_ky' => $now->copy()->subHours(6),
                    'da_check_in' => 0,
                    'da_check_out' => 0,
                    'nghi_van_gian_lan' => 0,
                    'tham_gia_tron_ven' => 0,
                    'tham_gia_mot_phan' => 0,
                    'ti_le_drl' => 0,
                    'da_feedback' => 0,
                    'du_dieu_kien_drl' => 0,
                    'vi_pham_no_show' => 0,
                    'da_gui_nhac_nho' => 0,
                ]
            );
        }

        if ($sv2) {
            DB::table('hang_doi_waitlist')->updateOrInsert(
                ['ma_su_kien' => 204, 'ma_tai_khoan' => $sv2->ma_tai_khoan],
                [
                    'so_thu_tu' => 1,
                    'trang_thai' => 'WAITING',
                    'thoi_gian_dang_ky' => $now->copy()->subMinutes(40),
                    'han_chot_xac_nhan' => null,
                    'thoi_gian_phan_hoi' => null,
                ]
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // Kịch bản 4: Event 218 (AI in Healthcare) - Kiểm thử Sàn 15 phút dự phòng
        // - Thời gian bắt đầu: $now + 130 phút (Cách T-2h 10 phút, < 15 phút)
        // - SV2 giữ vé chính thức
        // - SV3 đứng ở WAITING số #1
        // ─────────────────────────────────────────────────────────────────────
        if ($sv2) {
            $uuid218 = (string) Str::uuid();
            DB::table('dang_ky')->updateOrInsert(
                ['ma_su_kien' => 218, 'ma_tai_khoan' => $sv2->ma_tai_khoan],
                [
                    'ma_ve_uuid' => $uuid218,
                    'chu_ky_hmac' => $cryptoService->signTicket($uuid218, (int) $sv2->ma_tai_khoan, 218),
                    'trang_thai' => 'DaDangKy',
                    'thoi_gian_dang_ky' => $now->copy()->subHours(5),
                    'da_check_in' => 0,
                    'da_check_out' => 0,
                    'nghi_van_gian_lan' => 0,
                    'tham_gia_tron_ven' => 0,
                    'tham_gia_mot_phan' => 0,
                    'ti_le_drl' => 0,
                    'da_feedback' => 0,
                    'du_dieu_kien_drl' => 0,
                    'vi_pham_no_show' => 0,
                    'da_gui_nhac_nho' => 0,
                ]
            );
        }

        if ($sv3) {
            DB::table('hang_doi_waitlist')->updateOrInsert(
                ['ma_su_kien' => 218, 'ma_tai_khoan' => $sv3->ma_tai_khoan],
                [
                    'so_thu_tu' => 1,
                    'trang_thai' => 'WAITING',
                    'thoi_gian_dang_ky' => $now->copy()->subMinutes(25),
                    'han_chot_xac_nhan' => null,
                    'thoi_gian_phan_hoi' => null,
                ]
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // Kịch bản 5 (TEST BUG-PKG04-08): Event 209 (COMPLETED, kết thúc 10h trước)
        // - SV1: Có vé nhưng KHÔNG điểm danh (No-show) -> Nút phải Disabled "Sự kiện đã kết thúc"
        // - SV2: Đã Check-in & Check-out đầy đủ (ti_le_drl = 1.00, chưa feedback) -> "Làm khảo sát Feedback / Xem chứng nhận"
        // ─────────────────────────────────────────────────────────────────────
        if ($sv1) {
            $uuid209Sv1 = (string) Str::uuid();
            DB::table('dang_ky')->updateOrInsert(
                ['ma_su_kien' => 209, 'ma_tai_khoan' => $sv1->ma_tai_khoan],
                [
                    'ma_ve_uuid' => $uuid209Sv1,
                    'chu_ky_hmac' => $cryptoService->signTicket($uuid209Sv1, (int) $sv1->ma_tai_khoan, 209),
                    'trang_thai' => 'DaDangKy',
                    'thoi_gian_dang_ky' => $now->copy()->subDays(3),
                    'da_check_in' => 0,
                    'da_check_out' => 0,
                    'nghi_van_gian_lan' => 0,
                    'tham_gia_tron_ven' => 0,
                    'tham_gia_mot_phan' => 0,
                    'ti_le_drl' => 0,
                    'da_feedback' => 0,
                    'du_dieu_kien_drl' => 0,
                    'vi_pham_no_show' => 1,
                    'da_gui_nhac_nho' => 1,
                ]
            );
        }

        if ($sv2) {
            $uuid209Sv2 = (string) Str::uuid();
            DB::table('dang_ky')->updateOrInsert(
                ['ma_su_kien' => 209, 'ma_tai_khoan' => $sv2->ma_tai_khoan],
                [
                    'ma_ve_uuid' => $uuid209Sv2,
                    'chu_ky_hmac' => $cryptoService->signTicket($uuid209Sv2, (int) $sv2->ma_tai_khoan, 209),
                    'trang_thai' => 'DaCheckOut',
                    'thoi_gian_dang_ky' => $now->copy()->subDays(3),
                    'da_check_in' => 1,
                    'thoi_gian_check_in' => $now->copy()->subHours(14),
                    'da_check_out' => 1,
                    'thoi_gian_check_out' => $now->copy()->subHours(10),
                    'nghi_van_gian_lan' => 0,
                    'tham_gia_tron_ven' => 1,
                    'tham_gia_mot_phan' => 0,
                    'ti_le_drl' => 1.00,
                    'da_feedback' => 0,
                    'du_dieu_kien_drl' => 0,
                    'vi_pham_no_show' => 0,
                    'da_gui_nhac_nho' => 1,
                ]
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // Kịch bản 6 (TEST BUG-PKG04-09 & 11): Event 208 (HAPPENING, giới hạn slot)
        // - SV1: Đã có vé hợp lệ (DaDangKy) -> Nút "Vào điểm danh / Xem vé" (Enabled)
        // - Guest / SV2 (chưa có vé): Nút "Sự kiện đang diễn ra (Đã đóng đăng ký)" (Disabled)
        // ─────────────────────────────────────────────────────────────────────
        if ($sv1) {
            $uuid208Sv1 = (string) Str::uuid();
            DB::table('dang_ky')->updateOrInsert(
                ['ma_su_kien' => 208, 'ma_tai_khoan' => $sv1->ma_tai_khoan],
                [
                    'ma_ve_uuid' => $uuid208Sv1,
                    'chu_ky_hmac' => $cryptoService->signTicket($uuid208Sv1, (int) $sv1->ma_tai_khoan, 208),
                    'trang_thai' => 'DaDangKy',
                    'thoi_gian_dang_ky' => $now->copy()->subDays(2),
                    'da_check_in' => 0,
                    'da_check_out' => 0,
                    'nghi_van_gian_lan' => 0,
                    'tham_gia_tron_ven' => 0,
                    'tham_gia_mot_phan' => 0,
                    'ti_le_drl' => 0,
                    'da_feedback' => 0,
                    'du_dieu_kien_drl' => 0,
                    'vi_pham_no_show' => 0,
                    'da_gui_nhac_nho' => 1,
                ]
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // Kịch bản 7 (TEST BUG-PKG04-09 CO_OFFER_WAITLIST): Event 229
        // - SV1: Đang được OFFER với hạn chót còn 40 phút -> nút đếm ngược MM:SS
        // - SV2: Đang ở hàng chờ WAITING #2 -> "Bạn đang ở vị trí số 2 trong danh sách chờ"
        // ─────────────────────────────────────────────────────────────────────
        if ($sv1) {
            DB::table('hang_doi_waitlist')->updateOrInsert(
                ['ma_su_kien' => 229, 'ma_tai_khoan' => $sv1->ma_tai_khoan],
                [
                    'so_thu_tu' => 1,
                    'trang_thai' => 'OFFERED',
                    'thoi_gian_dang_ky' => $now->copy()->subHours(5),
                    'han_chot_xac_nhan' => $now->copy()->addMinutes(40),
                    'thoi_gian_phan_hoi' => null,
                ]
            );
        }

        if ($sv2) {
            DB::table('hang_doi_waitlist')->updateOrInsert(
                ['ma_su_kien' => 229, 'ma_tai_khoan' => $sv2->ma_tai_khoan],
                [
                    'so_thu_tu' => 2,
                    'trang_thai' => 'WAITING',
                    'thoi_gian_dang_ky' => $now->copy()->subHours(4),
                    'han_chot_xac_nhan' => null,
                    'thoi_gian_phan_hoi' => null,
                ]
            );
        }
    }
}
