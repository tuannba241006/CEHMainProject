<?php

namespace App\Services;

use App\Models\DangKy;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class TicketService
{
    /**
     * Get paginated tickets for the logged-in student (UC-TCK-01).
     *
     * @param  array<string, mixed>  $filters
     */
    public function getMyTickets(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = DangKy::with(['suKien.phongHoiTruong', 'chungNhan'])
            ->where('ma_tai_khoan', $user->ma_tai_khoan);

        $tab = $filters['tab'] ?? 'upcoming';

        if ($tab === 'upcoming') {
            // tab = upcoming: Vé `DaDangKy`, `DaCheckIn`, `DaCheckOut` của các sự kiện chưa `COMPLETED`.
            $query->whereIn('trang_thai', ['DaDangKy', 'DaCheckIn', 'DaCheckOut'])
                ->whereHas('suKien', function ($q) {
                    $q->where('trang_thai', '!=', 'COMPLETED');
                });
        } elseif ($tab === 'history') {
            // tab = history: Vé của sự kiện đã `COMPLETED` và toàn bộ các vé đã hủy (`DaHuy`).
            $query->where(function ($q) {
                $q->where('trang_thai', 'DaHuy')
                    ->orWhereHas('suKien', function ($sub) {
                        $sub->where('trang_thai', 'COMPLETED');
                    });
            });
        }

        if (! empty($filters['trang_thai'])) {
            $query->where('trang_thai', $filters['trang_thai']);
        }

        if (isset($filters['vi_pham_no_show'])) {
            $query->where('vi_pham_no_show', filter_var($filters['vi_pham_no_show'], FILTER_VALIDATE_BOOLEAN));
        }

        $query->orderByDesc('thoi_gian_dang_ky');

        $limit = isset($filters['limit']) ? min(max((int) $filters['limit'], 1), 100) : 10;
        $page = isset($filters['page']) ? max((int) $filters['page'], 1) : 1;

        return $query->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Get ticket detail by ma_dang_ky, enforcing ownership or Admin role (UC-TCK-01).
     *
     * @throws ModelNotFoundException
     * @throws AuthorizationException
     */
    public function getTicketDetail(int $ticketId, User $user): DangKy
    {
        $ticket = DangKy::with(['suKien.phongHoiTruong', 'chungNhan'])
            ->find($ticketId);

        if (! $ticket) {
            throw new ModelNotFoundException('Không tìm thấy vé tham dự.');
        }

        $isAdmin = $user->isAdmin();
        if (! $isAdmin && (int) $ticket->ma_tai_khoan !== (int) $user->ma_tai_khoan) {
            throw new AuthorizationException('Bạn không có quyền truy cập vé này.');
        }

        return $ticket;
    }
}
