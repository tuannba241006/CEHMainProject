<?php

namespace App\Http\Requests;

use App\Exceptions\BusinessException;
use Illuminate\Foundation\Http\FormRequest;

class ReviewEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user || (! $user->isAdmin() && ! $user->isToChuc())) {
            return false;
        }

        $action = $this->input('hanh_dong');

        // Faculty (ToChuc) is strictly forbidden from admin approval actions
        if ($user->isToChuc() && ! $user->isAdmin()) {
            if (in_array($action, ['APPROVE_ADMIN', 'REJECT_ADMIN', 'APPROVE_FACULTY_BY_ADMIN'], true)) {
                throw new BusinessException(
                    'FORBIDDEN',
                    'Đại diện Khoa không có quyền thực hiện thao tác thẩm định của Ban Quản trị P.CTSV.',
                    null,
                    403
                );
            }
        }

        return true;
    }

    public function rules(): array
    {
        $action = $this->input('hanh_dong');

        $rules = [
            'hanh_dong' => [
                'required',
                'string',
                'in:APPROVE_FACULTY,APPROVE_ADMIN,APPROVE_FACULTY_BY_ADMIN,REJECT_FACULTY,REJECT_ADMIN,REQUEST_EDIT',
            ],
            'duyet_luon_cap_phong' => ['sometimes', 'boolean'],
        ];

        if (in_array($action, ['REJECT_FACULTY', 'REJECT_ADMIN'], true)) {
            $rules['ly_do'] = ['required', 'string', 'min:10', 'max:1000'];
        } elseif (in_array($action, ['REQUEST_EDIT', 'APPROVE_FACULTY_BY_ADMIN'], true)) {
            $rules['ly_do'] = ['required', 'string', 'min:5', 'max:1000'];
        } else {
            $rules['ly_do'] = ['nullable', 'string', 'max:1000'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'hanh_dong.required' => 'Hành động thẩm định sự kiện là bắt buộc.',
            'hanh_dong.in' => 'Hành động thẩm định không hợp lệ.',
            'ly_do.required' => 'Lý do là bắt buộc cho thao tác này.',
            'ly_do.string' => 'Lý do phải là chuỗi ký tự.',
            'ly_do.min' => 'Lý do phải có ít nhất :min ký tự.',
            'ly_do.max' => 'Lý do không được vượt quá :max ký tự.',
            'duyet_luon_cap_phong.boolean' => 'Giá trị duyệt luôn cấp phòng không hợp lệ.',
        ];
    }
}
