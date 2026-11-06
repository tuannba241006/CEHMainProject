<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StaffScanRequest;
use App\Http\Resources\EventCardResource;
use App\Http\Resources\StaffScanResource;
use App\Models\NhanVienCheckIn;
use App\Models\SuKien;
use App\Models\User;
use App\Services\KioskSessionService;
use App\Services\StaffScanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffAttendanceController extends Controller
{
    public function __construct(protected StaffScanService $scanner, protected KioskSessionService $kiosk) {}

    public function myStaffEvents(Request $request): JsonResponse
    {
        $events = SuKien::whereIn('trang_thai', ['PUBLISHED', 'HAPPENING'])->whereDate('thoi_gian_bat_dau', '<=', today())->whereDate('thoi_gian_ket_thuc', '>=', today())->where(function ($q) use ($request) {
            $q->whereHas('nhanVienCheckIns', fn ($s) => $s->where('ma_tai_khoan', $request->user()->ma_tai_khoan));
            if ($request->user()->isAdmin() || $request->user()->isToChuc()) {
                $q->orWhere('ma_don_vi_to_chuc', $request->user()->ma_don_vi_to_chuc);
            }
        })->with(['phongHoiTruong', 'donViHost'])->get();

        return response()->json(['success' => true, 'data' => EventCardResource::collection($events)->resolve(), 'server_time' => now()->toIso8601String()]);
    }

    public function staffScan(StaffScanRequest $request): JsonResponse
    {
        $ticket = $this->scanner->scan($request->user(), $request->validated());

        return response()->json(['success' => true, 'message' => 'Điểm danh thành công', 'data' => (new StaffScanResource($ticket))->resolve(), 'server_time' => now()->toIso8601String()]);
    }

    public function listStaff(Request $request, int $id): JsonResponse
    {
        $event = SuKien::findOrFail($id);
        $this->kiosk->assertHost($event, $request->user());
        $staff = NhanVienCheckIn::with('taiKhoan')->where('ma_su_kien', $id)->paginate(min(max((int) $request->input('limit', 20), 1), 100));

        return response()->json(['success' => true, 'data' => $staff->getCollection()->map(fn ($item) => $this->staffAssignment($item))->values(), 'meta' => ['current_page' => $staff->currentPage(), 'last_page' => $staff->lastPage(), 'per_page' => $staff->perPage(), 'total' => $staff->total()]]);
    }

    public function assignStaff(Request $request, int $id): JsonResponse
    {
        $event = SuKien::findOrFail($id);
        $this->kiosk->assertHost($event, $request->user());
        $data = $request->validate(['danh_sach_mssv' => ['required', 'array', 'min:1', 'max:50'], 'danh_sach_mssv.*' => ['required', 'digits:8']]);
        $assigned = [];
        $errors = [];
        foreach (array_unique($data['danh_sach_mssv']) as $mssv) {
            $user = User::where('mssv', $mssv)->where('loai_tai_khoan', 'SinhVien')->first();
            if (! $user) {
                $errors[] = ['mssv' => $mssv, 'ly_do' => 'MSSV không tồn tại hoặc không thuộc vai trò SinhVien'];

                continue;
            }
            $assignment = NhanVienCheckIn::firstOrCreate(['ma_tai_khoan' => $user->ma_tai_khoan, 'ma_su_kien' => $id], ['nguoi_phan_cong' => $request->user()->ma_tai_khoan]);
            $assigned[] = $this->staffAssignment($assignment->load('taiKhoan'));
        }

        return response()->json(['success' => true, 'message' => 'Đã xử lý phân công nhân viên soát vé', 'data' => ['da_phan_cong' => $assigned, 'loi' => $errors]], 201);
    }

    public function removeStaff(Request $request, int $id, int $userId): JsonResponse
    {
        $event = SuKien::findOrFail($id);
        $this->kiosk->assertHost($event, $request->user());
        NhanVienCheckIn::where(['ma_su_kien' => $id, 'ma_tai_khoan' => $userId])->delete();

        return response()->json(['success' => true, 'message' => 'Thu hồi quyền Staff thành công', 'data' => null]);
    }

    private function staffAssignment(NhanVienCheckIn $assignment): array
    {
        return [
            'id' => (int) $assignment->id,
            'ma_su_kien' => (int) $assignment->ma_su_kien,
            'ma_tai_khoan' => (int) $assignment->ma_tai_khoan,
            'mssv' => $assignment->taiKhoan->mssv,
            'ho_ten' => $assignment->taiKhoan->ho_ten,
            'lop_sinh_hoat' => $assignment->taiKhoan->lop_sinh_hoat,
            'khoa' => $assignment->taiKhoan->khoa,
            'thoi_gian_phan_cong' => $assignment->thoi_gian_phan_cong?->toIso8601String(),
        ];
    }
}
