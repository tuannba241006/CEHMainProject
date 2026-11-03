<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected BookingService $bookingService
    ) {}

    /**
     * POST /api/v1/events/{id}/book
     *
     * Đăng ký vé Concurrency (Khóa dòng tai_khoan -> su_kien & Chống trùng lịch - UC-BOOK-01, FR-14).
     */
    public function bookTicket(Request $request, int $id): JsonResponse
    {
        $ticket = $this->bookingService->bookTicket(
            (int) $request->user()->ma_tai_khoan,
            $id
        );

        return $this->successResponse(
            data: new TicketResource($ticket),
            message: 'Đăng ký vé tham dự thành công',
            code: 201
        );
    }
}
