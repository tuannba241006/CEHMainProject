<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Http\Resources\WaitlistResource;
use App\Services\WaitlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WaitlistController extends Controller
{
    public function __construct(protected WaitlistService $waitlistService) {}

    public function join(int $id, Request $request): JsonResponse
    {
        $entry = $this->waitlistService->joinWaitlist($id, $request->user());
        $entry->load(['suKien.phongHoiTruong']);

        return $this->successResponse(
            (new WaitlistResource($entry))->resolve($request),
            'Đã xếp vào hàng đợi danh sách chờ',
            201
        );
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tab' => ['sometimes', 'string', 'in:active,history'],
            'trang_thai' => ['sometimes', 'string', 'in:WAITING,OFFERED,ACCEPTED,DECLINED,EXPIRED,SKIPPED_CONFLICT,CLOSED_WAITLIST,CANCELLED'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = $this->waitlistService->listMyEntries($request->user(), $validated);
        $response = $this->successResponse(null, 'Lấy danh sách hàng đợi thành công');
        $payload = $response->getData(true);
        $payload['data'] = $paginator->getCollection()
            ->map(fn ($entry) => (new WaitlistResource($entry))->resolve($request))
            ->values();
        $payload['meta'] = [
            'trang_hien_tai' => $paginator->currentPage(),
            'tong_so_trang' => $paginator->lastPage(),
            'tong_so_ban_ghi' => $paginator->total(),
            'kich_thuoc_trang' => $paginator->perPage(),
        ];

        return response()->json($payload);
    }

    public function claim(int $id, Request $request): JsonResponse
    {
        $result = $this->waitlistService->claimOffer($id, $request->user());
        if ($result['error'] !== null) {
            $error = $result['error'];

            return $this->errorResponse($error['code'], $error['message'], $error['details'] ?? null, 409);
        }

        return $this->successResponse(
            new TicketResource($result['ticket']),
            'Nhận vé chuyển tiếp thành công'
        );
    }

    public function decline(int $id, Request $request): JsonResponse
    {
        $entry = $this->waitlistService->declineOffer($id, $request->user());

        return $this->successResponse(
            (new WaitlistResource($entry))->resolve($request),
            'Đã từ chối nhận suất chờ'
        );
    }
}
