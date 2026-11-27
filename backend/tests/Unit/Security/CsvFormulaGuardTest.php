<?php

namespace Tests\Unit\Security;

use App\Services\CsvFormulaGuard;
use App\Services\DrlExportService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CsvFormulaGuardTest extends TestCase
{
    public static function formulaPayloads(): array
    {
        return [
            'equals' => ['=1+1'],
            'plus' => ['+SUM(1,1)'],
            'minus' => ['-10+20'],
            'at-sign' => ['@SUM(1,1)'],
            'tab-prefix' => ["\t=HYPERLINK(\"https://example.invalid\")"],
            'new-line-prefix' => ["\r\n=1+2"],
            'unicode-space' => ["\u{00A0}=1+2"],
            'bom-prefix' => ["\u{FEFF}=1+2"],
        ];
    }

    #[DataProvider('formulaPayloads')]
    public function test_formula_payload_is_prefixed_as_text(string $payload): void
    {
        $this->assertSame("'".$payload, CsvFormulaGuard::escapeCell($payload));
    }

    public function test_plain_text_does_not_change(): void
    {
        $this->assertSame('Nguyễn Văn An', CsvFormulaGuard::escapeCell('Nguyễn Văn An'));
        $this->assertSame('22520001', CsvFormulaGuard::escapeCell('22520001'));
        $this->assertSame("'=1+1", CsvFormulaGuard::escapeCell("'=1+1"));
    }

    public function test_drl_csv_export_escapes_text_but_preserves_numeric_columns(): void
    {
        $record = (object) [
            'stt' => 1,
            'mssv' => '22520001',
            'ho_ten' => '=HYPERLINK("https://example.invalid")',
            'lop_sinh_hoat' => "\t=1+1",
            'khoa' => '+SUM(1,1)',
            'ten_su_kien' => '@SUM(1,1)',
            'dieu_drl' => 'Dieu3',
            'diem_cong_thuc_nhan' => 5,
            'thoi_gian_vao' => null,
            'thoi_gian_ra' => null,
            'thoi_luong_tham_du_phut' => 30,
            'ghi_chu_tham_du' => '-1+2',
        ];

        $csv = (new DrlExportService)->generateCsv([$record]);
        $stream = fopen('php://temp', 'w+');
        fwrite($stream, $csv);
        rewind($stream);
        $this->assertSame("\xEF\xBB\xBF", fread($stream, 3));
        $this->assertCount(12, fgetcsv($stream, null, ',', '"', ''));
        $row = fgetcsv($stream, null, ',', '"', '');
        fclose($stream);

        $this->assertSame("'=HYPERLINK(\"https://example.invalid\")", $row[2]);
        $this->assertSame("'\t=1+1", $row[3]);
        $this->assertSame("'+SUM(1,1)", $row[4]);
        $this->assertSame("'@SUM(1,1)", $row[5]);
        $this->assertSame('5.00', $row[7]);
        $this->assertSame('30', $row[10]);
        $this->assertSame("'-1+2", $row[11]);
    }
}
