<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EventFilterRequest;
use App\Http\Resources\EventCardResource;
use App\Models\ChuyenDe;
use App\Services\EventSearchService;
use Illuminate\Http\JsonResponse;

class EventCatalogController extends Controller
{
    public function index(
        EventFilterRequest $request,
        EventSearchService $searchService
    ): JsonResponse {
        $events = $searchService->search(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'data' => EventCardResource::collection(
                $events->getCollection()
            )->resolve(),
            'meta' => [
                'trang_hien_tai' => $events->currentPage(),
                'tong_so_trang' => $events->lastPage(),
                'tong_so_ban_ghi' => $events->total(),
                'kich_thuoc_trang' => $events->perPage(),
            ],
            'server_time' => now()->setTimezone('Asia/Ho_Chi_Minh')->toIso8601String(),
        ]);
    }

    public function topics(): JsonResponse
    {
        $topics = ChuyenDe::query()
            ->where('da_xoa', false)
            ->orderBy('ten_chuyen_de')
            ->get([
                'ma_chuyen_de',
                'ten_chuyen_de',
                'mo_ta',
                'da_xoa',
            ]);

        return response()->json([
            'success' => true,
            'data' => $topics,
        ]);
    }
}
