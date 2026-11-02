<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewEventRequest;
use App\Http\Resources\EventManageDetailResource;
use App\Http\Resources\ReviewQueueResource;
use App\Services\EventApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventReviewController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected EventApprovalService $eventApprovalService
    ) {}

    /**
     * GET /api/v1/events/review-queue
     *
     * Hàng đợi sự kiện chờ phê duyệt dành cho Cấp Khoa & P.CTSV (UC-EVT-03 Bước 1-2).
     */
    public function reviewQueue(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'trang_thai' => ['sometimes', 'in:PENDING_FACULTY,PENDING_ADMIN'],
            'ma_don_vi_to_chuc' => ['sometimes', 'integer', 'min:1'],
        ]);

        $paginator = $this->eventApprovalService->getReviewQueue(
            $request->user(),
            $filters
        );

        return response()->json([
            'success' => true,
            'data' => ReviewQueueResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 200);
    }

    /**
     * POST /api/v1/events/{id}/review
     *
     * Thẩm định phê duyệt sự kiện Đa cấp (Khoa duyệt, P.CTSV duyệt, Admin duyệt thay, từ chối, yêu cầu chỉnh sửa).
     */
    public function review(ReviewEventRequest $request, int $id): JsonResponse
    {
        $event = $this->eventApprovalService->review(
            $request->user(),
            $id,
            $request->validated()
        );

        $action = $request->input('hanh_dong');
        $message = match ($action) {
            'APPROVE_FACULTY' => 'Khoa đã duyệt sự kiện. Sự kiện đang chờ P.CTSV duyệt cuối.',
            'APPROVE_ADMIN' => 'P.CTSV đã phê duyệt sự kiện và xác nhận đặt phòng.',
            'APPROVE_FACULTY_BY_ADMIN' => 'Admin P.CTSV đã duyệt thay cấp Khoa thành công.',
            'REJECT_FACULTY' => 'Khoa đã từ chối đề xuất sự kiện.',
            'REJECT_ADMIN' => 'P.CTSV đã từ chối đề xuất sự kiện.',
            'REQUEST_EDIT' => 'Đã gửi yêu cầu chỉnh sửa nội dung sự kiện về Bản nháp (DRAFT).',
            default => 'Đã xử lý thẩm định sự kiện thành công.',
        };

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: $message
        );
    }

    /**
     * POST /api/v1/events/{id}/reopen
     *
     * Tái mở sự kiện bị từ chối (REJECTED / COHOST_REJECTED) quay về DRAFT để chỉnh sửa.
     */
    public function reopen(Request $request, int $id): JsonResponse
    {
        $event = $this->eventApprovalService->reopen(
            $request->user(),
            $id
        );

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Đã chuyển sự kiện về trạng thái Bản nháp (DRAFT)'
        );
    }
}
