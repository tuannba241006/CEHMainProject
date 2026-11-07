<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SelfCheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['device_id' => $this->header('X-Device-Id')]);
    }

    public function rules(): array
    {
        return [
            'ma_su_kien' => ['required', 'integer', 'min:1'],
            'totp_code' => ['required', 'string', 'digits:6'],
            'device_id' => ['required', 'string', 'min:8', 'max:100'],
            'client_fingerprint' => ['nullable', 'string', 'max:255'],
        ];
    }
}
