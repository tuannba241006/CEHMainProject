<?php

namespace App\Services;

/**
 * Neutralize spreadsheet formulas in text cells of downloaded CSV files.
 * CSV does not preserve cell types. Opening/re-saving in different spreadsheet
 * applications still requires manual acceptance testing.
 */
final class CsvFormulaGuard
{
    public static function escapeCell(mixed $value): string
    {
        $text = (string) ($value ?? '');

        // Spreadsheet importers may skip leading tabs, line breaks, or Unicode spaces.
        if (preg_match('/\A[\x00-\x20\x{00A0}\x{2000}-\x{200B}\x{FEFF}]*[=+\-@]/u', $text) === 1) {
            return "'".$text;
        }

        return $text;
    }
}
