<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\RoomStatus;
use App\Models\DatPhong;
use App\Models\PhongHoiTruong;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RoomService
{
    /**
     * Lấy danh sách phòng hội trường có phân trang và bộ lọc.
     */
    public function getRooms(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = PhongHoiTruong::query();

        if (! empty($filters['co_so'])) {
            $query->where('co_so', $filters['co_so']);
        }

        if (! empty($filters['suc_chua_min'])) {
            $query->where('suc_chua_toi_da', '>=', (int) $filters['suc_chua_min']);
        }

        if (! empty($filters['trang_thai'])) {
            $query->where('trang_thai', $filters['trang_thai']);
        }

        return $query->orderBy('ma_phong', 'desc')->paginate($perPage);
    }

    /**
     * Tạo mới phòng hội trường.
     */
    public function createRoom(array $data): PhongHoiTruong
    {
        if (empty($data['trang_thai'])) {
            $data['trang_thai'] = RoomStatus::KhaDung->value;
        }

        return PhongHoiTruong::create($data);
    }

    /**
     * Lấy chi tiết một phòng hội trường.
     */
    public function getRoom(int $id): PhongHoiTruong
    {
        return PhongHoiTruong::findOrFail($id);
    }

    /**
     * Cập nhật thông tin phòng hội trường.
     * Trả về mảng ['success' => bool, 'room' => ?, 'error' => ?, 'affected_events' => ?]
     */
    public function updateRoom(int $id, array $data): array
    {
        $room = PhongHoiTruong::findOrFail($id);

        $targetStatus = $data['trang_thai'] ?? $room->trang_thai;
        if ($targetStatus instanceof \BackedEnum) {
            $targetStatus = $targetStatus->value;
        }

        if ($targetStatus === RoomStatus::BaoTri->value) {
            $baoTriTu = $data['bao_tri_tu_ngay'] ?? $room->bao_tri_tu_ngay;
            $baoTriDen = $data['bao_tri_den_ngay'] ?? $room->bao_tri_den_ngay;

            $affectedBookings = DatPhong::query()
                ->where('ma_phong', $id)
                ->where('trang_thai', BookingStatus::Confirmed->value)
                ->where('thoi_gian_bat_dau', '<', $baoTriDen)
                ->where('thoi_gian_ket_thuc', '>', $baoTriTu)
                ->with('suKien:ma_su_kien,ten_su_kien,thoi_gian_bat_dau,thoi_gian_ket_thuc')
                ->get();

            if ($affectedBookings->isNotEmpty()) {
                $affectedEvents = $affectedBookings->map(function ($b) {
                    return [
                        'ma_su_kien' => (int) $b->ma_su_kien,
                        'ten_su_kien' => (string) ($b->suKien?->ten_su_kien ?? ''),
                        'thoi_gian_bat_dau' => $b->thoi_gian_bat_dau ? $b->thoi_gian_bat_dau->format('Y-m-d H:i:s') : null,
                        'thoi_gian_ket_thuc' => $b->thoi_gian_ket_thuc ? $b->thoi_gian_ket_thuc->format('Y-m-d H:i:s') : null,
                    ];
                })->values()->all();

                return [
                    'success' => false,
                    'error_code' => 'ROOM_MAINTENANCE_CONFLICT',
                    'affected_events' => $affectedEvents,
                ];
            }
        } elseif ($targetStatus === RoomStatus::KhaDung->value) {
            // Khi chuyển về Khả Dụng, bắt buộc set các trường bảo trì về null để thỏa DB constraint chk_phong_baotri
            $data['bao_tri_tu_ngay'] = null;
            $data['bao_tri_den_ngay'] = null;
            $data['ly_do_bao_tri'] = null;
        }

        $room->update($data);

        return [
            'success' => true,
            'room' => $room->fresh(),
        ];
    }

    /**
     * Xóa mềm phòng hội trường (đánh dấu da_xoa = 1).
     * Chặn xóa nếu phòng đã từng có lịch sử đặt phòng (kể cả CANCELLED).
     */
    public function deleteRoom(int $id): array
    {
        $room = PhongHoiTruong::findOrFail($id);

        $totalBookings = DatPhong::where('ma_phong', $id)->count();
        if ($totalBookings > 0) {
            return [
                'success' => false,
                'error_code' => 'ROOM_HAS_BOOKING_HISTORY',
                'total_bookings' => $totalBookings,
            ];
        }

        $room->update(['da_xoa' => 1]);

        return [
            'success' => true,
            'room' => $room->fresh(),
        ];
    }
}
