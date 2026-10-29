<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\RoomStatus;
use App\Models\DatPhong;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\SuKienDongToChuc;
use Carbon\Carbon;

class RoomScheduleService
{
    /**
     * Tra cứu lịch phòng trong khoảng thời gian [tu_ngay, den_ngay].
     */
    public function getSchedule(int $roomId, string $tuNgayStr, string $denNgayStr): array
    {
        $tuNgay = Carbon::parse($tuNgayStr)->startOfDay();
        $denNgay = Carbon::parse($denNgayStr)->endOfDay();

        // Kiểm tra phạm vi tối đa 31 ngày
        if ($tuNgay->diffInDays($denNgay) > 31) {
            return [
                'success' => false,
                'error_code' => 'DATE_RANGE_TOO_LARGE',
                'message' => 'Khoảng thời gian tra cứu lịch không được vượt quá 31 ngày.',
            ];
        }

        $room = PhongHoiTruong::findOrFail($roomId);

        // Lấy danh sách booking hợp lệ trong khoảng thời gian
        $bookings = DatPhong::query()
            ->where('ma_phong', $roomId)
            ->where(function ($q) {
                $q->where('trang_thai', BookingStatus::Confirmed->value)
                    ->orWhere(function ($q2) {
                        $q2->where('trang_thai', BookingStatus::Pending->value)
                            ->where(function ($q3) {
                                $q3->whereNull('han_giu_cho_tam')
                                    ->orWhere('han_giu_cho_tam', '>=', now());
                            });
                    });
            })
            ->where('thoi_gian_bat_dau', '<', $denNgay)
            ->where('thoi_gian_ket_thuc', '>', $tuNgay)
            ->with(['suKien.donViHost'])
            ->orderBy('thoi_gian_bat_dau')
            ->get();

        $bookingList = $bookings->map(function ($b) {
            return [
                'ma_dat_phong' => (int) $b->ma_dat_phong,
                'ma_su_kien' => (int) $b->ma_su_kien,
                'ten_su_kien' => (string) ($b->suKien?->ten_su_kien ?? ''),
                'ten_don_vi_host' => $b->suKien?->donViHost?->ten_don_vi,
                'thoi_gian_bat_dau' => $b->thoi_gian_bat_dau ? $b->thoi_gian_bat_dau->format('Y-m-d H:i:s') : null,
                'thoi_gian_ket_thuc' => $b->thoi_gian_ket_thuc ? $b->thoi_gian_ket_thuc->format('Y-m-d H:i:s') : null,
                'han_giu_cho_tam' => $b->han_giu_cho_tam ? $b->han_giu_cho_tam->format('Y-m-d H:i:s') : null,
                'trang_thai' => (string) $b->trang_thai,
            ];
        })->values()->all();

        // Lấy thông tin bảo trì nếu có overlap
        $maintenanceList = [];
        $isBaoTri = ($room->trang_thai instanceof \BackedEnum ? $room->trang_thai->value : (string) $room->trang_thai) === RoomStatus::BaoTri->value;

        if ($isBaoTri && $room->bao_tri_tu_ngay && $room->bao_tri_den_ngay) {
            if ($room->bao_tri_tu_ngay < $denNgay && $room->bao_tri_den_ngay > $tuNgay) {
                $maintenanceList[] = [
                    'bat_dau_bao_tri' => $room->bao_tri_tu_ngay->format('Y-m-d H:i:s'),
                    'ket_thuc_bao_tri' => $room->bao_tri_den_ngay->format('Y-m-d H:i:s'),
                    'ly_do_bao_tri' => $room->ly_do_bao_tri,
                ];
            }
        }

        return [
            'success' => true,
            'data' => [
                'room' => [
                    'ma_phong' => (int) $room->ma_phong,
                    'ten_phong' => (string) $room->ten_phong,
                    'co_so' => $room->co_so instanceof \BackedEnum ? $room->co_so->value : (string) $room->co_so,
                ],
                'range' => [
                    'tu_ngay' => $tuNgayStr,
                    'den_ngay' => $denNgayStr,
                ],
                'maintenance' => $maintenanceList,
                'bookings' => $bookingList,
            ],
            'message' => 'Lấy lịch phòng thành công.',
        ];
    }

