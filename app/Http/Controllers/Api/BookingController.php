<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Models\DangKy;
use App\Models\SuKien;
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

    /**
     * GET /api/v1/events/{id}/booking-check
     *
     * Kiểm tra điều kiện đặt vé của user cho sự kiện (UC-BOOK-01).
     */
    public function precheck(Request $request, int $id): JsonResponse
    {
        $user  = $request->user();
        $event = SuKien::findOrFail($id);

        // Đã đặt vé chưa?
        $existingBooking = DangKy::where('ma_su_kien', $id)
            ->where('ma_tai_khoan', $user->ma_tai_khoan)
            ->whereNotIn('trang_thai', ['DaHuy'])
            ->first();

        if ($existingBooking) {
            return $this->successResponse(['du_dieu_kien' => false, 'ly_do' => 'Bạn đã đặt vé cho sự kiện này.']);
        }

        // Còn slot không?
        if (! $event->khong_gioi_han_slot) {
            $bookedCount = DangKy::where('ma_su_kien', $id)
                ->whereNotIn('trang_thai', ['DaHuy'])
                ->count();

            if ($bookedCount >= $event->so_luong_toi_da) {
                return $this->successResponse(['du_dieu_kien' => false, 'ly_do' => 'Sự kiện đã hết chỗ.']);
            }
        }

        return $this->successResponse(['du_dieu_kien' => true]);
    }
}
