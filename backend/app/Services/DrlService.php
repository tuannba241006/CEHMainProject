<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\NhatKyKiemDuyet;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DrlService
{
    public function __construct(
        protected DrlExportService $exportService
    ) {}

    /**
     * Lấy danh sách Điểm Rèn Luyện tổng hợp của sự kiện qua View v_danh_sach_drl (UC-DRL-01).
     */
    public function getDrlList(User $user, int $eventId, int $page = 1, int $limit = 20): LengthAwarePaginator
    {
        $event = SuKien::find($eventId);
        if (! $event) {
            throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
        }

        $this->authorizeHostOrAdmin($user, $event, 'xem danh sách ĐRL');

        return DB::table('v_danh_sach_drl')
            ->where('ma_su_kien', $eventId)
            ->orderBy('stt')
            ->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Khóa chốt danh sách Điểm Rèn Luyện của sự kiện (da_chot_drl = 1 - UC-DRL-01).
     *
     * @return array<string, mixed>
     */
    public function lockDrl(User $user, int $eventId, ?string $reason = null): array
    {
        $event = SuKien::find($eventId);
        if (! $event) {
            throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
        }

        $this->authorizeHostOrAdmin($user, $event, 'khóa chốt danh sách ĐRL');

        return DB::transaction(function () use ($user, $eventId, $reason) {
            /** @var SuKien $lockedEvent */
            $lockedEvent = SuKien::where('ma_su_kien', $eventId)->lockForUpdate()->firstOrFail();

            if ($lockedEvent->da_chot_drl) {
                throw new BusinessException(
                    'DRL_LOCKED',
                    'Danh sách Điểm Rèn Luyện của sự kiện này đã được khóa chốt.',
                    null,
                    409
                );
            }

            if ($lockedEvent->trang_thai !== 'COMPLETED') {
                throw new BusinessException(
                    'DRL_NOT_READY',
                    'Chỉ được khóa chốt danh sách ĐRL sau khi sự kiện đã COMPLETED và kết thúc thời hạn 48 giờ khảo sát.',
                    null,
                    409
                );
            }

            $feedbackCutoff = Carbon::parse($lockedEvent->thoi_gian_ket_thuc)->addHours(48);
            if (now()->lt($feedbackCutoff)) {
                throw new BusinessException(
                    'DRL_NOT_READY',
                    'Chỉ được khóa chốt danh sách ĐRL sau khi sự kiện đã COMPLETED và kết thúc thời hạn 48 giờ khảo sát.',
                    null,
                    409
                );
            }

            $now = now();
            $lockedEvent->da_chot_drl = true;
            $lockedEvent->thoi_gian_chot_drl = $now;
            $lockedEvent->save();

            NhatKyKiemDuyet::create([
                'ma_su_kien' => $eventId,
                'nguoi_thuc_hien' => $user->ma_tai_khoan,
                'hanh_dong' => 'LOCK_DRL',
                'trang_thai_truoc' => 'UNLOCKED',
                'trang_thai_sau' => 'LOCKED',
                'ly_do' => $reason ?: 'Khóa chốt danh sách Điểm Rèn Luyện theo kế hoạch',
                'thoi_gian_tao' => $now,
            ]);

            return [
                'ma_su_kien' => (int) $lockedEvent->ma_su_kien,
                'da_chot_drl' => true,
                'thoi_gian_chot_drl' => $now->setTimezone('+07:00')->toIso8601String(),
                'file_export_url' => "/api/v1/events/{$lockedEvent->ma_su_kien}/drl/export",
            ];
        });
    }

    /**
     * Admin mở khóa điều chỉnh danh sách Điểm Rèn Luyện sau khi đã chốt (UC-DRL-01.AC.1).
     */
    public function unlockDrl(User $user, int $eventId, string $reason): SuKien
    {
        if (! $user->isAdmin()) {
            throw new BusinessException(
                'FORBIDDEN',
                'Chỉ Quản trị viên mới có quyền mở khóa điều chỉnh danh sách Điểm Rèn Luyện.',
                null,
                403
            );
        }

        return DB::transaction(function () use ($user, $eventId, $reason) {
            /** @var SuKien $lockedEvent */
            $lockedEvent = SuKien::with([
                'chuyenDe',
                'donViHost',
                'phongHoiTruong',
                'dongToChucs.donViToChuc',
                'datPhongs',
                'nhatKyKiemDuyets.nguoiThucHien',
            ])->where('ma_su_kien', $eventId)->lockForUpdate()->first();

            if (! $lockedEvent) {
                throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
            }

            if (! $lockedEvent->da_chot_drl) {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Danh sách Điểm Rèn Luyện hiện đang mở, không cần mở khóa.',
                    null,
                    409
                );
            }

            $lockedEvent->da_chot_drl = false;
            $lockedEvent->thoi_gian_chot_drl = null;
            $lockedEvent->save();

            NhatKyKiemDuyet::create([
                'ma_su_kien' => $eventId,
                'nguoi_thuc_hien' => $user->ma_tai_khoan,
                'hanh_dong' => 'UNLOCK_DRL',
                'trang_thai_truoc' => 'LOCKED',
                'trang_thai_sau' => 'UNLOCKED',
                'ly_do' => $reason,
                'thoi_gian_tao' => now(),
            ]);

            // Refresh relationships
            $lockedEvent->load(['nhatKyKiemDuyets.nguoiThucHien']);

            return $lockedEvent;
        });
    }

    /**
     * Kết xuất danh sách Điểm Rèn Luyện chuẩn biểu mẫu CTSV (UC-DRL-01).
     *
     * @return array{content: string, mime: string, filename: string}
     */
    public function exportDrl(User $user, int $eventId, string $format = 'xlsx'): array
    {
        $event = SuKien::find($eventId);
        if (! $event) {
            throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
        }

        $this->authorizeHostOrAdmin($user, $event, 'kết xuất danh sách ĐRL');

        if ($event->trang_thai !== 'COMPLETED') {
            throw new BusinessException(
                'DRL_NOT_READY',
                'Sự kiện chưa hoàn tất để kết xuất danh sách Điểm Rèn Luyện.',
                null,
                409
            );
        }

        $records = DB::table('v_danh_sach_drl')
            ->where('ma_su_kien', $eventId)
            ->orderBy('stt')
            ->get();

        $dateStr = now()->setTimezone('+07:00')->format('Ymd');

        if (strtolower($format) === 'csv') {
            return [
                'content' => $this->exportService->generateCsv($records),
                'mime' => 'text/csv; charset=UTF-8',
                'filename' => "Danh_sach_DRL_{$eventId}_{$dateStr}.csv",
            ];
        }

        return [
            'content' => $this->exportService->generateXlsx($records, $event->ten_su_kien),
            'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'filename' => "Danh_sach_DRL_{$eventId}_{$dateStr}.xlsx",
        ];
    }

    /**
     * Kiểm tra quyền Host A hoặc Admin.
     */
    protected function authorizeHostOrAdmin(User $user, SuKien $event, string $action): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if ($user->isToChuc()) {
            $userUnitId = (int) $user->ma_don_vi_to_chuc;
            $hostUnitId = (int) $event->ma_don_vi_to_chuc;

            if ($userUnitId > 0 && $userUnitId === $hostUnitId) {
                return;
            }
        }

        throw new BusinessException(
            'FORBIDDEN',
            "Bạn không có quyền {$action} của sự kiện này.",
            null,
            403
        );
    }
}
