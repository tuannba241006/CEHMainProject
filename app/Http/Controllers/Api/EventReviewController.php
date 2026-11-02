<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewEventRequest;
use App\Http\Resources\EventManageDetailResource;
use App\Services\EventApprovalService;
use Illuminate\Http\JsonResponse;

class EventReviewController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected EventApprovalService $eventApprovalService
    ) {}

    /**
     * POST /api/events/{id}/approve-faculty
     *
     * Host B duyệt sự kiện cấp Khoa:
     * PENDING_FACULTY -> PENDING_ADMIN.
     */
    public function approveFaculty(int $id): JsonResponse
    {
        $event = $this->eventApprovalService->approveFaculty(
            request()->user(),
            $id
        );

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Khoa đã duyệt sự kiện. Sự kiện đang chờ P.CTSV duyệt cuối.'
        );
    }

    /**
     * POST /api/events/{id}/admin-override
     *
     * Admin duyệt thay Host B:
     * PENDING_FACULTY -> PENDING_ADMIN.
     */
    public function adminOverride(ReviewEventRequest $request, int $id): JsonResponse
    {
        $event = $this->eventApprovalService->adminOverride(
            $request->user(),
            $id,
            $request->validated()
        );

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Admin đã duyệt thay cấp Khoa. Sự kiện đang chờ P.CTSV duyệt cuối.'
        );
    }

    /**
     * POST /api/events/{id}/approve-admin
     *
     * Admin P.CTSV duyệt cuối:
     * PENDING_ADMIN -> APPROVED.
     */
    public function approveAdmin(int $id): JsonResponse
    {
        $event = $this->eventApprovalService->approveAdmin(
            request()->user(),
            $id
        );

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'P.CTSV đã phê duyệt sự kiện.'
        );
    }

    /**
     * POST /api/events/{id}/reject-faculty
     *
     * Host B từ chối:
     * PENDING_FACULTY -> REJECTED_FACULTY.
     */
    public function rejectFaculty(ReviewEventRequest $request, int $id): JsonResponse
    {
        $event = $this->eventApprovalService->rejectFaculty(
            $request->user(),
            $id,
            $request->validated()
        );

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Khoa đã từ chối đề xuất sự kiện.'
        );
    }

    /**
     * POST /api/events/{id}/reject-admin
     *
     * Admin P.CTSV từ chối:
     * PENDING_ADMIN -> REJECTED_ADMIN.
     */
    public function rejectAdmin(ReviewEventRequest $request, int $id): JsonResponse
    {
        $event = $this->eventApprovalService->rejectAdmin(
            $request->user(),
            $id,
            $request->validated()
        );

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'P.CTSV đã từ chối đề xuất sự kiện.'
        );
    }
}