    /**
     * Kiểm tra khả dụng phòng — CHỈ LÀ PRE-CHECK.
     *
     * Phương thức này KHÔNG khóa dòng, KHÔNG mở transaction dài.
     * Mọi giao dịch tạo/duyệt dat_phong (PKG-02, PKG-03) PHẢI re-check
     * dưới transaction và tuân thủ Lock Ordering toàn cục:
     *   tai_khoan → phong_hoi_truong → dat_phong → su_kien → ...
     *
     * Kết quả availability KHÔNG đảm bảo race-free.
     */
    public function checkAvailability(int $roomId, Carbon $start, Carbon $end, ?int $excludeEventId, $user): array
    {
        $room = PhongHoiTruong::findOrFail($roomId);

        // Step 1 — Check quyền exclude_event_id (nếu có)
        if ($excludeEventId !== null) {
            $event = SuKien::find($excludeEventId);
            if (! $event) {
                return [
                    'success' => false,
                    'error_code' => 'EXCLUDE_EVENT_FORBIDDEN',
                    'message' => 'Sự kiện loại trừ không tồn tại hoặc bạn không có quyền truy cập.',
                ];
            }

            $isAdmin = $user && (method_exists($user, 'isAdmin') ? $user->isAdmin() : ($user->loai_tai_khoan === 'Admin'));

            if (! $isAdmin) {
                $userUnitId = $user->ma_don_vi_to_chuc ?? null;
                $isHost = $userUnitId && ((int) $event->ma_don_vi_to_chuc === (int) $userUnitId);

                $isCohostAccepted = false;
                if (! $isHost && $userUnitId) {
                    $isCohostAccepted = SuKienDongToChuc::where('ma_su_kien', $excludeEventId)
                        ->where('ma_don_vi_to_chuc', $userUnitId)
                        ->where('trang_thai_xac_nhan', 'DONG_Y')
                        ->exists();
                }

                if (! $isHost && ! $isCohostAccepted) {
                    return [
                        'success' => false,
                        'error_code' => 'EXCLUDE_EVENT_FORBIDDEN',
                        'message' => 'Bạn không phải đơn vị tổ chức hoặc đồng tổ chức được duyệt của sự kiện này.',
                    ];
                }
            }
        }

        // Step 2 — Check bảo trì (Không cộng buffer 15 phút cho bảo trì)
        $roomStatus = $room->trang_thai instanceof \BackedEnum ? $room->trang_thai->value : (string) $room->trang_thai;
        $maintenanceConflict = (
            $roomStatus === RoomStatus::BaoTri->value
            && $room->bao_tri_tu_ngay !== null
            && $room->bao_tri_den_ngay !== null
            && $room->bao_tri_tu_ngay < $end
            && $room->bao_tri_den_ngay > $start
        );

        $maintenanceConflictData = null;
        if ($maintenanceConflict) {
            $maintenanceConflictData = [
                'bat_dau_bao_tri' => $room->bao_tri_tu_ngay->format('Y-m-d H:i:s'),
                'ket_thuc_bao_tri' => $room->bao_tri_den_ngay->format('Y-m-d H:i:s'),
                'ly_do_bao_tri' => (string) ($room->ly_do_bao_tri ?? ''),
            ];
        }

        // Step 3 — Check booking conflict (Buffer 15 phút)
        $startMinus15 = $start->copy()->subMinutes(15);
        $endPlus15 = $end->copy()->addMinutes(15);

        $conflicts = DatPhong::query()
            ->where('ma_phong', $roomId)
            ->when($excludeEventId, fn ($q) => $q->where('ma_su_kien', '!=', $excludeEventId))
            ->where(function ($q) {
                $q->where('trang_thai', BookingStatus::Confirmed->value)
                    ->orWhere(function ($q2) {
                        $q2->where('trang_thai', BookingStatus::Pending->value)
                            ->where(function ($q3) {
                                $q3->whereNull('han_giu_cho_tam')
                                    ->orWhere('han_giu_cho_tam', '>=', now());
                            });
                    });
            })
            ->where('thoi_gian_bat_dau', '<', $endPlus15)
            ->where('thoi_gian_ket_thuc', '>', $startMinus15)
            ->with('suKien:ma_su_kien,ten_su_kien')
            ->get();

        $conflictList = $conflicts->map(function ($c) {
            return [
                'ma_dat_phong' => (int) $c->ma_dat_phong,
                'ma_su_kien' => (int) $c->ma_su_kien,
                'ten_su_kien' => (string) ($c->suKien?->ten_su_kien ?? ''),
                'thoi_gian_bat_dau' => $c->thoi_gian_bat_dau ? $c->thoi_gian_bat_dau->format('Y-m-d H:i:s') : null,
                'thoi_gian_ket_thuc' => $c->thoi_gian_ket_thuc ? $c->thoi_gian_ket_thuc->format('Y-m-d H:i:s') : null,
                'trang_thai' => (string) $c->trang_thai,
                'conflict_type' => 'BUFFER_OVERLAP',
            ];
        })->values()->all();

        // Step 4 — Build response
        $available = (empty($conflictList) && ! $maintenanceConflict);

        return [
            'success' => true,
            'data' => [
                'available' => $available,
                'conflicts' => $conflictList,
                'maintenance_conflict' => $maintenanceConflictData,
            ],
            'message' => $available ? 'Phòng khả dụng trong khung giờ đã chọn.' : 'Phòng không khả dụng trong khung giờ đã chọn.',
        ];
    }
}
