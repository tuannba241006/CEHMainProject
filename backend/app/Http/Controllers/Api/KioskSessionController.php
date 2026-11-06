<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartKioskRequest;
use App\Http\Resources\EventManageDetailResource;
use App\Http\Resources\KioskSessionResource;
use App\Models\SuKien;
use App\Services\KioskSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KioskSessionController extends Controller
{
    public function __construct(protected KioskSessionService $service) {}

    public function startKiosk(StartKioskRequest $request, int $id): JsonResponse
    {
        $session = $this->service->start(SuKien::findOrFail($id), $request->user(), $request);

        return response()->json(['success' => true, 'message' => 'Khởi tạo phiên trình chiếu Kiosk thành công', 'data' => (new KioskSessionResource($session))->resolve(), 'server_time' => now()->toIso8601String()]);
    }

    public function totpStream(Request $request): JsonResponse
    {
        $data = $this->service->totp($this->service->resolveToken($request->header('X-Kiosk-Token')));

        return response()->json(['success' => true, 'message' => 'Thao tác thành công', 'data' => $data, 'server_time' => now()->toIso8601String()]);
    }

    public function openCheckIn(Request $request, int $id): JsonResponse
    {
        $event = $this->service->openCheckIn(SuKien::findOrFail($id), $request->user());

        return $this->eventResponse($event, 'Đã mở cổng Check-in hội trường');
    }

    public function openCheckOut(Request $request, int $id): JsonResponse
    {
        $event = $this->service->openCheckOut(SuKien::findOrFail($id), $request->user(), $request->input('ma_xac_nhan'), $request->input('ly_do_mo_som'));

        return $this->eventResponse($event, 'Đã mở cổng Check-out hội trường');
    }

    public function closeGates(Request $request, int $id): JsonResponse
    {
        $event = $this->service->closeGates(SuKien::findOrFail($id), $request->user());

        return $this->eventResponse($event, 'Đã đóng cổng điểm danh và thu hồi phiên Kiosk');
    }

    protected function eventResponse(SuKien $event, string $message): JsonResponse
    {
        return response()->json(['success' => true, 'message' => $message, 'data' => (new EventManageDetailResource($event))->resolve(), 'server_time' => now()->toIso8601String()]);
    }
}
