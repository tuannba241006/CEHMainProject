<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RespondCoHostRequest;
use App\Http\Requests\WithdrawProposalRequest;
use App\Http\Resources\CohostInvitationResource;
use App\Http\Resources\EventManageDetailResource;
use App\Services\EventProposalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventCoHostController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected EventProposalService $eventProposalService
    ) {}

    /**
     * POST /api/events/{id}/submit-approval
     * Gửi đề xuất phê duyệt sự kiện (Soft Hold 48h & Host-driven Routing - UC-EVT-02).
     */
    public function submitApproval(Request $request, int $id): JsonResponse
    {
        $event = $this->eventProposalService->submitApproval($request->user(), $id);

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Đã gửi đề xuất phê duyệt sự kiện'
        );
    }

    /**
     * GET /api/organizer/cohost-invitations
     * Danh sách lời mời Đồng tổ chức gửi đến đơn vị hiện tại (UC-EVT-02.AC.1).
     */
    public function listInvitations(Request $request): JsonResponse
    {
        $paginator = $this->eventProposalService->listInvitations(
            $request->user(),
            $request->only(['trang_thai_xac_nhan', 'limit', 'page', 'ma_don_vi_to_chuc'])
        );

        return response()->json([
            'success' => true,
            'data' => CohostInvitationResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ]);
    }

    /**
     * POST /api/events/{id}/co-host-respond
     * Đơn vị đồng tổ chức xác nhận Đồng ý hoặc Từ chối lời mời (UC-EVT-02.AC.1 & AC.2).
     */
    public function respondInvitation(RespondCoHostRequest $request, int $id): JsonResponse
    {
        $action = $request->input('trang_thai_xac_nhan');
        $ghiChu = $request->input('ghi_chu_tu_choi');

        $event = $this->eventProposalService->respondInvitation($request->user(), $id, $action, $ghiChu);

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Đã ghi nhận phản hồi đồng tổ chức'
        );
    }

    /**
     * POST /api/events/{id}/withdraw
     * Đơn vị chủ trì (Host A) chủ động rút đề xuất sự kiện về DRAFT (UC-EVT-02.AC.3).
     */
    public function withdrawProposal(WithdrawProposalRequest $request, int $id): JsonResponse
    {
        $lyDo = $request->input('ly_do_rut');

        $event = $this->eventProposalService->withdrawProposal($request->user(), $id, $lyDo);

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Đã rút đề xuất sự kiện về trạng thái Bản nháp'
        );
    }
}
