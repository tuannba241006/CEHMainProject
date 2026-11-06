<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SelfCheckInRequest;
use App\Http\Requests\SelfCheckOutRequest;
use App\Http\Resources\ParticipantAttendanceResource;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SelfAttendanceController extends Controller
{
    public function __construct(protected AttendanceService $service) {}

    public function selfCheckIn(SelfCheckInRequest $request): JsonResponse
    {
        return $this->response($this->service->checkIn($request->user(), $request->validated()), 'Điểm danh Check-in đầu giờ thành công');
    }

    public function selfCheckOut(SelfCheckOutRequest $request): JsonResponse
    {
        return $this->response($this->service->checkOut($request->user(), $request->validated()), 'Điểm danh Check-out thành công');
    }

    public function participants(Request $request, int $id): JsonResponse
    {
        $paginator = $this->service->participants($request->user(), $id, $request->all());

        return response()->json(['success' => true, 'data' => ParticipantAttendanceResource::collection($paginator->items())->resolve(), 'meta' => ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total()]]);
    }

    protected function response($ticket, string $message): JsonResponse
    {
        return response()->json(['success' => true, 'message' => $message, 'data' => (new ParticipantAttendanceResource($ticket))->resolve(), 'server_time' => now()->toIso8601String()]);
    }
}
