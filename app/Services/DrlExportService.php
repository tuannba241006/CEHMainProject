<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use ZipArchive;

class DrlExportService
{
    /**
     * Header columns matching CTSV UIT format.
     */
    protected array $headers = [
        'STT',
        'MSSV',
        'Họ và tên',
        'Lớp sinh hoạt',
        'Khoa',
        'Tên sự kiện',
        'Điều ĐRL',
        'Điểm cộng thực nhận',
        'Thời gian vào',
        'Thời gian ra',
        'Thời lượng (phút)',
        'Ghi chú tham dự',
    ];

    /**
     * Generate native OpenXML (.xlsx) binary content without external libraries.
     */
    public function generateXlsx(Collection|array $records, string $sheetName = 'DanhSachDRL'): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'ceh_drl_');
        $zip = new ZipArchive;

        if ($zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Không thể khởi tạo file zip tạm để xuất Excel.');
        }

        // 1. [Content_Types].xml
        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            .'</Types>';
        $zip->addFromString('[Content_Types].xml', $contentTypes);

        // 2. _rels/.rels
        $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';
        $zip->addFromString('_rels/.rels', $rels);

        // 3. xl/_rels/workbook.xml.rels
        $wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            .'</Relationships>';
        $zip->addFromString('xl/_rels/workbook.xml.rels', $wbRels);

        // 4. xl/workbook.xml
        $cleanSheetName = substr(preg_replace('/[\\\\\/\?\*\[\]]/', '', $sheetName), 0, 31) ?: 'DanhSachDRL';
        $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets>'
            .'<sheet name="'.htmlspecialchars($cleanSheetName, ENT_XML1).'" sheetId="1" r:id="rId1"/>'
            .'</sheets>'
            .'</workbook>';
        $zip->addFromString('xl/workbook.xml', $workbook);

        // 5. xl/styles.xml
        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="2">'
            .'<font><sz val="11"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><name val="Calibri"/></font>'
            .'</fonts>'
            .'<fills count="2">'
            .'<fill><patternFill patternType="none"/></fill>'
            .'<fill><patternFill patternType="gray125"/></fill>'
            .'</fills>'
            .'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
            .'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            .'<cellXfs count="2">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            .'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
            .'</cellXfs>'
            .'</styleSheet>';
        $zip->addFromString('xl/styles.xml', $styles);

        // 6. xl/worksheets/sheet1.xml
        $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<sheetData>';

        // Header Row (Row 1, bold)
        $sheetXml .= '<row r="1">';
        foreach ($this->headers as $colIdx => $colName) {
            $colLetter = $this->getColumnLetter($colIdx + 1);
            $sheetXml .= '<c r="'.$colLetter.'1" t="inlineStr" s="1"><is><t>'.htmlspecialchars($colName, ENT_XML1).'</t></is></c>';
        }
        $sheetXml .= '</row>';

        // Data Rows
        $rowNum = 2;
        foreach ($records as $record) {
            $sheetXml .= '<row r="'.$rowNum.'">';

            $drlText = (string) ($record->dieu_drl ?? '');
            if ($drlText === 'Dieu3') {
                $drlText = 'Điều 3';
            } elseif ($drlText === 'Dieu4') {
                $drlText = 'Điều 4';
            }

            $vao = $record->thoi_gian_vao ? Carbon::parse($record->thoi_gian_vao)->setTimezone('+07:00')->format('Y-m-d H:i:s') : '';
            $ra = $record->thoi_gian_ra ? Carbon::parse($record->thoi_gian_ra)->setTimezone('+07:00')->format('Y-m-d H:i:s') : '';

            $rowValues = [
                $record->stt ?? ($rowNum - 1),
                $record->mssv ?? '',
                $record->ho_ten ?? '',
                $record->lop_sinh_hoat ?? '',
                $record->khoa ?? '',
                $record->ten_su_kien ?? '',
                $drlText,
                number_format((float) ($record->diem_cong_thuc_nhan ?? 0), 2, '.', ''),
                $vao,
                $ra,
                $record->thoi_luong_tham_du_phut ?? 0,
                $record->ghi_chu_tham_du ?? '',
            ];

            foreach ($rowValues as $colIdx => $val) {
                $colLetter = $this->getColumnLetter($colIdx + 1);
                $cleanVal = htmlspecialchars((string) $val, ENT_XML1);

                if (is_numeric($val) && $colIdx === 0) {
                    $sheetXml .= '<c r="'.$colLetter.$rowNum.'"><v>'.$val.'</v></c>';
                } elseif (is_numeric($val) && $colIdx === 7) {
                    $sheetXml .= '<c r="'.$colLetter.$rowNum.'"><v>'.$val.'</v></c>';
                } elseif (is_numeric($val) && $colIdx === 10) {
                    $sheetXml .= '<c r="'.$colLetter.$rowNum.'"><v>'.$val.'</v></c>';
                } else {
                    $sheetXml .= '<c r="'.$colLetter.$rowNum.'" t="inlineStr"><is><t>'.$cleanVal.'</t></is></c>';
                }
            }

            $sheetXml .= '</row>';
            $rowNum++;
        }

        $sheetXml .= '</sheetData></worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);

        $zip->close();

        $content = file_get_contents($tempFile);
        @unlink($tempFile);

        return $content;
    }

    /**
     * Generate UTF-8 with BOM CSV format.
     */
    public function generateCsv(Collection|array $records): string
    {
        $output = fopen('php://memory', 'r+');
        // Write UTF-8 BOM so Excel opens Vietnamese fonts cleanly
        fwrite($output, "\xEF\xBB\xBF");

        fputcsv($output, $this->headers);

        $idx = 1;
        foreach ($records as $record) {
            $drlText = (string) ($record->dieu_drl ?? '');
            if ($drlText === 'Dieu3') {
                $drlText = 'Điều 3';
            } elseif ($drlText === 'Dieu4') {
                $drlText = 'Điều 4';
            }

            $vao = $record->thoi_gian_vao ? Carbon::parse($record->thoi_gian_vao)->setTimezone('+07:00')->format('Y-m-d H:i:s') : '';
            $ra = $record->thoi_gian_ra ? Carbon::parse($record->thoi_gian_ra)->setTimezone('+07:00')->format('Y-m-d H:i:s') : '';

            fputcsv($output, [
                $record->stt ?? $idx,
                $record->mssv ?? '',
                $record->ho_ten ?? '',
                $record->lop_sinh_hoat ?? '',
                $record->khoa ?? '',
                $record->ten_su_kien ?? '',
                $drlText,
                number_format((float) ($record->diem_cong_thuc_nhan ?? 0), 2, '.', ''),
                $vao,
                $ra,
                $record->thoi_luong_tham_du_phut ?? 0,
                $record->ghi_chu_tham_du ?? '',
            ]);
            $idx++;
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    /**
     * Convert 1-based column number to Excel column letters (A, B, ..., Z, AA...).
     */
    protected function getColumnLetter(int $colNumber): string
    {
        $letter = '';
        while ($colNumber > 0) {
            $mod = ($colNumber - 1) % 26;
            $letter = chr(65 + $mod).$letter;
            $colNumber = (int) (($colNumber - $mod) / 26);
        }

        return $letter;
    }
}
