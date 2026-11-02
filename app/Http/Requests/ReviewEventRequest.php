<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ReviewEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isAdmin() || $user->isToChuc());
    }

    public function rules(): array
    {
        $rules = [
            'ly_do' => ['nullable', 'string', 'max:1000'],
            'duyet_khan_cap' => ['sometimes', 'boolean'],
        ];

        if ($this->routeIs('events.reject-faculty')
            || $this->routeIs('events.reject-admin')) {
            $rules['ly_do'] = ['required', 'string', 'min:10', 'max:1000'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'ly_do.string' => 'Lý do phải là chuỗi ký tự.',
            'ly_do.max' => 'Lý do không được vượt quá 1000 ký tự.',
            'duyet_khan_cap.boolean' => 'Thông tin duyệt khẩn cấp không hợp lệ.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $isEmergency = $this->boolean('duyet_khan_cap');

            if (! $isEmergency) {
                return;
            }

            if (! $this->user()?->isAdmin()) {
                $validator->errors()->add(
                    'duyet_khan_cap',
                    'Chỉ Admin mới được yêu cầu duyệt khẩn cấp.'
                );

                return;
            }

            $reason = trim((string) $this->input('ly_do', ''));

            if (mb_strlen($reason) < 10) {
                $validator->errors()->add(
                    'ly_do',
                    'Lý do duyệt khẩn cấp phải có ít nhất 10 ký tự.'
                );
            }
        });
    }
}
