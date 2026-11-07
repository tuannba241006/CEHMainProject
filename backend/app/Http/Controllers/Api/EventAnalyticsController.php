<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventAnalyticsResource;
use App\Services\EventAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventAnalyticsController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected EventAnalyticsService $analyticsService
    ) {}

    /**
     * GET /api/v1/organizer/events/{id}/analytics
     * Dashboard phân tích chỉ số hiệu quả sự kiện dành cho Ban tổ chức (UC-REP-01).
     */
    public function showAnalytics(Request $request, int $id): JsonResponse
    {
        $data = $this->analyticsService->getOrganizerAnalytics($request->user(), $id);

        return $this->successResponse(
            data: new EventAnalyticsResource($data),
            message: 'Thao tác thành công',
            code: 200
        );
    }
}
