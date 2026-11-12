<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MacroBiFilterRequest;
use App\Http\Resources\MacroBiResource;
use App\Http\Resources\NoShowViolatorResource;
use App\Services\MacroBiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use ZipArchive;

class MacroBiController extends Controller
{
    use ApiResponseTrait;

    public function __construct(protected MacroBiService $macroBiService) {}

    public function macro(MacroBiFilterRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $data = $this->macroBiService->getMacroDashboard(
            $filters['tu_ngay'] ?? null,
            $filters['den_ngay'] ?? null
        );

        return $this->successResponse(
            data: new MacroBiResource($data),
            message: 'Thao tác thành công',
            code: 200
        );
    }

    public function noShowViolations(MacroBiFilterRequest $request): JsonResponse
    {
        $result = $this->macroBiService->getNoShowViolations($request->validated());

        return response()->json([
            'success' => true,
            'data' => NoShowViolatorResource::collection($result['items']),
            'meta' => [
                'trang_hien_tai' => $result['current_page'],
                'tong_so_trang' => $result['last_page'],
                'tong_so_ban_ghi' => $result['total'],
                'kich_thuoc_trang' => $result['per_page'],
            ],
            'message' => 'Thao tác thành công',
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ]);
    }

    public function exportMacro(Request $request): Response
    {
        $filters = $request->validate([
            'dinh_dang' => ['required', Rule::in(['xlsx', 'pdf'])],
            'tu_ngay' => ['sometimes', 'date'],
            'den_ngay' => ['sometimes', 'date', 'after_or_equal:tu_ngay'],
        ]);
        $report = $this->macroBiService->getMacroDashboard(
            $filters['tu_ngay'] ?? null,
            $filters['den_ngay'] ?? null
        );
        $format = $filters['dinh_dang'];
        $filename = 'macro-report-'.$report['tu_ngay'].'-'.$report['den_ngay'].'.'.$format;
        $rows = [
            ['Campus Event Hub - Macro BI Report'],
            ['Từ ngày', $report['tu_ngay'], 'Đến ngày', $report['den_ngay']],
            ['Tổng số sự kiện', $report['tong_so_su_kien']],
            ['Tổng lượt sinh viên tham gia', $report['tong_luot_sinh_vien_tham_gia']],
            ['Tỷ lệ show-up (%)', $report['ty_le_show_up_toan_truong_pct']],
            ['Tỷ lệ no-show (%)', $report['ty_le_no_show_toan_truong_pct']],
            ['Tốc độ chạy vé trung bình (phút)', $report['toc_do_chay_ve_phut_tb'] ?? 'N/A'],
        ];

        if ($format === 'pdf') {
            $content = "BT\n/F1 18 Tf\n50 780 Td\n(Campus Event Hub - Macro BI Report) Tj\nET\n";
            $y = 735;
            foreach ($rows as $row) {
                $line = implode(' | ', array_map(fn ($cell) => (string) $cell, $row));
                $line = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $line) ?: $line;
                $content .= "BT\n/F2 11 Tf\n50 {$y} Td\n(".addcslashes($line, '()\\').") Tj\nET\n";
                $y -= 24;
            }
            $pdf = $this->makePdf($content);

            return response($pdf, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            ]);
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'ceh-macro-');
        $zip = new ZipArchive;
        $zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Macro BI" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
        $sheet = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        foreach ($rows as $rowIndex => $row) {
            $sheet .= '<row r="'.($rowIndex + 1).'">';
            foreach ($row as $columnIndex => $value) {
                $column = chr(65 + $columnIndex);
                $sheet .= '<c r="'.$column.($rowIndex + 1).'" t="inlineStr"><is><t>'.htmlspecialchars((string) $value, ENT_XML1 | ENT_COMPAT, 'UTF-8').'</t></is></c>';
            }
            $sheet .= '</row>';
        }
        $sheet .= '</sheetData></worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheet);
        $zip->close();
        $xlsx = file_get_contents($tempFile);
        @unlink($tempFile);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    private function makePdf(string $content): string
    {
        $objects = [
            '1 0 obj'."\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
            '2 0 obj'."\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
            '3 0 obj'."\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj",
            '4 0 obj'."\n<< /Length ".strlen($content)." >>\nstream\n{$content}endstream\nendobj",
            '5 0 obj'."\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj",
            '6 0 obj'."\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object."\n";
        }
        $xref = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        for ($index = 1; $index <= count($objects); $index++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$index]);
        }

        return $pdf.'trailer'."\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }
}
