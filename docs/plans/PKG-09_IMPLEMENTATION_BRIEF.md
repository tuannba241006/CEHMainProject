# HƯỚNG DẪN THỰC THI & BÀN GIAO KỸ THUẬT: GÓI CÔNG VIỆC PKG-09
## (PKG-09 IMPLEMENTATION BRIEF & HANDOVER GUIDE)

> **Người lập**: Lead QA/QC Software Architect (`@package-qa-auditor`)  
> **Dự án**: Campus Event Hub (CEH) — Phase 2: Domain Features & Business Logic  
> **Gói công việc**: `PKG-09` — Điểm danh 2 Chiều TOTP, Device Binding & Nhật ký Cứu xét  
> **Nhánh thực hiện**: `feature/pkg-09-self-attendance-device-binding` (phân nhánh từ `origin/main` sau khi merge `PKG-08`)  
> **Tài liệu SSOT đối chiếu**:
> - [`docs/srs_v3_1_3.md`](../srs_v3_1_3.md) (`UC-OPS-03`, `UC-OPS-04`, `FR-21`, `FR-22`)
> - [`docs/plans/Phase_2_Work_Packages.md`](Phase_2_Work_Packages.md) (WBS `CEH-P2-OPS-03`, `CEH-P2-OPS-04`)
> - [`docs/openapi_v3.2.3.yml`](../openapi_v3.2.3.yml) (`/attendance/self-check-in`, `/attendance/self-check-out`, `/attendance/manual-override`)
> - [`docs/database_v3.1.2_mysql.sql`](../database_v3.1.2_mysql.sql) (`dang_ky`, `nhat_ky_diem_danh`, constraint `chk_dangky_diemdanh`)

---

## I. MỤC ĐÍCH TÀI LIỆU & HIỆN TRẠNG KẾ THỪA TỪ PKG-08

### 1. Mục đích
Tài liệu này được lập ra nhằm định hướng cho kỹ sư thực hiện gói **`PKG-09` (Wave 7)**. Trong quá trình phát triển gói `PKG-08` (Hạ tầng Kiosk & Staff Scan), tác giả đã tạo trước một số file khung sườn (scaffolding) cho PKG-09. 

Tài liệu này xác định rõ:
- Những phần **đã có sẵn có thể tái sử dụng**.
- Những phần **bắt buộc phải sửa lại để thỏa mãn nghiệp vụ SSOT**.
- Các **ranh giới an toàn (Guardrails)** để không gây gãy vỡ (regression) gói `PKG-08` đã nghiệm thu.

### 2. Hiện trạng mã nguồn kế thừa
Khoảng 85% số file cần thiết đã được tạo trên codebase, bao gồm:

| Tầng | Tệp tin hiện có | Vai trò | Đánh giá hiện trạng |
| :--- | :--- | :--- | :--- |
| **Controller** | `app/Http/Controllers/Api/SelfAttendanceController.php` | Controller tự điểm danh | Đã có action `selfCheckIn`, `selfCheckOut`, `participants`. |
| **Controller** | `app/Http/Controllers/Api/AttendanceOverrideController.php` | Controller cứu xét thủ công | Đã có action `manualOverride`. |
| **Service** | `app/Services/AttendanceService.php` | Domain service điểm danh 2 chiều | Đã có hàm `checkIn`, `checkOut`, `participants`. **Cần sửa logic gian lận.** |
| **Service** | `app/Services/AttendanceOverrideService.php` | Domain service cứu xét | Đã có hàm `manualOverride`. **Cần bổ sung các invariant checks.** |
| **Service** | `app/Services/AttendanceScoringService.php` | Domain service tính $\Delta t$ | **Hoàn chỉnh 100% (Shared với PKG-08). Không được sửa signature.** |
| **Request** | `app/Http/Requests/SelfCheckInRequest.php` | Validate Check-in | Đã validate `ma_su_kien`, `totp_code`, `device_id`. |
| **Request** | `app/Http/Requests/SelfCheckOutRequest.php` | Validate Check-out | Đã validate `ma_su_kien`, `totp_code`, `device_id`. |
| **Request** | `app/Http/Requests/ManualOverrideRequest.php` | Validate Cứu xét | Cần tinh chỉnh validation rule theo từng trạng thái mới. |
| **Resource** | `app/Http/Resources/ParticipantAttendanceResource.php` | DTO chuyển đổi dữ liệu | Đang dùng chung `StaffScanResource`. Cần tách riêng cho Check-out. |
| **Routes** | `routes/api.php` | Khai báo API endpoints | Đã đăng ký route trong closure `$attendanceRoutes`. |

