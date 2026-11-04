<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelTicketRequest;
use App\Http\Resources\TicketResource;
use App\Services\TicketCancellationService;
use Illuminate\Http\JsonResponse;

class TicketCancelController extends Controller
{
    public function __construct(
        protected TicketCancellationService $cancellationService
    ) {}

    /**
     * Cancel a personal ticket before T-4h deadline (UC-TCK-02).
     * POST /api/v1/tickets/{id}/cancel
     */
    public function cancel(int $id, CancelTicketRequest $request): JsonResponse
    {
        $idempotencyKey = $request->header('Idempotency-Key');

        $result = $this->cancellationService->cancelTicket(
            $id,
            $request->user(),
            $request->validated('ly_do_huy'),
            $idempotencyKey
        );

        return response()->json([
            'success' => true,
            'message' => 'Hủy vé tham dự thành công',
            'data' => new TicketResource($result['ticket']),
        ]);
    }
}
