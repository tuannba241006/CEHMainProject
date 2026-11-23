<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Models\DangKy;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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
        $userId = (int) $request->user()->ma_tai_khoan;
        $idempotencyKey = trim((string) $request->header('Idempotency-Key', ''));

        if (strlen($idempotencyKey) > 255) {
            throw new BusinessException(
                'VALIDATION_FAILED',
                'Header Idempotency-Key vượt quá độ dài tối đa 255 ký tự.',
                ['Idempotency-Key' => ['Idempotency-Key tối đa 255 ký tự.']],
                422
            );
        }

        if ($idempotencyKey === '') {
            $ticket = $this->bookingService->bookTicket($userId, $id);

            return $this->successResponse(
                data: new TicketResource($ticket),
                message: 'Đăng ký vé tham dự thành công',
                code: 201
            );
        }

        $cacheKey = "booking:idempotency:{$userId}:".hash('sha256', $idempotencyKey);
        $lock = Cache::lock("{$cacheKey}:lock", 10);
        if (! $lock->get()) {
            throw new BusinessException(
                'IDEMPOTENCY_CONFLICT',
                'Yêu cầu với Idempotency-Key này đang được xử lý, vui lòng thử lại.',
                null,
                409
            );
        }

        try {
            $cached = Cache::get($cacheKey);
            if (is_array($cached)) {
                if ((int) ($cached['ma_su_kien'] ?? 0) !== $id) {
                    throw new BusinessException(
                        'IDEMPOTENCY_CONFLICT',
                        'Idempotency-Key đã được sử dụng cho một sự kiện khác.',
                        null,
                        409
                    );
                }

                $existingTicket = DangKy::with(['suKien.phongHoiTruong', 'chungNhan'])
                    ->find($cached['ma_dang_ky'] ?? 0);

                if ($existingTicket && $existingTicket->trang_thai !== 'DaHuy') {
                    return $this->successResponse(
                        data: new TicketResource($existingTicket),
                        message: 'Đăng ký vé tham dự thành công',
                        code: 201
                    );
                }
            }

            $ticket = $this->bookingService->bookTicket($userId, $id);

            Cache::put(
                $cacheKey,
                ['ma_su_kien' => $id, 'ma_dang_ky' => (int) $ticket->ma_dang_ky],
                now()->addMinutes(5)
            );

            return $this->successResponse(
                data: new TicketResource($ticket),
                message: 'Đăng ký vé tham dự thành công',
                code: 201
            );
        } finally {
            $lock->release();
        }
    }

    /**
     * GET /api/v1/events/{id}/booking-check
     *
     * Kiểm tra trước điều kiện đặt vé & Cảnh báo trùng lịch cá nhân (UC-BOOK-01 Bước 2).
     */
    public function precheck(Request $request, int $id): JsonResponse
    {
        $result = $this->bookingService->precheckBooking($request->user(), $id);

        return $this->successResponse($result);
    }
}
