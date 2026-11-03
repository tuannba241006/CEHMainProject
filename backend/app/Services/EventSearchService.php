<?php

namespace App\Services;

use App\Models\SuKien;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EventSearchService
{
    public function search(array $filters): LengthAwarePaginator
    {
        $now = now();

        // Chỉ tải những quan hệ cần thiết.
        // Đồng tổ chức chỉ được công khai khi đã DONG_Y.
        $query = SuKien::query()->with([
            'chuyenDe',
            'donViHost',
            'phongHoiTruong',
            'dongToChucs' => function ($query) {
                $query
                    ->where('trang_thai_xac_nhan', 'DONG_Y')
                    ->with('donViToChuc');
            },
        ]);

        // Không để lộ sự kiện nháp, chờ duyệt hoặc bị hủy.
        $query->whereIn('trang_thai', [
            'PUBLISHED',
            'HAPPENING',
            'COMPLETED',
        ]);

        // Mặc định chỉ hiển thị sự kiện PUBLISHED/HAPPENING.
        if (!empty($filters['trang_thai'])) {
            $query->where('trang_thai', $filters['trang_thai']);
        } else {
            $query->whereIn('trang_thai', [
                'PUBLISHED',
                'HAPPENING',
            ]);
        }


        // Tim kiem theo ten, mo ta va dien gia.
        if (!empty($filters['q'])) {
            $keyword = trim((string) $filters['q']);

            // Loai bo ky tu dac biet, giu chu cai Unicode.
            $keyword = preg_replace(
                '/[^\p{L}\p{N}\s]/u',
                ' ',
                $keyword
            );

            $keyword = trim(
                preg_replace('/\s+/u', ' ', $keyword)
            );

            if ($keyword !== '') {
                if (mb_strlen($keyword, 'UTF-8') < 3) {

                    // Tu khoa ngan: dung LIKE vi MySQL
                    // Full-text co the khong index tu duoi 3 ky tu.
                    $like = '%' . addcslashes(
                        $keyword,
                        '%_\\'
                    ) . '%';

                    $query->where(function ($q) use ($like) {
                        $q->where('ten_su_kien', 'LIKE', $like)
                            ->orWhere('mo_ta', 'LIKE', $like)
                            ->orWhere('dien_gia', 'LIKE', $like);
                    });

                } else {

                    // Tu khoa dai: su dung Full-text index.
                    $query->whereRaw(
                        'MATCH(ten_su_kien, mo_ta, dien_gia)
                         AGAINST (? IN BOOLEAN MODE)',
                        [$keyword]
                    );
                }
            }
        }


        // Chuyên đề.
        if (isset($filters['ma_chuyen_de'])) {
            $query->where(
                'ma_chuyen_de',
                $filters['ma_chuyen_de']
            );
        }

        // Đơn vị chủ trì hoặc đồng tổ chức đã đồng ý.
        if (isset($filters['ma_don_vi_to_chuc'])) {
            $unitId = $filters['ma_don_vi_to_chuc'];

            $query->where(function ($q) use ($unitId) {
                $q->where('ma_don_vi_to_chuc', $unitId)
                    ->orWhereHas('dongToChucs', function ($sub) use ($unitId) {
                        $sub->where('ma_don_vi_to_chuc', $unitId)
                            ->where('trang_thai_xac_nhan', 'DONG_Y');
                    });
            });
        }

        // Điều khoản điểm rèn luyện.
        if (!empty($filters['dieu_khoan_drl'])) {
            $query->where(
                'dieu_khoan_drl',
                $filters['dieu_khoan_drl']
            );
        }

        // Loại sự kiện có/không giới hạn số vé.
        if (array_key_exists('khong_gioi_han_slot', $filters)) {
            $query->where(
                'khong_gioi_han_slot',
                $filters['khong_gioi_han_slot']
            );
        }

        // Lọc theo ngày bắt đầu.
        if (!empty($filters['tu_ngay'])) {
            $query->whereDate(
                'thoi_gian_bat_dau',
                '>=',
                $filters['tu_ngay']
            );
        }

        if (!empty($filters['den_ngay'])) {
            $query->whereDate(
                'thoi_gian_bat_dau',
                '<=',
                $filters['den_ngay']
            );
        }

        // Chỉ lấy sự kiện còn mở đăng ký.
        if (!empty($filters['con_cho'])) {
            $deadline = $now->copy()->addHours(2);

            $query->whereIn('trang_thai', [
                'PUBLISHED',
                'HAPPENING',
            ]);

            $query->where(function ($q) use ($now, $deadline) {
                // Sự kiện mở tự do: đến trước giờ kết thúc.
                $q->where(function ($sub) use ($now) {
                    $sub->where('khong_gioi_han_slot', true)
                        ->where('thoi_gian_ket_thuc', '>', $now);
                })

                // Sự kiện giới hạn vé: còn vé và chưa tới T-2h.
                ->orWhere(function ($sub) use ($deadline) {
                    $sub->where('khong_gioi_han_slot', false)
                        ->where('so_ve_con_lai', '>', 0)
                        ->where('thoi_gian_bat_dau', '>=', $deadline);
                });
            });
        }

        // Sắp xếp.
        $sort = $filters['sort'] ?? 'bat_dau_asc';

        switch ($sort) {
            case 'bat_dau_desc':
                $query->orderByDesc('thoi_gian_bat_dau');
                break;

            case 'moi_cong_bo':
                $query->orderByDesc('ngay_cong_bo');
                break;

            default:
                $query->orderBy('thoi_gian_bat_dau');
                break;
        }

        // Sắp xếp ổn định khi nhiều sự kiện cùng thời gian.
        $query->orderBy('ma_su_kien');

        // Phân trang mặc định 12 sự kiện, tối đa 100.
        $limit = (int) ($filters['limit'] ?? 12);

        return $query->paginate($limit);
    }
}
