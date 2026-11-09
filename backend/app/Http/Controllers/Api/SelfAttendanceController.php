<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SelfCheckInRequest;
use App\Http\Requests\SelfCheckOutRequest;
use App\Http\Resources\ParticipantAttendanceResource;
use App\Http\Resources\SelfCheckOutResource;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SelfAttendanceController extends Controller
{
    public function __construct(protected AttendanceService $service) {}

    public function selfCheckIn(SelfCheckInRequest $request): JsonResponse
    {
        $ticket = $this->service->checkIn($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Điểm danh Check-in đầu giờ thành công',
            'data' => [
                'ma_dang_ky' => $ticket->getKey(),
                'trang_thai' => $ticket->trang_thai,
                'thoi_gian_check_in' => $ticket->thoi_gian_check_in->setTimezone('+07:00')->toIso8601String(),
            ],
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ]);
    }

    public function selfCheckOut(SelfCheckOutRequest $request): JsonResponse
    {
        $ticket = $this->service->checkOut($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Điểm danh Check-out thành công',
            'data' => (new SelfCheckOutResource($ticket))->resolve($request),
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ]);
    }

    public function participants(Request $request, int $id): JsonResponse
    {
        $paginator = $this->service->participants($request->user(), $id, $request->all());

        return response()->json(['success' => true, 'data' => ParticipantAttendanceResource::collection($paginator->items())->resolve(), 'meta' => ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total()]]);
    }
}
