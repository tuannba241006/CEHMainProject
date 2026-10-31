<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\ChuyenDe;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\SuKienDongToChuc;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EventDraftService
{
    /**
     * Lấy danh sách sự kiện do đơn vị tổ chức quản lý (đầy đủ 11 trạng thái).
     */
    public function listOrganizerEvents(User $user, array $filters): LengthAwarePaginator
    {
        $query = SuKien::query()
            ->with([
                'chuyenDe',
                'donViHost',
                'phongHoiTruong',
                'dongToChucs.donViToChuc',
            ]);

        // 1. Phân quyền truy cập theo vai trò
        $isAdmin = $user->isAdmin();
        $userUnitId = $user->ma_don_vi_to_chuc;

        if (! $isAdmin) {
            if (! $userUnitId) {
                // Người dùng không thuộc đơn vị nào -> trả về rỗng
                return $query->whereRaw('1 = 0')->paginate(1);
            }

            $role = strtoupper((string) ($filters['vai_tro_don_vi'] ?? 'ALL'));

            if ($role === 'HOST') {
                $query->where('ma_don_vi_to_chuc', $userUnitId);
            } elseif ($role === 'COHOST') {
                $query->whereHas('dongToChucs', function ($q) use ($userUnitId) {
                    $q->where('ma_don_vi_to_chuc', $userUnitId);
                });
            } else {
                // ALL: hoặc là Host hoặc là Co-host
                $query->where(function ($q) use ($userUnitId) {
                    $q->where('ma_don_vi_to_chuc', $userUnitId)
                        ->orWhereHas('dongToChucs', function ($q2) use ($userUnitId) {
                            $q2->where('ma_don_vi_to_chuc', $userUnitId);
                        });
                });
            }
        } else {
            // Admin có thể lọc theo đơn vị nếu có
            if (isset($filters['ma_don_vi_to_chuc'])) {
                $query->where('ma_don_vi_to_chuc', $filters['ma_don_vi_to_chuc']);
            }
        }

        // 2. Lọc theo trạng thái
        if (! empty($filters['trang_thai'])) {
            $query->where('trang_thai', $filters['trang_thai']);
        }

        // 3. Tìm kiếm từ khóa q
        if (! empty($filters['q'])) {
            $keyword = trim((string) $filters['q']);
            $query->where(function ($q) use ($keyword) {
                $q->where('ten_su_kien', 'LIKE', "%{$keyword}%")
                    ->orWhere('mo_ta', 'LIKE', "%{$keyword}%")
                    ->orWhere('dien_gia', 'LIKE', "%{$keyword}%");
            });
        }

        // Sắp xếp mặc định: mới nhất trước
        $query->orderBy('thoi_gian_tao', 'desc');

        $limit = max(1, min(100, (int) ($filters['limit'] ?? 20)));
        $page = max(1, (int) ($filters['page'] ?? 1));

        return $query->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Xem chi tiết quản trị của sự kiện.
     */
    public function getOrganizerEventDetail(User $user, int $eventId): SuKien
    {
        $event = SuKien::with([
            'chuyenDe',
            'donViHost',
            'phongHoiTruong',
            'dongToChucs.donViToChuc',
            'datPhongs',
            'nhatKyKiemDuyets.nguoiThucHien',
        ])->find($eventId);

        if (! $event) {
            throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
        }

        // Kiểm tra quyền hạn
        if (! $user->isAdmin()) {
            $userUnitId = $user->ma_don_vi_to_chuc;
            $isHost = $userUnitId && ((int) $event->ma_don_vi_to_chuc === (int) $userUnitId);
            $isCohost = $userUnitId && $event->dongToChucs->contains('ma_don_vi_to_chuc', $userUnitId);

            // Kiểm tra xem user có phải đại diện Khoa quản lý CLB Host không
            $isFaculty = false;
            if ($userUnitId && $event->donViHost && (int) $event->donViHost->ma_don_vi_cha === (int) $userUnitId) {
                $isFaculty = true;
            }

            if (! $isHost && ! $isCohost && ! $isFaculty) {
                throw new BusinessException('FORBIDDEN', 'Bạn không có quyền truy cập thông tin sự kiện này.', null, 403);
            }
        }

        return $event;
    }

    /**
     * Tạo bản nháp sự kiện mới (UC-EVT-01).
     */
    public function createDraft(User $user, array $data): SuKien
    {
        // 1. Xác định đơn vị chủ trì (Host A)
        $hostUnitId = $user->isAdmin() && ! empty($data['ma_don_vi_to_chuc'])
            ? (int) $data['ma_don_vi_to_chuc']
            : (int) ($user->ma_don_vi_to_chuc ?? 0);

        if ($hostUnitId <= 0) {
            throw new BusinessException('VALIDATION_FAILED', 'Tài khoản chưa được gán đơn vị tổ chức.', null, 422);
        }

        // 2. Kiểm tra chuyên đề (TOPIC_DELETED nếu da_xoa = 1)
        $topic = ChuyenDe::find($data['ma_chuyen_de']);
        if (! $topic) {
            throw new BusinessException('VALIDATION_FAILED', 'Chuyên đề không tồn tại trong hệ thống.', null, 422);
        }
        if ((int) $topic->da_xoa === 1) {
            throw new BusinessException('TOPIC_DELETED', 'Chuyên đề đã bị xóa, vui lòng chọn chuyên đề khác.', null, 422);
        }

        // 3. Kiểm tra phòng hội trường
        $room = PhongHoiTruong::find($data['ma_phong']);
        if (! $room || (int) $room->da_xoa === 1) {
            throw new BusinessException('NOT_FOUND', 'Phòng hội trường không tồn tại hoặc đã bị xóa.', null, 404);
        }

        // 4. Kiểm tra thời gian
        $start = Carbon::parse($data['thoi_gian_bat_dau']);
        $end = Carbon::parse($data['thoi_gian_ket_thuc']);
        $published = Carbon::parse($data['ngay_cong_bo']);

        if ($start->isPast()) {
            throw new BusinessException('START_IN_PAST', 'Thời gian bắt đầu sự kiện phải lớn hơn thời điểm hiện tại.', null, 409);
        }

        if ($end->lte($start)) {
            throw new BusinessException('VALIDATION_FAILED', 'Thời gian kết thúc phải diễn ra sau thời gian bắt đầu sự kiện.', null, 422);
        }

        if ($published->gt($start)) {
            throw new BusinessException('VALIDATION_FAILED', 'Ngày công bố phải nhỏ hơn hoặc bằng thời gian bắt đầu sự kiện.', null, 422);
        }

        // 5. Kiểm tra sức chứa phòng (CAPACITY_EXCEEDS_ROOM nếu so_luong_toi_da > suc_chua_toi_da)
        $unlimited = (bool) $data['khong_gioi_han_slot'];
        $soLuongToiDa = $unlimited ? null : (int) $data['so_luong_toi_da'];

        if (! $unlimited) {
            if ($soLuongToiDa > $room->suc_chua_toi_da) {
                throw new BusinessException(
                    'CAPACITY_EXCEEDS_ROOM',
                    "Số lượng vé phát hành ({$soLuongToiDa}) vượt quá sức chứa tối đa của {$room->ten_phong} ({$room->suc_chua_toi_da} chỗ).",
                    null,
                    409
                );
            }
        }

        // 6. Kiểm tra danh sách đồng tổ chức
        $coHostIds = isset($data['danh_sach_co_host_ids']) ? array_map('intval', (array) $data['danh_sach_co_host_ids']) : [];
        $coHostIds = array_values(array_unique(array_filter($coHostIds)));

        if (in_array($hostUnitId, $coHostIds, true)) {
            throw new BusinessException('VALIDATION_FAILED', 'Đơn vị đồng tổ chức không được trùng với đơn vị chủ trì.', null, 422);
        }

        // 7. Thực thi lưu vào CSDL trong Transaction
        return DB::transaction(function () use ($data, $hostUnitId, $unlimited, $soLuongToiDa, $coHostIds) {
            $event = SuKien::create([
                'ma_don_vi_to_chuc' => $hostUnitId,
                'ma_chuyen_de' => (int) $data['ma_chuyen_de'],
                'ma_phong' => (int) $data['ma_phong'],
                'ten_su_kien' => trim((string) $data['ten_su_kien']),
                'anh_bia' => $data['anh_bia'] ?? null,
                'dien_gia' => $data['dien_gia'] ?? null,
                'mo_ta' => trim((string) $data['mo_ta']),
                'lo_trinh' => $data['lo_trinh'] ?? null,
                'doi_tuong_tham_gia' => $data['doi_tuong_tham_gia'] ?? null,
                'ngay_cong_bo' => $data['ngay_cong_bo'],
                'thoi_gian_bat_dau' => $data['thoi_gian_bat_dau'],
                'thoi_gian_ket_thuc' => $data['thoi_gian_ket_thuc'],
                'khong_gioi_han_slot' => $unlimited ? 1 : 0,
                'so_luong_toi_da' => $soLuongToiDa,
                'so_ve_con_lai' => $soLuongToiDa,
                'so_slot_dong_bang' => 0,
                'dieu_khoan_drl' => $data['dieu_khoan_drl'],
                'diem_drl_du_kien' => $data['dieu_khoan_drl'] === 'KhongCo' ? 0 : (int) $data['diem_drl_du_kien'],
                'gio_tinh_nguyen' => isset($data['gio_tinh_nguyen']) ? (float) $data['gio_tinh_nguyen'] : 0.0,
                'trang_thai' => 'DRAFT',
                'cong_check_in_mo' => 0,
                'cong_check_out_mo' => 0,
                'da_chot_drl' => 0,
            ]);

            // Lưu các lời mời đồng tổ chức với trạng thái CHO_XAC_NHAN
            foreach ($coHostIds as $coHostId) {
                SuKienDongToChuc::create([
                    'ma_su_kien' => $event->ma_su_kien,
                    'ma_don_vi_to_chuc' => $coHostId,
                    'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
                ]);
            }

            return $event->load([
                'chuyenDe',
                'donViHost',
                'phongHoiTruong',
                'dongToChucs.donViToChuc',
                'datPhongs',
                'nhatKyKiemDuyets',
            ]);
        });
    }

    /**
     * Cập nhật bản nháp sự kiện (Chỉ khi trang_thai = DRAFT).
     */
    public function updateDraft(User $user, int $eventId, array $data): SuKien
    {
        $event = SuKien::find($eventId);
        if (! $event) {
            throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
        }

        // 1. Phân quyền: Chỉ Host A hoặc Admin
        if (! $user->isAdmin() && (int) $event->ma_don_vi_to_chuc !== (int) $user->ma_don_vi_to_chuc) {
            throw new BusinessException('FORBIDDEN', 'Bạn không có quyền chỉnh sửa sự kiện này.', null, 403);
        }

        // 2. Trạng thái: Chỉ cho phép sửa khi DRAFT
        if ($event->trang_thai !== 'DRAFT') {
            throw new BusinessException(
                'INVALID_STATE_TRANSITION',
                'Chỉ được phép chỉnh sửa nội dung khi sự kiện đang ở trạng thái Bản nháp (DRAFT).',
                null,
                409
            );
        }

        // 3. Kiểm tra chuyên đề (TOPIC_DELETED)
        $topic = ChuyenDe::find($data['ma_chuyen_de']);
        if (! $topic) {
            throw new BusinessException('VALIDATION_FAILED', 'Chuyên đề không tồn tại trong hệ thống.', null, 422);
        }
        if ((int) $topic->da_xoa === 1) {
            throw new BusinessException('TOPIC_DELETED', 'Chuyên đề đã bị xóa, vui lòng chọn chuyên đề khác.', null, 422);
        }

        // 4. Kiểm tra phòng hội trường
        $room = PhongHoiTruong::find($data['ma_phong']);
        if (! $room || (int) $room->da_xoa === 1) {
            throw new BusinessException('NOT_FOUND', 'Phòng hội trường không tồn tại hoặc đã bị xóa.', null, 404);
        }

        // 5. Kiểm tra thời gian
        $start = Carbon::parse($data['thoi_gian_bat_dau']);
        $end = Carbon::parse($data['thoi_gian_ket_thuc']);
        $published = Carbon::parse($data['ngay_cong_bo']);

        if ($start->isPast()) {
            throw new BusinessException('START_IN_PAST', 'Thời gian bắt đầu sự kiện phải lớn hơn thời điểm hiện tại.', null, 409);
        }

        if ($end->lte($start)) {
            throw new BusinessException('VALIDATION_FAILED', 'Thời gian kết thúc phải diễn ra sau thời gian bắt đầu sự kiện.', null, 422);
        }

        if ($published->gt($start)) {
            throw new BusinessException('VALIDATION_FAILED', 'Ngày công bố phải nhỏ hơn hoặc bằng thời gian bắt đầu sự kiện.', null, 422);
        }

        // 6. Kiểm tra sức chứa
        $unlimited = (bool) $data['khong_gioi_han_slot'];
        $soLuongToiDa = $unlimited ? null : (int) $data['so_luong_toi_da'];

        if (! $unlimited) {
            if ($soLuongToiDa > $room->suc_chua_toi_da) {
                throw new BusinessException(
                    'CAPACITY_EXCEEDS_ROOM',
                    "Số lượng vé phát hành ({$soLuongToiDa}) vượt quá sức chứa tối đa của {$room->ten_phong} ({$room->suc_chua_toi_da} chỗ).",
                    null,
                    409
                );
            }
        }

        // 7. Kiểm tra đồng tổ chức
        $hostUnitId = (int) $event->ma_don_vi_to_chuc;
        $coHostIds = isset($data['danh_sach_co_host_ids']) ? array_map('intval', (array) $data['danh_sach_co_host_ids']) : [];
        $coHostIds = array_values(array_unique(array_filter($coHostIds)));

        if (in_array($hostUnitId, $coHostIds, true)) {
            throw new BusinessException('VALIDATION_FAILED', 'Đơn vị đồng tổ chức không được trùng với đơn vị chủ trì.', null, 422);
        }

        // 8. Cập nhật trong Transaction
        return DB::transaction(function () use ($event, $data, $unlimited, $soLuongToiDa, $coHostIds) {
            $event->update([
                'ma_chuyen_de' => (int) $data['ma_chuyen_de'],
                'ma_phong' => (int) $data['ma_phong'],
                'ten_su_kien' => trim((string) $data['ten_su_kien']),
                'anh_bia' => $data['anh_bia'] ?? null,
                'dien_gia' => $data['dien_gia'] ?? null,
                'mo_ta' => trim((string) $data['mo_ta']),
                'lo_trinh' => $data['lo_trinh'] ?? null,
                'doi_tuong_tham_gia' => $data['doi_tuong_tham_gia'] ?? null,
                'ngay_cong_bo' => $data['ngay_cong_bo'],
                'thoi_gian_bat_dau' => $data['thoi_gian_bat_dau'],
                'thoi_gian_ket_thuc' => $data['thoi_gian_ket_thuc'],
                'khong_gioi_han_slot' => $unlimited ? 1 : 0,
                'so_luong_toi_da' => $soLuongToiDa,
                'so_ve_con_lai' => $soLuongToiDa,
                'dieu_khoan_drl' => $data['dieu_khoan_drl'],
                'diem_drl_du_kien' => $data['dieu_khoan_drl'] === 'KhongCo' ? 0 : (int) $data['diem_drl_du_kien'],
                'gio_tinh_nguyen' => isset($data['gio_tinh_nguyen']) ? (float) $data['gio_tinh_nguyen'] : 0.0,
            ]);

            // Thay thế đồng bộ danh sách đồng tổ chức
            SuKienDongToChuc::where('ma_su_kien', $event->ma_su_kien)->delete();
            foreach ($coHostIds as $coHostId) {
                SuKienDongToChuc::create([
                    'ma_su_kien' => $event->ma_su_kien,
                    'ma_don_vi_to_chuc' => $coHostId,
                    'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
                ]);
            }

            return $event->fresh([
                'chuyenDe',
                'donViHost',
                'phongHoiTruong',
                'dongToChucs.donViToChuc',
                'datPhongs',
                'nhatKyKiemDuyets',
            ]);
        });
    }
}
