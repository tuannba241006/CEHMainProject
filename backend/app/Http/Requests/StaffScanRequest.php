<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StaffScanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ma_su_kien' => ['required', 'integer', 'min:1'],
            'che_do_quet' => ['required', 'in:CHECK_IN,CHECK_OUT'],
            'chuoi_qr_ve' => ['required', 'string', 'regex:/^CEH1\.[0-9a-fA-F-]{36}\.[0-9]+\.[0-9]+\.[0-9a-f]{64}$/'],
        ];
    }
}
