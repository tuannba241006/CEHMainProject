<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * List user notifications with unread count and pagination (UC-NOTIF-01).
     * GET /api/v1/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['page', 'limit', 'chua_doc', 'loai_thong_bao']);
        $result = $this->notificationService->listMyNotifications($request->user(), $filters);
        $paginator = $result['paginator'];

        return response()->json([
            'success' => true,
            'data' => NotificationResource::collection($paginator->items()),
            'meta' => [
                'trang_hien_tai' => $paginator->currentPage(),
                'tong_so_trang' => $paginator->lastPage(),
                'tong_so_ban_ghi' => $paginator->total(),
                'kich_thuoc_trang' => $paginator->perPage(),
                'so_luong_chua_doc' => $result['so_luong_chua_doc'],
            ],
        ]);
    }

    /**
     * Mark a single notification as read (UC-NOTIF-01).
     * PUT /api/v1/notifications/{id}/read
     */
    public function markAsRead(int $id, Request $request): JsonResponse
    {
        $notification = $this->notificationService->markAsRead($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu đọc thông báo',
            'data' => new NotificationResource($notification),
        ]);
    }

    /**
     * Mark all notifications of the current user as read (UC-NOTIF-01).
     * PUT /api/v1/notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllAsRead($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu đọc tất cả thông báo',
            'data' => [
                'so_luong_cap_nhat' => $count,
            ],
        ]);
    }
}
