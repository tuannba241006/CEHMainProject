<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PhongHoiTruongSeeder extends Seeder
{
    /**
     * Seed danh mục Phòng Hội trường UIT: Hội trường E, Hội trường A, C109, B114.
     */
    public function run(): void
    {
        $now = now();

        $phongHoiTruong = [
            [
                'ma_phong' => 1,
                'ten_phong' => 'Hội trường E',
                'co_so' => 'CoSo1',
                'suc_chua_toi_da' => 500,
                'trang_thiet_bi' => json_encode([
                    'man_chieu' => true,
                    'am_thanh' => 'CongSuatLon',
                    'mic_khong_day' => 4,
                    'may_lanh' => true,
                    'kiosk_checkin' => true,
                ]),
                'trang_thai' => 'KhaDung',
                'bao_tri_tu_ngay' => null,
                'bao_tri_den_ngay' => null,
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_phong' => 2,
                'ten_phong' => 'Hội trường A',
                'co_so' => 'CoSo1',
                'suc_chua_toi_da' => 300,
                'trang_thiet_bi' => json_encode([
                    'man_chieu' => true,
                    'am_thanh' => 'TieuChuan',
                    'mic_khong_day' => 2,
                    'may_lanh' => true,
                ]),
                'trang_thai' => 'KhaDung',
                'bao_tri_tu_ngay' => null,
                'bao_tri_den_ngay' => null,
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_phong' => 3,
                'ten_phong' => 'Phòng C109',
                'co_so' => 'CoSo1',
                'suc_chua_toi_da' => 150,
                'trang_thiet_bi' => json_encode([
                    'may_chieu' => true,
                    'am_thanh' => 'LopHoc',
                    'mic_khong_day' => 2,
                    'may_lanh' => true,
                ]),
                'trang_thai' => 'KhaDung',
                'bao_tri_tu_ngay' => null,
                'bao_tri_den_ngay' => null,
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_phong' => 4,
                'ten_phong' => 'Phòng B114',
                'co_so' => 'CoSo1',
                'suc_chua_toi_da' => 100,
                'trang_thiet_bi' => json_encode([
                    'may_chieu' => true,
                    'am_thanh' => 'LopHoc',
                    'mic_khong_day' => 1,
                    'may_lanh' => true,
                ]),
                'trang_thai' => 'KhaDung',
                'bao_tri_tu_ngay' => null,
                'bao_tri_den_ngay' => null,
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_phong' => 5,
                'ten_phong' => 'Hội trường CS2',
                'co_so' => 'CoSo2',
                'suc_chua_toi_da' => 120,
                'trang_thiet_bi' => json_encode([
                    'may_chieu' => true,
                    'am_thanh' => 'TieuChuan',
                    'may_lanh' => true,
                ]),
                'trang_thai' => 'KhaDung',
                'bao_tri_tu_ngay' => null,
                'bao_tri_den_ngay' => null,
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        foreach ($phongHoiTruong as $phong) {
            DB::table('phong_hoi_truong')->updateOrInsert(
                ['ma_phong' => $phong['ma_phong']],
                $phong
            );
        }
    }
}
