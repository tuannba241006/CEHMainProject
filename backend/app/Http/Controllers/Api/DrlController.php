<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DrlLockRequest;
use App\Http\Requests\DrlUnlockRequest;
use App\Http\Resources\DrlRecordResource;
use App\Http\Resources\EventManageDetailResource;
use App\Services\DrlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DrlController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected DrlService $drlService
    ) {}

    /**
     * GET /api/v1/events/{id}/drl
     * Lấy danh sách Điểm Rèn Luyện tổng hợp của sự kiện qua View v_danh_sach_drl (UC-DRL-01).
     */
    public function index(Request $request, int $id): JsonResponse
    {
        $page = (int) $request->query('page', 1);
        $limit = min(100, max(1, (int) $request->query('limit', 20)));

        $paginator = $this->drlService->getDrlList($request->user(), $id, $page, $limit);

        return response()->json([
            'success' => true,
            'data' => DrlRecordResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], 200);
    }

    /**
     * POST /api/v1/events/{id}/drl/lock
     * Khóa chốt danh sách Điểm Rèn Luyện của sự kiện (da_chot_drl = 1 - UC-DRL-01).
     */
    public function lock(DrlLockRequest $request, int $id): JsonResponse
    {
        $result = $this->drlService->lockDrl(
            $request->user(),
            $id,
            $request->input('ly_do')
        );

        return $this->successResponse(
            data: $result,
            message: 'Đã khóa chốt danh sách Điểm Rèn Luyện',
            code: 200
        );
    }

    /**
     * POST /api/v1/events/{id}/drl/unlock
     * Admin mở khóa điều chỉnh danh sách Điểm Rèn Luyện sau khi đã chốt (UC-DRL-01.AC.1).
     */
    public function unlock(DrlUnlockRequest $request, int $id): JsonResponse
    {
        $event = $this->drlService->unlockDrl(
            $request->user(),
            $id,
            $request->input('ly_do')
        );

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Đã mở khóa điều chỉnh danh sách ĐRL',
            code: 200
        );
    }

    /**
     * GET /api/v1/events/{id}/drl/export
     * Kết xuất & Tải file Excel (.xlsx) hoặc CSV danh sách Điểm Rèn Luyện chuẩn biểu mẫu P.CTSV (UC-DRL-01).
     */
    public function export(Request $request, int $id): Response
    {
        $format = (string) $request->query('format', 'xlsx');

        $result = $this->drlService->exportDrl(
            $request->user(),
            $id,
            $format
        );

        return response($result['content'], 200, [
            'Content-Type' => $result['mime'],
            'Content-Disposition' => 'attachment; filename="'.$result['filename'].'"',
            'Cache-Control' => 'no-cache, private',
        ]);
    }
}
