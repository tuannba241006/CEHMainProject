<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\ChungNhan;
use App\Models\DangKy;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CertificateService
{
    public function __construct(
        protected CryptoService $cryptoService,
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Mask full name according to Decree 13/2023/ND-CP (e.g. "Nguyễn Văn An" -> "Nguyễn V** A").
     */
    public static function maskName(string $fullName): string
    {
        $parts = preg_split('/\s+/u', trim($fullName), -1, PREG_SPLIT_NO_EMPTY);
        if (empty($parts)) {
            return '***';
        }

        if (count($parts) === 1) {
            $first = mb_substr($parts[0], 0, 1);
            $last = mb_strlen($parts[0]) > 2 ? mb_substr($parts[0], -1, 1) : '';

            return $first.'**'.$last;
        }

        if (count($parts) === 2) {
            return $parts[0].' '.mb_substr($parts[1], 0, 1).'**';
        }

        // 3 or more words
        $first = $parts[0];
        $last = mb_substr($parts[count($parts) - 1], 0, 1);
        $middle = mb_substr($parts[1], 0, 1).'**';

        return "{$first} {$middle} {$last}";
    }

    /**
     * Mask MSSV according to Decree 13/2023/ND-CP (e.g. "22520001" -> "2252****").
     */
    public static function maskMssv(string $mssv): string
    {
        $len = strlen($mssv);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }

        return substr($mssv, 0, 4).str_repeat('*', $len - 4);
    }

    /**
     * Issue or retrieve certificate for a ticket (Idempotent - UC-CERT-01).
     */
    public function issueOrGetCertificate(int $ticketId, int $userId): array
    {
        $ticket = DangKy::with('suKien.donViToChuc', 'taiKhoan')->findOrFail($ticketId);

        if ((int) $ticket->ma_tai_khoan !== $userId) {
            throw new BusinessException(
                'FORBIDDEN',
                'Bạn không có quyền thực hiện thao tác này',
                null,
                403
            );
        }

        if (! $ticket->du_dieu_kien_drl || (float) $ticket->ti_le_drl < 0.5) {
            throw new BusinessException(
                'NOT_ELIGIBLE',
                'Bạn chưa đủ điều kiện nhận Giấy chứng nhận cho sự kiện này.',
                null,
                403
            );
        }

        $existing = ChungNhan::with('dangKy.suKien.donViToChuc', 'dangKy.taiKhoan')
            ->where('ma_dang_ky', $ticket->ma_dang_ky)
            ->first();

        if ($existing) {
            if ($existing->da_thu_hoi) {
                throw new BusinessException(
                    'CERT_REVOKED',
                    'Giấy chứng nhận này đã bị thu hồi.',
                    null,
                    403
                );
            }

            return [
                'certificate' => $existing,
                'created' => false,
            ];
        }

        $hash = $this->cryptoService->signCertificate(
            $ticket->ma_dang_ky,
            $ticket->ma_tai_khoan,
            $ticket->ma_su_kien
        );

        $cert = ChungNhan::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $hash,
            'ngay_cap' => now(),
            'da_thu_hoi' => false,
            'thoi_gian_thu_hoi' => null,
            'nguoi_thu_hoi' => null,
        ]);

        return [
            'certificate' => $cert->load('dangKy.suKien.donViToChuc', 'dangKy.taiKhoan'),
            'created' => true,
        ];
    }

    /**
     * Get paginated list of student's certificates (UC-CERT-01).
     */
    public function getMyCertificates(int $userId, int $perPage = 10): LengthAwarePaginator
    {
        return ChungNhan::whereHas('dangKy', function ($q) use ($userId) {
            $q->where('ma_tai_khoan', $userId);
        })
            ->with('dangKy.suKien.donViToChuc', 'dangKy.taiKhoan')
            ->orderByDesc('ngay_cap')
            ->paginate($perPage);
    }

    /**
     * Retrieve certificate for download, verifying ownership and non-revocation (UC-CERT-01).
     */
    public function getCertificateForDownload(int $certId, int $userId, bool $isAdmin = false): ChungNhan
    {
        $cert = ChungNhan::with('dangKy.suKien.donViToChuc', 'dangKy.taiKhoan')->findOrFail($certId);

        if (! $isAdmin && (int) ($cert->dangKy?->ma_tai_khoan) !== $userId) {
            throw new BusinessException(
                'FORBIDDEN',
                'Bạn không có quyền thực hiện thao tác này',
                null,
                403
            );
        }

        if ($cert->da_thu_hoi) {
            throw new BusinessException(
                'CERT_REVOKED',
                'Giấy chứng nhận này đã bị thu hồi.',
                null,
                403
            );
        }

        return $cert;
    }

    /**
     * Generate standard PDF vector stream for certificate.
     */
    public function generatePdf(ChungNhan $certificate): string
    {
        $dangKy = $certificate->dangKy;
        $student = $dangKy?->taiKhoan;
        $suKien = $dangKy?->suKien;
        $donVi = $suKien?->donViToChuc;

        $studentName = $student?->ho_ten ?? 'Sinh vien';
        $mssv = $student?->mssv ?? '';
        $eventName = $suKien?->ten_su_kien ?? 'Su kien';
        $unitName = $donVi?->ten_don_vi ?? 'Truong Dai hoc Cong nghe Thong tin - DHQG-HCM';
        $date = $certificate->ngay_cap ? Carbon::parse($certificate->ngay_cap)->format('d/m/Y') : date('d/m/Y');
        $hashShort = substr($certificate->ma_hash, 0, 16).'...';

        $content = "BT\n/F1 18 Tf\n50 730 Td\n(TRUONG DAI HOC CONG NGHE THONG TIN - DHQG-HCM) Tj\nET\n";
        $content .= "BT\n/F1 15 Tf\n50 680 Td\n(GIAY CHUNG NHAN THAM GIA SU KIEN) Tj\nET\n";
        $content .= "BT\n/F2 12 Tf\n50 620 Td\n(Chung nhan sinh vien: ".addcslashes($studentName, '()\\').' - MSSV: '.$mssv.") Tj\nET\n";
        $content .= "BT\n/F2 12 Tf\n50 580 Td\n(Da tham gia su kien: ".addcslashes($eventName, '()\\').") Tj\nET\n";
        $content .= "BT\n/F2 12 Tf\n50 540 Td\n(Don vi to chuc: ".addcslashes($unitName, '()\\').") Tj\nET\n";
        $content .= "BT\n/F2 11 Tf\n50 500 Td\n(Ngay cap: {$date} | Ma chu ky HMAC: {$hashShort}) Tj\nET\n";
        $content .= "BT\n/F2 9 Tf\n50 460 Td\n(Xac thuc truc tuyen tai: /certificates/verify/{$certificate->ma_hash}) Tj\nET\n";

        $streamLen = strlen($content);

        $objects = [];
        $objects[] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj";
        $objects[] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj";
        $objects[] = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj";
        $objects[] = "4 0 obj\n<< /Length {$streamLen} >>\nstream\n{$content}endstream\nendobj";
        $objects[] = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj";
        $objects[] = "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj";

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $obj) {
            $offsets[] = strlen($pdf);
            $pdf .= $obj."\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $pdf .= 'trailer\n<< /Size '.(count($objects) + 1)." /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }

    /**
     * Public verification of certificate by hash (UC-CERT-01.AC.1).
     */
    public function verifyPublic(string $hash): ChungNhan
    {
        return ChungNhan::where('ma_hash', $hash)
            ->with('dangKy.suKien.donViToChuc', 'dangKy.taiKhoan')
            ->firstOrFail();
    }

    /**
     * Admin list certificates with search and filters (UC-CERT-01.AC.2).
     */
    public function adminListCertificates(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = ChungNhan::with('dangKy.suKien.donViToChuc', 'dangKy.taiKhoan')
            ->orderByDesc('id');

        if (! empty($filters['q'])) {
            $term = trim($filters['q']);
            $query->where(function ($q) use ($term) {
                $q->where('ma_hash', 'like', "%{$term}%")
                    ->orWhereHas('dangKy.taiKhoan', function ($tq) use ($term) {
                        $tq->where('mssv', 'like', "%{$term}%")
                            ->orWhere('ho_ten', 'like', "%{$term}%");
                    });
            });
        }

        if (! empty($filters['ma_su_kien'])) {
            $query->whereHas('dangKy', function ($dq) use ($filters) {
                $dq->where('ma_su_kien', (int) $filters['ma_su_kien']);
            });
        }

        if (isset($filters['da_thu_hoi'])) {
            $val = filter_var($filters['da_thu_hoi'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $query->where('da_thu_hoi', $val);
            }
        }

        return $query->paginate($perPage);
    }

    /**
     * Revoke certificate (UC-CERT-01.AC.2).
     */
    public function revokeCertificate(int $certId, string $reason, int $adminId): ChungNhan
    {
        $cert = ChungNhan::with('dangKy.suKien.donViToChuc', 'dangKy.taiKhoan')->findOrFail($certId);

        if (! $cert->da_thu_hoi) {
            DB::transaction(function () use ($cert, $reason, $adminId) {
                $cert->update([
                    'da_thu_hoi' => true,
                    'thoi_gian_thu_hoi' => now(),
                    'nguoi_thu_hoi' => $adminId,
                ]);

                $this->auditLogService->logAudit(
                    action: 'REVOKE_CERTIFICATE',
                    eventId: $cert->dangKy?->ma_su_kien,
                    regId: $cert->ma_dang_ky,
                    targetUserId: $cert->dangKy?->ma_tai_khoan,
                    prevStatus: 'HOP_LE',
                    nextStatus: 'DA_THU_HOI',
                    reason: $reason,
                    actorUserId: $adminId
                );
            });
        }

        return $cert->fresh(['dangKy.suKien.donViToChuc', 'dangKy.taiKhoan']);
    }
}
