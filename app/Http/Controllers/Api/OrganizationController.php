<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonViToChuc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    /**
     * GET /api/organizations  (public, no auth)
     * GET /api/v1/organizations  (public, no auth)
     */
    public function publicIndex(): JsonResponse
    {
        $orgs = DonViToChuc::where('hoat_dong', true)
            ->orderBy('ten_don_vi')
            ->get(['ma_don_vi_to_chuc', 'ten_don_vi', 'ma_dinh_danh', 'loai_don_vi', 'ma_don_vi_cha']);

        return $this->successResponse($orgs);
    }

    /**
     * GET /api/admin/organizations  (Admin only)
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $limit = min(100, max(1, (int) $request->input('limit', 100)));
        $orgs = DonViToChuc::orderBy('ten_don_vi')
            ->paginate($limit);

        return response()->json([
            'success' => true,
            'data'    => $orgs->items(),
            'meta'    => [
                'current_page'    => $orgs->currentPage(),
                'last_page'       => $orgs->lastPage(),
                'per_page'        => $orgs->perPage(),
                'total'           => $orgs->total(),
            ],
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], 200);
    }

    /**
     * POST /api/admin/organizations  (Admin only)
     */
    public function adminStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ten_don_vi'        => 'required|string|max:200',
            'ma_dinh_danh'      => 'nullable|string|min:2|max:50|unique:don_vi_to_chuc,ma_dinh_danh',
            'loai_don_vi'       => 'required|string|in:CLB,DoanHoi,Khoa,PhongBan',
            'ma_don_vi_cha'     => 'nullable|integer|exists:don_vi_to_chuc,ma_don_vi_to_chuc',
            'mo_ta'             => 'nullable|string',
            'logo_url'          => 'nullable|string|max:500',
            'hoat_dong'         => 'boolean',
        ]);

        if (empty($validated['ma_dinh_danh'])) {
            $base = Str::slug($validated['ten_don_vi'], '_');
            $code = strtoupper(substr($base, 0, 30));
            if (empty($code)) {
                $code = 'DONVI';
            }
            $uniqueCode = $code;
            $counter = 1;
            while (DonViToChuc::where('ma_dinh_danh', $uniqueCode)->exists()) {
                $uniqueCode = substr($code, 0, 25) . '_' . $counter++;
            }
            $validated['ma_dinh_danh'] = $uniqueCode;
        }

        $org = DonViToChuc::create($validated + ['hoat_dong' => $validated['hoat_dong'] ?? true]);

        return $this->successResponse($org, 'Tạo đơn vị tổ chức thành công.', 201);
    }

    /**
     * PUT /api/admin/organizations/{id}  (Admin only)
     */
    public function adminUpdate(Request $request, int $id): JsonResponse
    {
        $org = DonViToChuc::findOrFail($id);

        $validated = $request->validate([
            'ten_don_vi'    => 'sometimes|string|max:200',
            'ma_dinh_danh'  => 'sometimes|nullable|string|min:2|max:50|unique:don_vi_to_chuc,ma_dinh_danh,' . $id . ',ma_don_vi_to_chuc',
            'loai_don_vi'   => 'sometimes|string|in:CLB,DoanHoi,Khoa,PhongBan',
            'ma_don_vi_cha' => 'nullable|integer|exists:don_vi_to_chuc,ma_don_vi_to_chuc',
            'mo_ta'         => 'nullable|string',
            'logo_url'      => 'nullable|string|max:500',
            'hoat_dong'     => 'boolean',
        ]);

        $org->update($validated);

        return $this->successResponse($org, 'Cập nhật đơn vị tổ chức thành công.');
    }
}
