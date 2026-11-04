<?php

namespace App\Services;

use App\Models\ThongBao;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use InvalidArgumentException;

class NotificationService
{
    /**
     * Allowed notification types matching database ENUM and OpenAPI contract.
     */
    public const ALLOWED_TYPES = [
        'HE_THONG',
        'MOI_DONG_TO_CHUC',
        'PHAN_HOI_DONG_TO_CHUC',
        'DE_XUAT_SU_KIEN',
        'KET_QUA_KIEM_DUYET',
        'CAP_NHAT_SU_KIEN',
        'DOI_PHONG_KHAN_CAP',
        'HUY_SU_KIEN',
        'NHAC_HEN',
        'CLAIM_SLOT',
        'VE_MOI',
        'WAITLIST_DONG',
        'CANH_BAO_NO_SHOW',
    ];

    /**
     * Get paginated notifications and total unread count for the current user (UC-NOTIF-01).
     *
     * @param  array<string, mixed>  $filters
     * @return array{paginator: LengthAwarePaginator, so_luong_chua_doc: int}
     */
    public function listMyNotifications(User $user, array $filters = []): array
    {
        $baseQuery = ThongBao::where('ma_tai_khoan', $user->ma_tai_khoan);

        // Calculate global unread count across all pages for this user
        $unreadCount = (clone $baseQuery)->where('da_doc', false)->count();

        $query = clone $baseQuery;

        if (isset($filters['chua_doc'])) {
            $isUnread = filter_var($filters['chua_doc'], FILTER_VALIDATE_BOOLEAN);
            $query->where('da_doc', ! $isUnread);
        }

        if (! empty($filters['loai_thong_bao'])) {
            $query->where('loai_thong_bao', $filters['loai_thong_bao']);
        }

        $query->orderByDesc('thoi_gian_gui')->orderByDesc('id');

        $limit = isset($filters['limit']) ? min(max((int) $filters['limit'], 1), 100) : 10;
        $page = isset($filters['page']) ? max((int) $filters['page'], 1) : 1;

        $paginator = $query->paginate($limit, ['*'], 'page', $page);

        return [
            'paginator' => $paginator,
            'so_luong_chua_doc' => $unreadCount,
        ];
    }

    /**
     * Mark a single notification as read (UC-NOTIF-01).
     *
     * @throws ModelNotFoundException
     * @throws AuthorizationException
     */
    public function markAsRead(int $id, User $user): ThongBao
    {
        $notification = ThongBao::find($id);

        if (! $notification) {
            throw new ModelNotFoundException('Không tìm thấy thông báo.');
        }

        if ((int) $notification->ma_tai_khoan !== (int) $user->ma_tai_khoan) {
            throw new AuthorizationException('Bạn không có quyền thao tác trên thông báo này.');
        }

        if (! $notification->da_doc) {
            $notification->da_doc = true;
            $notification->save();
        }

        return $notification;
    }

    /**
     * Mark all unread notifications of the current user as read (UC-NOTIF-01).
     */
    public function markAllAsRead(User $user): int
    {
        return ThongBao::where('ma_tai_khoan', $user->ma_tai_khoan)
            ->where('da_doc', false)
            ->update(['da_doc' => true]);
    }

    /**
     * Send an in-app notification to a user.
     *
     * @throws InvalidArgumentException
     */
    public function sendNotification(
        int $userId,
        string $title,
        string $content,
        string $type,
        ?string $link = null
    ): ThongBao {
        if (! in_array($type, self::ALLOWED_TYPES, true)) {
            throw new InvalidArgumentException("Loại thông báo '{$type}' không hợp lệ.");
        }

        return ThongBao::create([
            'ma_tai_khoan' => $userId,
            'tieu_de' => mb_substr($title, 0, 200),
            'noi_dung' => $content,
            'loai_thong_bao' => $type,
            'lien_ket' => $link !== null ? mb_substr($link, 0, 255) : null,
            'da_doc' => false,
            'thoi_gian_gui' => now(),
        ]);
    }
}
