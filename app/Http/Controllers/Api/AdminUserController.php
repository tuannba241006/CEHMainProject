<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateInternalUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\EmergencyOverrideService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected AuditLogService $auditLogService,
        protected EmergencyOverrideService $emergencyOverrideService
    ) {}

    /**
     * UC-ADM-01: Retrieve system users list with search and pagination
     * GET /api/v1/admin/users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['donViToChuc', 'khoa']);

        if ($request->filled('q')) {
            $keyword = trim($request->input('q'));
            $query->where(function ($q) use ($keyword) {
                $q->where('ho_ten', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhere('mssv', 'like', "%{$keyword}%");
            });
        }

        if ($request->filled('loai_tai_khoan')) {
            $query->where('loai_tai_khoan', $request->input('loai_tai_khoan'));
        }

        if ($request->filled('ma_don_vi_to_chuc')) {
            $query->where('ma_don_vi_to_chuc', $request->input('ma_don_vi_to_chuc'));
        }

        if ($request->filled('ma_khoa')) {
            $query->where('ma_khoa', $request->input('ma_khoa'));
        }

        if ($request->has('hoat_dong')) {
            $query->where('hoat_dong', $request->boolean('hoat_dong'));
        }

        $limit = min(100, max(1, (int) $request->input('limit', 20)));
        $users = $query->orderBy('ma_tai_khoan', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], 200);
    }

    /**
     * UC-ADM-01: Provision internal staff/organizer account (@uit.edu.vn)
     * POST /api/v1/admin/users
     * POST /api/v1/admin/users/create-internal
     */
    public function createInternal(CreateInternalUserRequest $request): JsonResponse
    {
        $hoTen = $request->input('ho_ten');
        $email = $request->input('email');
        $loaiTaiKhoan = $request->input('loai_tai_khoan');
        $maDonVi = $request->input('ma_don_vi_to_chuc');
        $soDienThoai = $request->input('so_dien_thoai');

        // Generate temporary password if not provided
        $plainPassword = $request->input('mat_khau') ?: Str::password(12, true, true, false, false);
        $passwordHash = Hash::make($plainPassword, ['rounds' => 12]);

        $user = User::create([
            'ho_ten' => $hoTen,
            'email' => $email,
            'mat_khau' => $passwordHash,
            'loai_tai_khoan' => $loaiTaiKhoan,
            'ma_don_vi_to_chuc' => $maDonVi,
            'so_dien_thoai' => $soDienThoai,
            'dong_y_nghi_dinh_13' => true,
            'thoi_gian_dong_y_nd13' => now(),
            'buoc_doi_mat_khau' => true,
            'hoat_dong' => true,
        ]);

        // Audit log (NFR-RELI-01)
        $this->auditLogService->logAudit(
            action: 'GRANT_ORGANIZER',
            eventId: null,
            regId: null,
            targetUserId: $user->ma_tai_khoan,
            prevStatus: null,
            nextStatus: 'ACTIVE',
            reason: "Cấp phát tài khoản nội bộ {$loaiTaiKhoan} cho {$hoTen} ({$email})",
            actorUserId: $request->user()->ma_tai_khoan
        );

        return $this->successResponse(
            new UserResource($user),
            'Tạo tài khoản nội bộ thành công. Mật khẩu tạm đã được khởi tạo và gửi tới email.',
            201
        );
    }

        /**
     * Grant emergency approval permission to an Admin account.
     * POST /api/v1/admin/users/{id}/permissions/emergency-override
     */
    public function grantEmergencyOverride(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'ly_do' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $permission = $this->emergencyOverrideService->grantEmergencyOverride(
            $request->user(),
            $id,
            $validated['ly_do']
        );

        return $this->successResponse(
            [
                'id' => $permission->id,
                'ma_tai_khoan' => $permission->ma_tai_khoan,
                'quyen' => $permission->quyen,
                'nguoi_cap' => $permission->nguoi_cap,
                'ly_do_cap' => $permission->ly_do_cap,
                'thoi_gian_cap' => $permission->thoi_gian_cap,
            ],
            'Cấp quyền duyệt khẩn cấp thành công.',
            201
        );
    }

    /**
     * Revoke emergency approval permission from an Admin account.
     * DELETE /api/v1/admin/users/{id}/permissions/emergency-override
     */
    public function revokeEmergencyOverride(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'ly_do' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $permission = $this->emergencyOverrideService->revokeEmergencyOverride(
            $request->user(),
            $id,
            $validated['ly_do']
        );

        return $this->successResponse(
            [
                'id' => $permission->id,
                'ma_tai_khoan' => $permission->ma_tai_khoan,
                'quyen' => $permission->quyen,
                'nguoi_thu_hoi' => $permission->nguoi_thu_hoi,
                'ly_do_thu_hoi' => $permission->ly_do_thu_hoi,
                'thoi_gian_thu_hoi' => $permission->thoi_gian_thu_hoi,
            ],
            'Thu hồi quyền duyệt khẩn cấp thành công.',
            200
        );
    }

}
