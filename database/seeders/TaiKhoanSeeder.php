<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TaiKhoanSeeder extends Seeder
{
    /**
     * Seed tài khoản mẫu ban đầu: Admin gốc, Cán bộ PCTSV, BTC Khoa HTTT, Sinh viên mẫu.
     */
    public function run(): void
    {
        $now = now();
        $passwordCost = ['cost' => 12];

        $taiKhoanList = [
            [
                'ma_tai_khoan' => 1,
                'mssv' => null,
                'email' => 'admin@uit.edu.vn',
                'ho_ten' => 'Quản trị viên Hệ thống (P.CTSV)',
                'mat_khau' => Hash::make('Admin@123', $passwordCost),
                'so_dien_thoai' => '02837252002',
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
            ],
            [
                'ma_tai_khoan' => 2,
                'mssv' => null,
                'email' => 'pctsv@uit.edu.vn',
                'ho_ten' => 'Cán bộ Phòng Công tác Sinh viên',
                'mat_khau' => Hash::make('Admin@123', $passwordCost),
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
            ],
            [
                'ma_tai_khoan' => 3,
                'mssv' => null,
                'email' => 'httt@uit.edu.vn',
                'ho_ten' => 'Ban Tổ chức Khoa Hệ thống Thông tin',
                'mat_khau' => Hash::make('Organizer@123', $passwordCost),
                'so_dien_thoai' => '0901234567',
                'ma_khoa' => 1, // Khoa HTTT
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
            ],
            [
                'ma_tai_khoan' => 4,
                'mssv' => null,
                'email' => 'webdev@uit.edu.vn',
                'ho_ten' => 'Ban Chủ nhiệm CLB WebDev UIT',
                'mat_khau' => Hash::make('Organizer@123', $passwordCost),
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
            ],
            [
                'ma_tai_khoan' => 5,
                'mssv' => '22520001',
                'email' => '22520001@gm.uit.edu.vn',
                'ho_ten' => 'Nguyễn Văn An',
                'mat_khau' => Hash::make('Student@123', $passwordCost),
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
            ],
        ];

        foreach ($taiKhoanList as $tk) {
            DB::table('tai_khoan')->updateOrInsert(
                ['ma_tai_khoan' => $tk['ma_tai_khoan']],
                $tk
            );
        }
    }
}
