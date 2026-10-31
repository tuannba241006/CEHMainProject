<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreEventDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isAdmin() || $user->isToChuc());
    }

    public function rules(): array
    {
        return [
            'ten_su_kien' => ['required', 'string', 'min:5', 'max:255'],
            'anh_bia' => ['nullable', 'string', 'max:500'],
            'dien_gia' => ['nullable', 'string', 'max:200'],
            'mo_ta' => ['required', 'string', 'min:10'],
            'lo_trinh' => ['nullable', 'array'],
            'doi_tuong_tham_gia' => ['nullable', 'string', 'max:255'],
            'ma_chuyen_de' => ['required', 'integer', 'min:1', 'exists:chuyen_de,ma_chuyen_de'],
            'ma_phong' => ['required', 'integer', 'min:1', 'exists:phong_hoi_truong,ma_phong'],
            'ngay_cong_bo' => ['required', 'date', 'before_or_equal:thoi_gian_bat_dau'],
            'thoi_gian_bat_dau' => ['required', 'date'],
            'thoi_gian_ket_thuc' => ['required', 'date', 'after:thoi_gian_bat_dau'],
            'khong_gioi_han_slot' => ['required', 'boolean'],
            'so_luong_toi_da' => ['nullable', 'integer', 'min:1'],
            'dieu_khoan_drl' => ['required', 'string', Rule::in(['KhongCo', 'Dieu3', 'Dieu4'])],
            'diem_drl_du_kien' => ['required', 'integer', 'min:0', 'max:5'],
            'gio_tinh_nguyen' => ['nullable', 'numeric', 'min:0', 'max:999.9'],
            'danh_sach_co_host_ids' => ['nullable', 'array'],
            'danh_sach_co_host_ids.*' => ['integer', 'min:1', 'distinct', 'exists:don_vi_to_chuc,ma_don_vi_to_chuc'],
            'ma_don_vi_to_chuc' => ['nullable', 'integer', 'min:1', 'exists:don_vi_to_chuc,ma_don_vi_to_chuc'],
        ];
    }

    public function messages(): array
    {
        return [
            'ten_su_kien.required' => 'Tên sự kiện không được để trống.',
            'ten_su_kien.min' => 'Tên sự kiện phải có ít nhất 5 ký tự.',
            'mo_ta.required' => 'Mô tả sự kiện không được để trống.',
            'mo_ta.min' => 'Mô tả sự kiện phải có ít nhất 10 ký tự.',
            'ma_chuyen_de.required' => 'Chuyên đề không được để trống.',
            'ma_chuyen_de.exists' => 'Chuyên đề không tồn tại trong hệ thống.',
            'ma_phong.required' => 'Phòng hội trường không được để trống.',
            'ma_phong.exists' => 'Phòng hội trường không tồn tại trong hệ thống.',
            'ngay_cong_bo.required' => 'Ngày công bố không được để trống.',
            'ngay_cong_bo.before_or_equal' => 'Ngày công bố phải nhỏ hơn hoặc bằng thời gian bắt đầu sự kiện.',
            'thoi_gian_bat_dau.required' => 'Thời gian bắt đầu không được để trống.',
            'thoi_gian_ket_thuc.required' => 'Thời gian kết thúc không được để trống.',
            'thoi_gian_ket_thuc.after' => 'Thời gian kết thúc phải diễn ra sau thời gian bắt đầu sự kiện.',
            'khong_gioi_han_slot.required' => 'Cấu hình giới hạn slot không được để trống.',
            'dieu_khoan_drl.required' => 'Điều khoản ĐRL không được để trống.',
            'diem_drl_du_kien.required' => 'Điểm ĐRL dự kiến không được để trống.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $dieuKhoan = $this->input('dieu_khoan_drl');
            $diemDrl = (int) $this->input('diem_drl_du_kien');

            if ($dieuKhoan === 'KhongCo' && $diemDrl !== 0) {
                $v->errors()->add('diem_drl_du_kien', 'Điểm ĐRL phải bằng 0 khi chọn điều khoản KhongCo.');
            }

            if (in_array($dieuKhoan, ['Dieu3', 'Dieu4'], true) && ($diemDrl < 1 || $diemDrl > 5)) {
                $v->errors()->add('diem_drl_du_kien', 'Điểm ĐRL phải từ 1 đến 5 khi chọn Điều 3 hoặc Điều 4.');
            }

            $unlimited = $this->boolean('khong_gioi_han_slot');
            $soLuongToiDa = $this->input('so_luong_toi_da');

            if ($unlimited && $soLuongToiDa !== null) {
                $v->errors()->add('so_luong_toi_da', 'Bắt buộc để trống số lượng tối đa khi sự kiện không giới hạn slot.');
            }

            if (! $unlimited && ($soLuongToiDa === null || (int) $soLuongToiDa < 1)) {
                $v->errors()->add('so_luong_toi_da', 'Bắt buộc nhập số lượng vé tối đa lớn hơn 0 khi sự kiện có giới hạn slot.');
            }

            // Kiểm tra trùng Host A và Co-hosts
            $user = $this->user();
            $hostUnitId = ($user && $user->isAdmin() && $this->filled('ma_don_vi_to_chuc'))
                ? (int) $this->input('ma_don_vi_to_chuc')
                : (int) ($user?->ma_don_vi_to_chuc ?? 0);

            $coHostIds = $this->input('danh_sach_co_host_ids', []);
            if (is_array($coHostIds) && $hostUnitId > 0 && in_array($hostUnitId, array_map('intval', $coHostIds), true)) {
                $v->errors()->add('danh_sach_co_host_ids', 'Đơn vị đồng tổ chức không được trùng với đơn vị chủ trì.');
            }
        });
    }
}
