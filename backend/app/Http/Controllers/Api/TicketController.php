<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function __construct(
        protected TicketService $ticketService
    ) {}

    /**
     * Get paginated tickets for the logged in student (UC-TCK-01).
     * GET /api/v1/tickets/my-tickets
     */
    public function myTickets(Request $request): JsonResponse
    {
        $filters = $request->only(['page', 'limit', 'tab', 'trang_thai', 'vi_pham_no_show']);
        $paginator = $this->ticketService->getMyTickets($request->user(), $filters);

        return response()->json([
            'success' => true,
            'data' => TicketResource::collection($paginator->items()),
            'meta' => [
                'trang_hien_tai' => $paginator->currentPage(),
                'tong_so_trang' => $paginator->lastPage(),
                'tong_so_ban_ghi' => $paginator->total(),
                'kich_thuoc_trang' => $paginator->perPage(),
            ],
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ]);
    }

    /**
     * Get ticket detail by ma_dang_ky (UC-TCK-01).
     * GET /api/v1/tickets/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $ticket = $this->ticketService->getTicketDetail($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Thao tác thành công',
            'data' => new TicketResource($ticket),
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ]);
    }
}
