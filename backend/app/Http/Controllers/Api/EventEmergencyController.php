<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangeRoomRequest;
use App\Http\Requests\EmergencyCancelRequest;
use App\Http\Resources\EventManageDetailResource;
use App\Services\EventEmergencyService;
use Illuminate\Http\JsonResponse;

class EventEmergencyController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected EventEmergencyService $eventEmergencyService
    ) {}

    /**
     * POST /api/v1/events/{id}/emergency-cancel
     *
     * Hủy sự kiện khẩn cấp khi đang APPROVED hoặc PUBLISHED (UC-EVT-03.AC.5).
     */
    public function emergencyCancel(EmergencyCancelRequest $request, int $id): JsonResponse
    {
        $event = $this->eventEmergencyService->emergencyCancel(
            $request->user(),
            $id,
            $request->input('ly_do_huy')
        );

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Đã hủy sự kiện khẩn cấp và kích hoạt gửi thông báo cho sinh viên'
        );
    }

    /**
     * POST /api/v1/events/{id}/change-room
     *
     * Admin điều chuyển phòng khẩn cấp sau khi APPROVED hoặc PUBLISHED (UC-EVT-03.AC.4).
     */
    public function changeRoom(ChangeRoomRequest $request, int $id): JsonResponse
    {
        $event = $this->eventEmergencyService->changeRoom(
            $request->user(),
            $id,
            (int) $request->input('ma_phong_moi'),
            $request->input('ly_do')
        );

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Đã điều chuyển phòng hội trường và gửi thông báo khẩn cấp'
        );
    }
}
