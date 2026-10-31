<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WithdrawProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isAdmin() || $user->isToChuc());
    }

    public function rules(): array
    {
        return [
            'ly_do_rut' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'ly_do_rut.required' => 'Lý do rút đề xuất không được để trống.',
            'ly_do_rut.min' => 'Lý do rút đề xuất phải có ít nhất 3 ký tự.',
            'ly_do_rut.max' => 'Lý do rút đề xuất không được vượt quá 500 ký tự.',
        ];
    }
}
