<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartKioskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['ten_thiet_bi' => ['nullable', 'string', 'max:255']];
    }
}
