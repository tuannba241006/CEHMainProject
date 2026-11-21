<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FeedbackGraceRequest;
use App\Http\Requests\SubmitFeedbackRequest;
use App\Http\Resources\ParticipantAttendanceResource;
use App\Http\Resources\TicketResource;
use App\Services\FeedbackService;
use Illuminate\Http\JsonResponse;

class FeedbackController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected FeedbackService $feedbackService
    ) {}

    /**
     * Submit event feedback within 48h or grace period (UC-FEED-01, FR-24).
     * POST /api/v1/events/{id}/feedback
     */
    public function submitFeedback(int $id, SubmitFeedbackRequest $request): JsonResponse
    {
        $ticket = $this->feedbackService->submitFeedback(
            eventId: $id,
            userId: (int) $request->user()->ma_tai_khoan,
            data: $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cảm ơn bạn đã gửi đánh giá! Bạn đã đủ điều kiện nhận ĐRL và tải Giấy chứng nhận.',
            'data' => new TicketResource($ticket),
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], 201);
    }

    /**
     * Admin grants 24h feedback grace period for a ticket (UC-FEED-01.AC.1).
     * POST /api/v1/admin/tickets/{id}/feedback-grace
     */
    public function grantGrace(int $id, FeedbackGraceRequest $request): JsonResponse
    {
        $ticket = $this->feedbackService->grantGrace(
            ticketId: $id,
            reason: $request->input('ly_do'),
            adminId: (int) $request->user()->ma_tai_khoan
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã mở ân hạn Feedback 24 giờ cho sinh viên',
            'data' => new ParticipantAttendanceResource($ticket),
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], 200);
    }
}
