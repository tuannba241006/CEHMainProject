<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DonViToChucSeeder extends Seeder
{
    /**
     * Seed danh mục Đơn vị tổ chức UIT: 6 Khoa, Phòng ban, Đoàn - Hội, CLB.
     */
    public function run(): void
    {
        $now = now();

        $donViCapTren = [
            [
                'ma_don_vi_to_chuc' => 1,
                'ma_don_vi_cha' => null,
                'ten_don_vi' => 'Khoa Hệ thống Thông tin',
                'ma_dinh_danh' => 'KHOA_HTTT',
                'loai_don_vi' => 'Khoa',
                'mo_ta' => 'Khoa Hệ thống Thông tin - Trường ĐH Công nghệ Thông tin - ĐHQG-HCM',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_don_vi_to_chuc' => 2,
                'ma_don_vi_cha' => null,
                'ten_don_vi' => 'Khoa Khoa học Máy tính',
                'ma_dinh_danh' => 'KHOA_KHMT',
                'loai_don_vi' => 'Khoa',
                'mo_ta' => 'Khoa Khoa học Máy tính - Trường ĐH Công nghệ Thông tin - ĐHQG-HCM',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_don_vi_to_chuc' => 3,
                'ma_don_vi_cha' => null,
                'ten_don_vi' => 'Khoa Kỹ thuật Máy tính',
                'ma_dinh_danh' => 'KHOA_KTMT',
                'loai_don_vi' => 'Khoa',
                'mo_ta' => 'Khoa Kỹ thuật Máy tính - Trường ĐH Công nghệ Thông tin - ĐHQG-HCM',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_don_vi_to_chuc' => 4,
                'ma_don_vi_cha' => null,
                'ten_don_vi' => 'Khoa Mạng máy tính và Truyền thông',
                'ma_dinh_danh' => 'KHOA_MMT',
                'loai_don_vi' => 'Khoa',
                'mo_ta' => 'Khoa Mạng máy tính và Truyền thông - Trường ĐH Công nghệ Thông tin',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_don_vi_to_chuc' => 5,
                'ma_don_vi_cha' => null,
                'ten_don_vi' => 'Khoa Kỹ thuật Phần mềm',
                'ma_dinh_danh' => 'KHOA_KTPM',
                'loai_don_vi' => 'Khoa',
                'mo_ta' => 'Khoa Kỹ thuật Phần mềm - Trường ĐH Công nghệ Thông tin - ĐHQG-HCM',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_don_vi_to_chuc' => 6,
                'ma_don_vi_cha' => null,
                'ten_don_vi' => 'Khoa Khoa học và Kỹ thuật Thông tin',
                'ma_dinh_danh' => 'KHOA_TTDPT',
                'loai_don_vi' => 'Khoa',
                'mo_ta' => 'Khoa Khoa học và Kỹ thuật Thông tin (TTĐPT) - UIT',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_don_vi_to_chuc' => 7,
                'ma_don_vi_cha' => null,
                'ten_don_vi' => 'Phòng Công tác Sinh viên',
                'ma_dinh_danh' => 'PCTSV',
                'loai_don_vi' => 'PhongBan',
                'mo_ta' => 'Phòng Công tác Sinh viên UIT - Đơn vị quản lý cấp trường',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_don_vi_to_chuc' => 8,
                'ma_don_vi_cha' => null,
                'ten_don_vi' => 'Đoàn Thanh niên - Hội Sinh viên',
                'ma_dinh_danh' => 'DOAN_HOI_UIT',
                'loai_don_vi' => 'DoanHoi',
                'mo_ta' => 'Đoàn trường ĐH Công nghệ Thông tin',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        foreach ($donViCapTren as $dv) {
            DB::table('don_vi_to_chuc')->updateOrInsert(
                ['ma_don_vi_to_chuc' => $dv['ma_don_vi_to_chuc']],
                $dv
            );
        }

        $clbTrucThuoc = [
            [
                'ma_don_vi_to_chuc' => 9,
                'ma_don_vi_cha' => 1, // Khoa HTTT
                'ten_don_vi' => 'CLB WebDev UIT',
                'ma_dinh_danh' => 'CLB_WEBDEV',
                'loai_don_vi' => 'CLB',
                'mo_ta' => 'CLB Lập trình Web - Trực thuộc Khoa Hệ thống Thông tin',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_don_vi_to_chuc' => 10,
                'ma_don_vi_cha' => 2, // Khoa KHMT
                'ten_don_vi' => 'CLB Trí tuệ Nhân tạo (AI Club)',
                'ma_dinh_danh' => 'CLB_AI',
                'loai_don_vi' => 'CLB',
                'mo_ta' => 'CLB Nghiên cứu và Ứng dụng AI - Trực thuộc Khoa KHMT',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_don_vi_to_chuc' => 11,
                'ma_don_vi_cha' => 4, // Khoa MMT
                'ten_don_vi' => 'CLB An toàn Thông tin (CyberSecurity Club)',
                'ma_dinh_danh' => 'CLB_CYBER',
                'loai_don_vi' => 'CLB',
                'mo_ta' => 'CLB An toàn Thông tin - Trực thuộc Khoa Mạng máy tính & TT',
                'logo_url' => null,
                'hoat_dong' => 1,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        foreach ($clbTrucThuoc as $clb) {
            DB::table('don_vi_to_chuc')->updateOrInsert(
                ['ma_don_vi_to_chuc' => $clb['ma_don_vi_to_chuc']],
                $clb
            );
        }
    }
}
