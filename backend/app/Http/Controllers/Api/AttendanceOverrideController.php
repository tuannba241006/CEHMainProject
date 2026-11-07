<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ManualOverrideRequest;
use App\Http\Resources\ManualOverrideResource;
use App\Services\AttendanceOverrideService;
use Illuminate\Http\JsonResponse;

class AttendanceOverrideController extends Controller
{
    public function __construct(protected AttendanceOverrideService $service) {}

    public function manualOverride(ManualOverrideRequest $request): JsonResponse
    {
        $ticket = $this->service->manualOverride($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Đã điều chỉnh trạng thái điểm danh thủ công',
            'data' => (new ManualOverrideResource($ticket))->resolve($request),
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ]);
    }
}
