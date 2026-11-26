<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Http\Resources\WaitlistResource;
use App\Models\DangKy;
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

        return $this->withIdempotency(
            'waitlist:join',
            $userId,
            $id,
            $request,
            function (?array $cached) use ($id, $request): ?JsonResponse {
                if (! is_array($cached)) {
                    return null;
                }
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

                if ($existingEntry && in_array($existingEntry->trang_thai, ['WAITING', 'OFFERED'], true)) {
                    return $this->successResponse(
                        (new WaitlistResource($existingEntry))->resolve($request),
                        'Đã xếp vào hàng đợi danh sách chờ',
                        201
                    );
                }

                return null;
            },
            function (?string $cacheKey) use ($id, $user, $request): JsonResponse {
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
            }
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
        $user = $request->user();
        $userId = (int) $user->ma_tai_khoan;

        return $this->withIdempotency(
            'waitlist:claim',
            $userId,
            $id,
            $request,
            function (?array $cached) use ($id): ?JsonResponse {
                if (! is_array($cached)) {
                    return null;
                }
                if ((int) ($cached['entry_id'] ?? 0) !== $id) {
                    throw new BusinessException(
                        'IDEMPOTENCY_CONFLICT',
                        'Idempotency-Key đã được sử dụng cho một bản ghi khác.',
                        null,
                        409
                    );
                }

                $ticket = DangKy::with(['suKien.phongHoiTruong', 'chungNhan'])
                    ->find($cached['ma_dang_ky'] ?? 0);

                if ($ticket) {
                    return $this->successResponse(
                        new TicketResource($ticket),
                        'Nhận vé chuyển tiếp thành công'
                    );
                }

                return null;
            },
            function (?string $cacheKey) use ($id, $user): JsonResponse {
                $result = $this->waitlistService->claimOffer($id, $user);
                if ($result['error'] !== null) {
                    $error = $result['error'];

                    throw new BusinessException(
                        $error['code'],
                        $error['message'],
                        $error['details'] ?? null,
                        409
                    );
                }

                if ($cacheKey !== null && $result['ticket']) {
                    Cache::put(
                        $cacheKey,
                        ['entry_id' => $id, 'ma_dang_ky' => (int) $result['ticket']->ma_dang_ky],
                        now()->addMinutes(5)
                    );
                }

                return $this->successResponse(
                    new TicketResource($result['ticket']),
                    'Nhận vé chuyển tiếp thành công'
                );
            }
        );
    }

    public function decline(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = (int) $user->ma_tai_khoan;

        return $this->withIdempotency(
            'waitlist:decline',
            $userId,
            $id,
            $request,
            function (?array $cached) use ($id, $request): ?JsonResponse {
                if (! is_array($cached)) {
                    return null;
                }
                if ((int) ($cached['entry_id'] ?? 0) !== $id) {
                    throw new BusinessException(
                        'IDEMPOTENCY_CONFLICT',
                        'Idempotency-Key đã được sử dụng cho một bản ghi khác.',
                        null,
                        409
                    );
                }

                $entry = HangDoiWaitlist::with(['suKien.phongHoiTruong'])->find($id);
                if ($entry) {
                    return $this->successResponse(
                        (new WaitlistResource($entry))->resolve($request),
                        'Đã từ chối nhận suất chờ'
                    );
                }

                return null;
            },
            function (?string $cacheKey) use ($id, $user, $request): JsonResponse {
                $entry = $this->waitlistService->declineOffer($id, $user);

                if ($cacheKey !== null) {
                    Cache::put(
                        $cacheKey,
                        ['entry_id' => $id],
                        now()->addMinutes(5)
                    );
                }

                return $this->successResponse(
                    (new WaitlistResource($entry))->resolve($request),
                    'Đã từ chối nhận suất chờ'
                );
            }
        );
    }

    /**
     * Execute controller action with optional OpenAPI Idempotency-Key locking & caching.
     */
    private function withIdempotency(
        string $scope,
        int $userId,
        int $targetId,
        Request $request,
        callable $replayResolver,
        callable $executor
    ): JsonResponse {
        $idempotencyKey = trim((string) $request->header('Idempotency-Key', ''));
        if (strlen($idempotencyKey) > 255) {
            throw new BusinessException(
                'VALIDATION_FAILED',
                'Header Idempotency-Key vượt quá độ dài tối đa 255 ký tự.',
                ['Idempotency-Key' => ['Idempotency-Key tối đa 255 ký tự.']],
                422
            );
        }

        if ($idempotencyKey === '') {
            return $executor(null);
        }

        $cacheKey = "{$scope}:idempotency:{$userId}:".hash('sha256', $idempotencyKey);
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
            $cached = Cache::get($cacheKey);
            $replay = $replayResolver(is_array($cached) ? $cached : null);
            if ($replay instanceof JsonResponse) {
                return $replay;
            }

            return $executor($cacheKey);
        } finally {
            $lock->release();
        }
    }
}
