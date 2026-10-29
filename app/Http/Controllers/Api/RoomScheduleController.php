<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckRoomAvailabilityRequest;
use App\Http\Requests\RoomScheduleRequest;
use App\Http\Resources\RoomAvailabilityResource;
use App\Http\Resources\RoomScheduleResource;
use App\Services\RoomScheduleService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class RoomScheduleController extends Controller
{
    public function __construct(
        protected RoomScheduleService $roomScheduleService
    ) {}

    /**
     * GET /api/rooms/{id}/schedule
     * Tra cứu lịch phòng trong khoảng [tu_ngay, den_ngay] (tối đa 31 ngày).
     */
    public function schedule(RoomScheduleRequest $request, int $id): JsonResponse
    {
        $tuNgay = $request->input('tu_ngay');
        $denNgay = $request->input('den_ngay');

        $result = $this->roomScheduleService->getSchedule($id, $tuNgay, $denNgay);

        if (! $result['success']) {
            if ($result['error_code'] === 'DATE_RANGE_TOO_LARGE') {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'DATE_RANGE_TOO_LARGE',
                        'details' => [
                            'max_days' => 31,
                            'tu_ngay' => $tuNgay,
                            'den_ngay' => $denNgay,
                        ],
                    ],
                    'message' => $result['message'],
                ], 422);
            }
        }

        return response()->json([
            'success' => true,
            'data' => (new RoomScheduleResource($result['data']))->resolve(),
            'message' => $result['message'],
        ]);
    }

    /**
     * POST /api/rooms/{id}/availability
     * Kiểm tra khả dụng phòng với đệm thời gian 15 phút và kiểm tra bảo trì.
     */
    public function availability(CheckRoomAvailabilityRequest $request, int $id): JsonResponse
    {
        $start = Carbon::parse($request->input('thoi_gian_bat_dau'));
        $end = Carbon::parse($request->input('thoi_gian_ket_thuc'));
        $excludeEventId = $request->filled('exclude_event_id') ? (int) $request->input('exclude_event_id') : null;
        $user = $request->user();

        $result = $this->roomScheduleService->checkAvailability($id, $start, $end, $excludeEventId, $user);

        if (! $result['success']) {
            if ($result['error_code'] === 'EXCLUDE_EVENT_FORBIDDEN') {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'EXCLUDE_EVENT_FORBIDDEN',
                        'details' => [
                            'exclude_event_id' => $excludeEventId,
                        ],
                    ],
                    'message' => $result['message'],
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => (new RoomAvailabilityResource($result['data']))->resolve(),
            'message' => $result['message'],
        ]);
    }
}
