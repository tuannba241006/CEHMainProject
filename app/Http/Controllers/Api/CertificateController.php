<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RevokeCertificateRequest;
use App\Http\Resources\CertificateResource;
use App\Http\Resources\VerifyCertificateResource;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CertificateController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected CertificateService $certificateService
    ) {}

    /**
     * Issue or retrieve certificate for ticket (UC-CERT-01).
     * POST /api/v1/tickets/{id}/certificate
     */
    public function issueOrGet(int $id, Request $request): JsonResponse
    {
        $result = $this->certificateService->issueOrGetCertificate(
            ticketId: $id,
            userId: (int) $request->user()->ma_tai_khoan
        );

        $status = $result['created'] ? 201 : 200;
        $message = $result['created']
            ? 'Khởi tạo Giấy chứng nhận số thành công'
            : 'Lấy thông tin Giấy chứng nhận thành công';

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => new CertificateResource($result['certificate']),
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], $status);
    }

    /**
     * List current student's certificates (UC-CERT-01).
     * GET /api/v1/certificates/my-certificates
     */
    public function myCertificates(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) ($request->input('limit') ?? $request->input('per_page') ?? 10), 50));
        $paginator = $this->certificateService->getMyCertificates(
            userId: (int) $request->user()->ma_tai_khoan,
            perPage: $perPage
        );

        return response()->json([
            'success' => true,
            'data' => CertificateResource::collection($paginator->items()),
            'meta' => [
                'trang_hien_tai' => $paginator->currentPage(),
                'tong_so_trang' => $paginator->lastPage(),
                'tong_so_ban_ghi' => $paginator->total(),
                'kich_thuoc_trang' => $paginator->perPage(),
            ],
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], 200);
    }

    /**
     * Download certificate vector PDF (UC-CERT-01).
     * GET /api/v1/certificates/{id}/download
     */
    public function downloadPdf(int $id, Request $request): Response
    {
        $isAdmin = (string) ($request->user()->loai_tai_khoan) === 'Admin';
        $certificate = $this->certificateService->getCertificateForDownload(
            certId: $id,
            userId: (int) $request->user()->ma_tai_khoan,
            isAdmin: $isAdmin
        );

        $pdf = $this->certificateService->generatePdf($certificate);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="certificate-'.$certificate->id.'.pdf"',
        ]);
    }

    /**
     * Public verification of certificate by hash (UC-CERT-01.AC.1).
     * GET /api/v1/certificates/verify/{hash}
     */
    public function verifyPublic(string $hash): JsonResponse
    {
        $certificate = $this->certificateService->verifyPublic($hash);

        return response()->json([
            'success' => true,
            'message' => 'Thao tác thành công',
            'data' => new VerifyCertificateResource($certificate),
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], 200);
    }

    /**
     * Admin list certificates with search & filters (UC-CERT-01.AC.2).
     * GET /api/v1/admin/certificates
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $filters = $request->only(['q', 'ma_su_kien', 'da_thu_hoi', 'limit', 'per_page']);
        $perPage = max(1, min((int) ($request->input('limit') ?? $request->input('per_page') ?? 15), 50));
        $paginator = $this->certificateService->adminListCertificates($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => CertificateResource::collection($paginator->items()),
            'meta' => [
                'trang_hien_tai' => $paginator->currentPage(),
                'tong_so_trang' => $paginator->lastPage(),
                'tong_so_ban_ghi' => $paginator->total(),
                'kich_thuoc_trang' => $paginator->perPage(),
            ],
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], 200);
    }

    /**
     * Admin revokes certificate (UC-CERT-01.AC.2).
     * POST /api/v1/admin/certificates/{id}/revoke
     */
    public function revoke(int $id, RevokeCertificateRequest $request): JsonResponse
    {
        $certificate = $this->certificateService->revokeCertificate(
            certId: $id,
            reason: $request->getReason(),
            adminId: (int) $request->user()->ma_tai_khoan
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã thu hồi Giấy chứng nhận số',
            'data' => new CertificateResource($certificate),
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ], 200);
    }
}
