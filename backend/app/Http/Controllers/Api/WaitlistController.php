<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Http\Resources\WaitlistResource;
use App\Models\HangDoiWaitlist;
use App\Services\WaitlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WaitlistController extends Controller
{
    public function __construct(protected WaitlistService $waitlistService) {}

    public function join(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = (int) $user->ma_tai_khoan;
        $idempotencyKey = trim((string) $request->header('Idempotency-Key', ''));
        if (strlen($idempotencyKey) > 255) {
            throw new BusinessException(
                'VALIDATION_FAILED',
                'Header Idempotency-Key vượt quá độ dài tối đa 255 ký tự.',
                ['Idempotency-Key' => ['Idempotency-Key tối đa 255 ký tự.']],
                422
            );
        }
        $cacheKey = $idempotencyKey !== ''
            ? 'waitlist:join:idempotency:'.$userId.':'.hash('sha256', $idempotencyKey)
            : null;

        $resolveEntry = function () use ($id, $user, $request, $cacheKey): JsonResponse {
            if ($cacheKey !== null) {
                $cached = Cache::get($cacheKey);
                if (is_array($cached)) {
                    if ((int) ($cached['ma_su_kien'] ?? 0) !== $id) {
                        throw new BusinessException(
                            'IDEMPOTENCY_CONFLICT',
                            'Idempotency-Key đã được sử dụng cho một sự kiện khác.',
                            null,
                            409
                        );
                    }

                    $existingEntry = HangDoiWaitlist::with(['suKien.phongHoiTruong'])
                        ->find($cached['entry_id'] ?? 0);

                    if ($existingEntry) {
                        return $this->successResponse(
                            (new WaitlistResource($existingEntry))->resolve($request),
                            'Đã xếp vào hàng đợi danh sách chờ',
                            201
                        );
                    }
                }
            }

            $entry = $this->waitlistService->joinWaitlist($id, $user);
            $entry->load(['suKien.phongHoiTruong']);

            if ($cacheKey !== null) {
                Cache::put(
                    $cacheKey,
                    ['ma_su_kien' => $id, 'entry_id' => (int) $entry->id],
                    now()->addMinutes(5)
                );
            }

            return $this->successResponse(
                (new WaitlistResource($entry))->resolve($request),
                'Đã xếp vào hàng đợi danh sách chờ',
                201
            );
        };

        if ($cacheKey === null) {
            return $resolveEntry();
        }

        $lock = Cache::lock("{$cacheKey}:lock", 10);
        if (! $lock->get()) {
            throw new BusinessException(
                'IDEMPOTENCY_CONFLICT',
                'Yêu cầu với Idempotency-Key này đang được xử lý, vui lòng thử lại.',
                null,
                409
            );
        }

        try {
            return $resolveEntry();
        } finally {
            $lock->release();
        }
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