---

## II. DANH MỤC CÁC ĐIỂM BẮT BUỘC PHẢI SỬA (MANDATORY FIX CHECKLIST)

Mặc dù file đã tồn tại, **logic nghiệp vụ bên trong mới chỉ đi qua happy-path thô và đang trượt các ràng buộc bảo mật / hợp đồng cốt lõi**. Developer khi nhận task bắt buộc phải refactor các mục sau:

### 1. Sửa cơ chế Chặn Quét chéo Thiết bị (Device Binding Anti-Fraud)
* **Căn cứ SSOT**: [`srs_v3_1_3.md` dòng 1244 (UC-OPS-03.EX.1)](../srs_v3_1_3.md#L1244), [`openapi_v3.2.3.yml` dòng 4947-4950](../openapi_v3.2.3.yml#L4947-L4950).
* **Lỗi hiện tại trong `AttendanceService::checkIn`**:
  Hệ thống phát hiện `$suspicious` thì cập nhật cờ vào DB nhưng **vẫn cập nhật trạng thái `DaCheckIn` và trả về HTTP 200 OK**.
* **Yêu cầu sửa**:
  1. Khi phát hiện `$suspicious == true` (thiết bị đã từng dùng cho tài khoản khác trong cùng sự kiện):
     - Ghi nhận ngay `nghi_van_gian_lan = true` và `ma_thiet_bi_nghi_van = $data['device_id']` vào bản ghi `dang_ky` của tài khoản hiện tại (và cả tài khoản trước đó).
     - **CHẶN THAO TÁC QUÉT**: Ném ngoại lệ `BusinessException('DEVICE_ALREADY_USED', 'Thiết bị này đã được dùng để điểm danh cho tài khoản khác. Vui lòng gặp nhân viên soát vé để được đối soát thẻ sinh viên.', null, 403)`.
     - Tuyệt đối **không** chuyển trạng thái vé sang `DaCheckIn`.
  2. Bổ sung kiểm tra Device Binding cho cả hàm `checkOut`:
     - Nếu `device_id` lúc Check-out khác với tài khoản hoặc quét chéo thiết bị, xử lý chặn và gắn cờ tương tự.

---

### 2. Chuẩn hóa Hợp đồng Response Schema cho `POST /attendance/self-check-out`
* **Căn cứ SSOT**: [`openapi_v3.2.3.yml` dòng 5169-5200](../openapi_v3.2.3.yml#L5169-L5200).
* **Lỗi hiện tại trong `SelfAttendanceController::selfCheckOut`**:
  Đang trả về `ParticipantAttendanceResource` kế thừa từ `StaffScanResource`, dẫn đến:
  - Sai tên trường: trả về `trang_thai_ve` (OpenAPI yêu cầu `trang_thai`), `thoi_gian_quet` (OpenAPI yêu cầu `thoi_gian_check_out`).
  - Thiếu hoàn toàn trường `ty_le_tham_du_pct` (Ví dụ: `87.5`).
* **Yêu cầu sửa**:
  - Tạo mới một Resource độc lập: `app/Http/Resources/SelfCheckOutResource.php`.
  - Cấu trúc trả về đúng chuẩn OpenAPI:
    ```json
    {
      "success": true,
      "message": "Điểm danh Check-out thành công",
      "data": {
        "ma_dang_ky": 501,
        "trang_thai": "DaCheckOut",
        "thoi_gian_check_out": "2026-10-25T11:15:00+07:00",
        "thoi_luong_tham_du_phut": 105,
        "ty_le_tham_du_pct": 87.5,
        "ti_le_drl": 1.0
      },
      "server_time": "2026-10-25T11:15:00+07:00"
    }
    ```

---

### 3. Hoàn thiện Logic Nghiệp vụ Cứu xét Thủ công (`AttendanceOverrideService`)
* **Căn cứ SSOT**: [`srs_v3_1_3.md` dòng 1286-1290 (UC-OPS-04)](../srs_v3_1_3.md#L1286-L1290), [`openapi_v3.2.3.yml` dòng 5363-5371](../openapi_v3.2.3.yml#L5363-L5371).
* **Yêu cầu sửa trong `AttendanceOverrideService::manualOverride`**:
  1. **Chặn vé đã hủy (`DaHuy`)**:
     ```php
     if ($ticket->trang_thai === 'DaHuy') {
         throw new BusinessException('INVALID_STATE_TRANSITION', 'Không thể điều chỉnh vé đã bị hủy.', null, 409);
     }
     ```
  2. **Gỡ bỏ trạng thái cảnh báo sau đối soát thẻ SV vật lý**:
     - Reset cờ vi phạm: `vi_pham_no_show = false`.
     - Reset cờ gian lận: `nghi_van_gian_lan = false` và `ma_thiet_bi_nghi_van = null`.
  3. **Gán mốc thời gian sự kiện chuẩn xác (để thỏa `chk_dangky_diemdanh` và View `v_danh_sach_drl`)**:
     - Khi chuyển sang `DaCheckIn`:
       - `thoi_gian_check_in = $ticket->thoi_gian_check_in ?: Carbon::min(now(), $event->thoi_gian_bat_dau);`
       - `thoi_gian_check_out = null;`
       - `ti_le_drl = 0.0;`
     - Khi chuyển sang `DaCheckOut`:
       - `thoi_gian_check_in = $ticket->thoi_gian_check_in ?: $event->thoi_gian_bat_dau;`
       - `thoi_gian_check_out = $ticket->thoi_gian_check_out ?: ($event->thoi_gian_ket_thuc_thuc_te ?: $event->thoi_gian_ket_thuc);`
       - `ti_le_drl = $newRate;` (chọn `1.0` hoặc `0.5`).
  4. **Validation trong `ManualOverrideRequest`**:
     - Nếu `trang_thai_moi == 'DaCheckIn'` $\rightarrow$ `ti_le_drl_moi` bắt buộc bằng `0.0`.
     - Nếu `trang_thai_moi == 'DaCheckOut'` $\rightarrow$ `ti_le_drl_moi` phải là `0.5` hoặc `1.0`.

---

## III. RANH GIỚI BẢO VỆ CHỐNG HỒI QUY (ANTI-REGRESSION GUARDRAILS CHO PKG-08)

Khi thực thi PKG-09, developer **TUYỆT ĐỐI TUÂN THỦ** 3 ranh giới kỹ thuật sau để không làm hỏng gói PKG-08 đã được nghiệm thu:

1. ⛔ **KHÔNG ĐƯỢC THAY ĐỔI SIGNATURE của `AttendanceScoringService::score()`**:
   - `StaffScanService` (thuộc PKG-08) đang inject và sử dụng service này tại dòng 61:
     `$score = $this->scoring->score($event, $ticket, $checkout);`
   - Bất kỳ sự thay đổi tham số hoặc đổi tên key trong mảng kết quả trả về sẽ làm hỏng chức năng Check-out tại bàn đón tiếp của nhân viên soát vé.
2. ⛔ **KHÔNG ĐƯỢC SỬA FILE `StaffScanResource.php`**:
   - Tệp này thuộc sở hữu của PKG-08, phục vụ cho endpoint `/attendance/staff-scan`. Khi cần format dữ liệu mới cho sinh viên tự điểm danh, hãy tạo resource mới hoặc sửa trong `ParticipantAttendanceResource`.
3. ⛔ **BẢO TOÀN ENDPOINT `GET /events/{id}/participants`**:
   - File test của PKG-08 (`KioskAndAttendanceTest.php`) có kịch bản `test_participant_listing_returns_paginated_attendance` kiểm tra endpoint này. Cấu trúc JSON trả về `{ success: true, data: [...], meta: {...} }` phải được giữ nguyên vẹn.

---

## IV. KẾ HOẠCH KIỂM THỬ TỰ ĐỘNG BẮT BUỘC CHO PKG-09

Tác giả PKG-09 phải viết mới toàn bộ file kiểm thử:  
📂 **`backend/tests/Feature/SelfAttendanceAndOverrideTest.php`**

### Danh sách kịch bản kiểm thử bắt buộc:
1. `test_student_can_self_check_in_with_valid_totp_and_device_id`:
   - Sinh viên gửi mã TOTP hợp lệ và `X-Device-Id`. Chuyển thành công sang `DaCheckIn`, HTTP 200.
2. `test_self_check_in_blocks_expired_totp_over_60_seconds`:
   - Mã TOTP cũ quá 60s bị từ chối với `400 TOTP_EXPIRED`.
3. `test_self_check_in_detects_duplicate_device_and_returns_403_device_already_used`:
   - Dùng 1 `device_id` điểm danh cho sinh viên A (thành công). Dùng tiếp `device_id` đó điểm danh cho sinh viên B $\rightarrow$ Bị chặn ngay với HTTP 403 `DEVICE_ALREADY_USED`, cờ `nghi_van_gian_lan = 1` được ghi vào CSDL.
4. `test_student_can_self_check_out_and_calculates_correct_delta_t_thresholds`:
   - Kiểm tra tính đúng 3 mốc tỷ lệ ĐRL (100% khi $\ge 60\%$, 50% khi $30\% \le \Delta t < 60\%$, 0% khi $< 30\%$).
5. `test_manual_override_rejects_cancelled_ticket`:
   - Cứu xét vé `DaHuy` bị từ chối với `409 INVALID_STATE_TRANSITION`.
6. `test_manual_override_clears_no_show_and_fraud_flags_and_writes_audit_log`:
   - Cứu xét vé bị cờ `nghi_van_gian_lan = 1` $\rightarrow$ Cờ được reset về `0`, `ma_thiet_bi_nghi_van` thành `NULL`, tạo đúng 1 bản ghi trong bảng `nhat_ky_diem_danh`.

---

## V. LỆNH XÁC MINH TRƯỚC KHI YÊU CẦU AUDIT QA/QC

Trước khi bàn giao hoặc yêu cầu audit gói PKG-09, developer phải chạy thành công các lệnh kiểm tra sau trong Docker:

```bash
# 1. Chạy test suite mới của PKG-09
docker compose exec -T app php artisan test tests/Feature/SelfAttendanceAndOverrideTest.php

# 2. Chạy test suite của PKG-08 để đảm bảo KHÔNG BỊ HỒI QUY
docker compose exec -T app php artisan test tests/Feature/KioskAndAttendanceTest.php

# 3. Kiểm tra chuẩn định dạng code Laravel Pint
docker compose exec -T app vendor/bin/pint --test

# 4. Kiểm tra TypeScript & build frontend
npm --prefix frontend run lint
npm --prefix frontend run build
```

---

> **LỜI NHẮN TỪ LEAD QA/QC**: Tận dụng triệt để khung sườn đã có từ PKG-08, nhưng hãy xem xét kỹ lưỡng từng dòng code logic liên quan đến Anti-Fraud và Cứu xét kiểm toán. Đây là chốt chặn quan trọng bảo vệ tính công bằng cho Điểm Rèn Luyện toàn trường. Chúc bạn thực thi thành công Wave 7!

