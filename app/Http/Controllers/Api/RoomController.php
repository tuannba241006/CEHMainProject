<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Services\RoomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function __construct(
        protected RoomService $roomService
    ) {}

    /**
     * GET /api/rooms
     * Danh sách phòng hội trường (phân trang 15, hỗ trợ lọc).
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['co_so', 'suc_chua_min', 'trang_thai']);
        $paginator = $this->roomService->getRooms($filters, 15);

        return response()->json([
            'success' => true,
            'data' => RoomResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'message' => 'Lấy danh sách phòng thành công.',
        ]);
    }

    /**
     * POST /api/rooms
     * Tạo mới phòng hội trường.
     */
    public function store(StoreRoomRequest $request): JsonResponse
    {
        $room = $this->roomService->createRoom($request->validated());

        return response()->json([
            'success' => true,
            'data' => new RoomResource($room),
            'message' => 'Tạo phòng hội trường thành công.',
        ], 201);
    }

    /**
     * GET /api/rooms/{id}
     * Chi tiết một phòng hội trường.
     */
    public function show(int $id): JsonResponse
    {
        $room = $this->roomService->getRoom($id);

        return response()->json([
            'success' => true,
            'data' => new RoomResource($room),
            'message' => 'Lấy thông tin phòng thành công.',
        ]);
    }

    /**
     * PUT /api/rooms/{id}
     * Cập nhật thông tin phòng (bao gồm bảo trì).
     */
    public function update(UpdateRoomRequest $request, int $id): JsonResponse
    {
        $result = $this->roomService->updateRoom($id, $request->validated());

        if (! $result['success']) {
            if ($result['error_code'] === 'ROOM_MAINTENANCE_CONFLICT') {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'ROOM_MAINTENANCE_CONFLICT',
                        'details' => [
                            'affected_events' => $result['affected_events'],
                        ],
                    ],
                    'message' => 'Không thể chuyển sang bảo trì: có sự kiện đã duyệt trùng khung giờ bảo trì.',
                ], 409);
            }
        }

        return response()->json([
            'success' => true,
            'data' => new RoomResource($result['room']),
            'message' => 'Cập nhật phòng thành công.',
        ]);
    }

    /**
     * DELETE /api/rooms/{id}
     * Xóa phòng (soft delete da_xoa = 1).
     */
    public function destroy(int $id): JsonResponse
    {
        $result = $this->roomService->deleteRoom($id);

        if (! $result['success']) {
            if ($result['error_code'] === 'ROOM_HAS_BOOKING_HISTORY') {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'ROOM_HAS_BOOKING_HISTORY',
                        'details' => [
                            'total_bookings' => $result['total_bookings'],
                        ],
                    ],
                    'message' => 'Không thể xóa phòng đã có lịch sử đặt. Hãy chuyển sang trạng thái bảo trì nếu cần.',
                ], 409);
            }
        }

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa phòng thành công.',
        ]);
    }
}
