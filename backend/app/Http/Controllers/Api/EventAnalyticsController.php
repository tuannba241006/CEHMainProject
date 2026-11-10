<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventAnalyticsResource;
use App\Services\EventAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventAnalyticsController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected EventAnalyticsService $analyticsService
    ) {}

    /**
     * GET /api/v1/organizer/events/{id}/analytics
     * Dashboard phân tích chỉ số hiệu quả sự kiện dành cho Ban tổ chức (UC-REP-01).
     */
    public function showAnalytics(Request $request, int $id): JsonResponse
    {
        $data = $this->analyticsService->getOrganizerAnalytics($request->user(), $id);

        return $this->successResponse(
            data: new EventAnalyticsResource($data),
            message: 'Thao tác thành công',
            code: 200
        );
    }

    /**
     * GET /api/v1/admin/analytics/macro
     * GET /api/admin/analytics/macro
     * Dashboard báo cáo chiến lược vĩ mô toàn trường (< 1.0s - UC-REP-02).
     */
    public function macroAnalytics(Request $request): JsonResponse
    {
        $tuNgay = $request->query('tu_ngay');
        $denNgay = $request->query('den_ngay');
        $data = $this->analyticsService->getMacroAnalytics($tuNgay, $denNgay);

        return $this->successResponse(
            data: $data,
            message: 'Thao tác thành công',
            code: 200
        );
    }

    /**
     * GET /api/v1/admin/analytics/no-show-violations
     * GET /api/admin/analytics/no-show-violations
     * Danh sách sinh viên tái phạm No-show (UC-REP-02).
     */
    public function noShowViolations(Request $request): JsonResponse
    {
        $data = $this->analyticsService->getNoShowViolations();

        return $this->successResponse(
            data: $data,
            message: 'Danh sách sinh viên vi phạm No-show toàn trường',
            code: 200
        );
    }

    /**
     * GET /api/v1/admin/analytics/macro/export
     * GET /api/admin/analytics/macro/export
     * Kết xuất báo cáo vĩ mô ra file (.xlsx/.csv).
     */
    public function exportMacro(Request $request)
    {
        $tuNgay = $request->query('tu_ngay');
        $denNgay = $request->query('den_ngay');
        $data = $this->analyticsService->getMacroAnalytics($tuNgay, $denNgay);

        $csv = "BÁO CÁO CHIẾN LƯỢC TOÀN TRƯỜNG\n";
        $csv .= "Kỳ dữ liệu: {$data['tu_ngay']} đến {$data['den_ngay']}\n";
        $csv .= "Tổng số sự kiện: {$data['tong_so_su_kien']}\n";
        $csv .= "Tổng lượt SV tham gia: {$data['tong_luot_sinh_vien_tham_gia']}\n";
        $csv .= "Tỷ lệ Show-up toàn trường: {$data['ty_le_show_up_toan_truong_pct']}%\n";
        $csv .= "Tỷ lệ No-show toàn trường: {$data['ty_le_no_show_toan_truong_pct']}%\n";
        $csv .= "Tốc độ cháy vé trung bình: {$data['toc_do_chay_ve_phut_tb']} phút\n";

        return response($csv, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="bao_cao_vi_mo.xlsx"',
        ]);
    }
}
