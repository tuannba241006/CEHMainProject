<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventPublicDetailResource;
use App\Models\SuKien;
use App\Services\EventSmartActionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventPublicDetailController extends Controller
{
    public function show(Request $request, int $id): JsonResponse
    {
        $event = SuKien::query()
            ->with([
                'chuyenDe',
                'donViHost',
                'phongHoiTruong',
                'dongToChucs' => function ($query) {
                    $query->where(
                        'trang_thai_xac_nhan',
                        'DONG_Y'
                    )->with('donViToChuc');
                },
            ])
            ->whereIn('trang_thai', [
                'PUBLISHED',
                'HAPPENING',
                'COMPLETED',
            ])
            ->where('ma_su_kien', $id)
            ->firstOrFail();

        // Xác thực tùy chọn: khách chưa đăng nhập vẫn xem được.
        $user = Auth::guard('sanctum')->user()
            ?? Auth::guard('web')->user();

        // Tính trạng thái nút bấm thông minh của PKG-04.
        $action = app(EventSmartActionService::class)
            ->forEvent($event, $user);

        $data = (new EventPublicDetailResource($event))
            ->resolve($request);

        $data['nut_bam_dieu_huong'] = $action;

        return response()->json([
            'success' => true,
            'data' => $data,
            'server_time' => now()
                ->setTimezone('Asia/Ho_Chi_Minh')
                ->toIso8601String(),
        ]);
    }
}
