<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MacroBiFilterRequest;
use App\Http\Resources\MacroBiResource;
use App\Http\Resources\NoShowViolatorResource;
use App\Services\MacroBiService;
use Illuminate\Http\JsonResponse;

class MacroBiController extends Controller
{
    use ApiResponseTrait;

    public function __construct(protected MacroBiService $macroBiService) {}

    public function macro(MacroBiFilterRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $data = $this->macroBiService->getMacroDashboard(
            $filters['tu_ngay'] ?? null,
            $filters['den_ngay'] ?? null
        );

        return $this->successResponse(
            data: new MacroBiResource($data),
            message: 'Thao tác thành công',
            code: 200
        );
    }

    public function noShowViolations(MacroBiFilterRequest $request): JsonResponse
    {
        $result = $this->macroBiService->getNoShowViolations($request->validated());

        return response()->json([
            'success' => true,
            'data' => NoShowViolatorResource::collection($result['items']),
            'meta' => [
                'trang_hien_tai' => $result['current_page'],
                'tong_so_trang' => $result['last_page'],
                'tong_so_ban_ghi' => $result['total'],
                'kich_thuoc_trang' => $result['per_page'],
            ],
            'message' => 'Thao tác thành công',
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ]);
    }
}
