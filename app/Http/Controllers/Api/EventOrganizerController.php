<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventDraftRequest;
use App\Http\Requests\UpdateEventDraftRequest;
use App\Http\Resources\EventCardResource;
use App\Http\Resources\EventManageDetailResource;
use App\Services\EventDraftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventOrganizerController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected EventDraftService $eventDraftService
    ) {}

    /**
     * GET /api/organizer/events
     * Danh sách sự kiện thuộc đơn vị tổ chức quản lý (Đầy đủ 11 trạng thái).
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->eventDraftService->listOrganizerEvents(
            $request->user(),
            $request->only(['q', 'trang_thai', 'vai_tro_don_vi', 'limit', 'page', 'ma_don_vi_to_chuc'])
        );

        return response()->json([
            'success' => true,
            'data' => EventCardResource::collection($paginator->items()),
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
     * GET /api/organizer/events/{id}
     * Xem chi tiết quản trị của sự kiện (Bao gồm bản nháp, Co-host & Audit Log).
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $event = $this->eventDraftService->getOrganizerEventDetail($request->user(), $id);

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Thao tác thành công'
        );
    }

    /**
     * POST /api/events
     * Soạn thảo sự kiện mới ở trạng thái Bản nháp (DRAFT - UC-EVT-01).
     */
    public function store(StoreEventDraftRequest $request): JsonResponse
    {
        $event = $this->eventDraftService->createDraft($request->user(), $request->validated());

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Lưu bản nháp sự kiện thành công',
            code: 201
        );
    }

    /**
     * PUT /api/events/{id}
     * Cập nhật nội dung bản nháp sự kiện (Chỉ khi trang_thai = DRAFT).
     */
    public function update(UpdateEventDraftRequest $request, int $id): JsonResponse
    {
        $event = $this->eventDraftService->updateDraft($request->user(), $id, $request->validated());

        return $this->successResponse(
            data: new EventManageDetailResource($event),
            message: 'Cập nhật bản nháp sự kiện thành công'
        );
    }
}
