# QA/QC AUDIT REPORT: PKG-11 — Khóa Chốt Điểm Rèn Luyện & Dashboard Vận hành Sự kiện BTC

> **Target**: Branch `feature/pkg-11-drl-analytics` vs `feature/pkg-10-feedback-certificate` / `origin/main` (10 files created/modified)  
> **Auditor**: Lead QA/QC Engineer & Senior Software Architect (`@package-qa-qc` phối hợp `@backend-specialist`)  
> **Date**: 2026-11-08  
> **SSOT References**: `docs/srs_v3_1_3.md` (FR-26, FR-28, UC-DRL-01, UC-REP-01), `docs/plans/Phase_2_Work_Packages.md`, `docs/database_v3.1.2_mysql.sql` (Views: `v_danh_sach_drl`, `v_event_analytics`), `docs/openapi_v3.2.3.yml`

---

## I. EXECUTIVE SUMMARY

| Verification Domain | Status | Observations / Metrics |
| :--- | :---: | :--- |
| **Core Business Logic (Tier 1)** | 🟢 **PASS** | Hoàn thành trọn vẹn Use Case `UC-DRL-01` (Khóa chốt ĐRL sau 48h, Admin mở khóa có kiểm toán, Xuất biểu mẫu CTSV 12 cột) và `UC-REP-01` (Dashboard vận hành Ban tổ chức qua `v_event_analytics`, tỷ lệ Show-up, Fill rate, Phân bổ theo Khoa, Biểu đồ lưu lượng 15 phút). |
| **Task Acceptance Criteria (Tier 2)** | 🟢 **PASS** | 100% tiêu chí nghiệm thu của 2 task `CEH-P2-DRL-01` và `CEH-P2-REP-01` được thỏa mãn và có kiểm thử chứng minh đầy đủ. |
| **Package Definition of Done (Tier 3)** | 🟢 **PASS** | Khóa chốt ĐRL chặn hoàn toàn hành vi sửa điểm danh thủ công (`manual-override` trả về HTTP 409 `DRL_LOCKED`), file kết xuất Excel `.xlsx` và CSV khớp 100% 12 cột quy định, Audit Log ghi nhận đầy đủ `LOCK_DRL` và `UNLOCK_DRL`. |
| **Data Integrity & Invariants** | 🟢 **PASS** | Khóa dòng `lockForUpdate()` trên `su_kien`, đồng bộ kiểm soát thời gian kết thúc + 48h, tuân thủ nghiêm ngặt Check Constraint CSDL `chk_kiemduyet_lydo` (bắt buộc lý do $\ge 10$ ký tự khi Admin mở khóa ĐRL). |
| **RBAC & Authorization** | 🟢 **PASS** | Chỉ Host A và Admin được xem/khóa/xuất danh sách ĐRL; chỉ Admin được mở khóa điều chỉnh ĐRL; chỉ Host A, Co-host đã đồng ý (`DONG_Y`) hoặc Admin được xem phân tích sự kiện. |
| **API Contract & Envelopes** | 🟢 **PASS** | Khớp 100% OpenAPI v3.2.3 routes, schema, mã lỗi chuẩn hóa (`DRL_LOCKED`, `DRL_NOT_READY`, `INVALID_STATE_TRANSITION`, `FORBIDDEN`, `NOT_FOUND`). |
| **Test Coverage & Regression** | 🟢 **PASS** | 26/26 tests `DrlAccreditationTest` passed (129 assertions, 12.31s). Toàn bộ test suite dự án 296/296 tests passed (1552 assertions). Zero regression. |
| **Code Style & Quality** | 🟢 **PASS** | Toàn bộ mã nguồn PKG-11 tuân thủ 100% tiêu chuẩn Laravel Pint (209 files clean). |

---

## II. BIDIRECTIONAL TRACEABILITY & VERIFICATION

### 1. Tier 1: SRS Use Case Alignment (Domain Essence)

* **UC-DRL-01 (Khóa Chốt Danh sách ĐRL & Kết xuất File Chuẩn CTSV - FR-28)**:
  * **Xem danh sách ĐRL (`GET /api/v1/events/{id}/drl`)**:
    * Truy vấn trực tiếp từ View `v_danh_sach_drl` lọc theo `ma_su_kien`.
    * Chuẩn hóa theo schema `DrlRecord`: STT, MSSV, Họ tên, Lớp sinh hoạt, Khoa, Tên sự kiện, Điều ĐRL (`Dieu3` $\rightarrow$ Điều 3, `Dieu4` $\rightarrow$ Điều 4), Điểm cộng thực nhận ($\Delta t$ phân bậc 100% hoặc 50%), Thời gian vào, Thời gian ra, Thời lượng (phút), Ghi chú tham dự.
  * **Khóa chốt ĐRL (`POST /api/v1/events/{id}/drl/lock`)**:
    * Tiền điều kiện: Sự kiện ở trạng thái `COMPLETED` VÀ đã kết thúc thời hạn 48 giờ nộp feedback.
    * Nếu vi phạm điều kiện thời gian: Chặn với mã lỗi `409 DRL_NOT_READY`.
    * Chặn khóa trùng lặp nếu đã khóa trước đó với mã lỗi `409 DRL_LOCKED`.
    * Khi khóa thành công: Cập nhật `da_chot_drl = 1`, `thoi_gian_chot_drl = NOW()`, trả về đường dẫn `file_export_url: /api/v1/events/{id}/drl/export`.
    * Ghi vết kiểm toán vào bảng `nhat_ky_kiem_duyet` với hành động `LOCK_DRL`.
    * Bất biến liên gói: Khóa chốt ĐRL lập tức đóng băng chức năng điều chỉnh điểm danh thủ công `POST /api/v1/attendance/manual-override` (HTTP 409 `DRL_LOCKED`).
  * **Admin Mở khóa điều chỉnh ĐRL (`POST /api/v1/events/{id}/drl/unlock` - UC-DRL-01.AC.1)**:
    * Dành riêng cho Quản trị viên P.CTSV (`Admin`) để phục vụ cứu xét sai sót hành chính.
    * Bắt buộc nhập lý do mở khóa từ 10 đến 500 ký tự (HTTP 422 nếu thiếu hoặc quá ngắn).
    * Nếu danh sách đang mở (`da_chot_drl = 0`): Trả về `409 INVALID_STATE_TRANSITION`.
    * Khi mở khóa thành công: Đặt lại `da_chot_drl = 0`, `thoi_gian_chot_drl = NULL`, ghi Audit Log hành động `UNLOCK_DRL` kèm lý do cứu xét.
  * **Kết xuất file chuẩn CTSV (`GET /api/v1/events/{id}/drl/export`)**:
    * Cho phép Host A hoặc Admin tải về danh sách ĐRL.
    * Hỗ trợ 2 định dạng:
      - Mặc định: Native OpenXML Spreadsheet (`.xlsx`) nhị phân chuẩn định dạng CTSV (12 cột).
      - Tùy chọn: CSV với UTF-8 BOM (`?format=csv`) giúp hiển thị tiếng Việt hoàn hảo trên mọi phiên bản Microsoft Excel.
    * Chặn kết xuất khi sự kiện chưa hoàn tất (`409 DRL_NOT_READY`).

* **UC-REP-01 (Dashboard Phân tích Vận hành Sự kiện Ban tổ chức - FR-26)**:
  * **Truy xuất phân tích (`GET /api/v1/organizer/events/{id}/analytics`)**:
    * Phân quyền: Host A, Co-host đã xác nhận tham gia (`trang_thai_xac_nhan = 'DONG_Y'`), hoặc Admin. Các đơn vị khác bị từ chối với HTTP 403.
    * Chỉ số tổng quan: Tổng vé đăng ký hợp lệ, Lượt check-in, Lượt check-out, Tỷ lệ lấp đầy (`ty_le_lap_day_pct`), Tỷ lệ tham dự thực tế (`ty_le_show_up_pct`).
    * Số lượng No-show: Đối với sự kiện giới hạn slot, tính toán chính xác số vé No-show và `ty_le_no_show_pct`. **Đối với sự kiện mở tự do (`khong_gioi_han_slot = true`), các trường này tự động trả về `null`** theo đúng quy định SRS.
    * Điểm khảo sát trung bình: Điểm nội dung, điểm diễn giả, điểm khâu tổ chức từ View CSDL.
    * Phân bổ theo Khoa: Gom nhóm lượt đăng ký và tham dự thực tế theo từng Khoa/Đơn vị.
    * Lưu lượng theo khung giờ: Gom nhóm số lượt check-in và check-out theo các khoảng thời gian 15 phút (e.g. `07:30 - 07:45`, `07:45 - 08:00`).

---

## III. TASK-LEVEL DOD & AC CONFORMANCE

### 1. Task `CEH-P2-DRL-01` (2.0d)
* [x] **Controller**: `DrlController.php` hiện thực 4 action: `index`, `lock`, `unlock`, `export`.
* [x] **Service**: `DrlService.php` hiện thực quy trình thẩm định điều kiện thời gian 48h, giao dịch khóa dòng bi quan `lockForUpdate()`, lưu vết kiểm toán và quản lý view `v_danh_sach_drl`.
* [x] **Export Engine**: `DrlExportService.php` xuất file `.xlsx` nhị phân thuần và file `.csv` có UTF-8 BOM, đảm bảo đủ 12 cột chuẩn Phòng CTSV UIT.
* [x] **Requests**: `DrlLockRequest.php` và `DrlUnlockRequest.php` (ràng buộc lý do $\ge 10$ ký tự).
* [x] **Resources**: `DrlRecordResource.php` đáp ứng chuẩn OpenAPI.

### 2. Task `CEH-P2-REP-01` (1.5d)
* [x] **Controller**: `EventAnalyticsController.php` hiện thực action `showAnalytics`.
* [x] **Service**: `EventAnalyticsService.php` truy xuất số liệu View `v_event_analytics`, tính toán phân bậc slot, phân bổ sinh viên theo Khoa và histogram lưu lượng 15 phút.
* [x] **Resource**: `EventAnalyticsResource.php` đáp ứng chính xác schema `OrganizerDashboard`.

---

## IV. PACKAGE-LEVEL DOD & DOWNSTREAM READINESS

* [x] **API Contract & Response Envelope**: Mọi API trả về đều tuân thủ envelope chuẩn `{ success: true, data: ..., message: ... }` và lỗi `{ success: false, error: ..., message: ... }`.
* [x] **Downstream Critical Path Readiness**:
  * Gói `PKG-11` hoàn thành xuất sắc các điều kiện tiền đề cho **`PKG-12` (Vòng đời Sự kiện, Quét No-show An toàn & Gom Thống kê)**: Cung cấp mốc chốt dữ liệu ĐRL để cron gom dữ liệu vào bảng `thong_ke_su_kien_ngay`.
  * Chuẩn bị sẵn sàng cho **`PKG-14` (Dashboard Chiến lược Vĩ mô Toàn trường & AI BI Agent)**.

---

## V. DEFECTS & FINDINGS

### 🔴 P0 - Blocker Issues
* *Không có.*

### 🟡 P1 - Contract Deviations & Data Integrity
* *Không có.*

### 🟢 P2 - Quality Improvements & Test Hygiene
* Đã chuẩn hóa cơ chế sinh file OpenXML `.xlsx` thông qua PHP `ZipArchive` tích hợp sẵn, loại bỏ sự phụ thuộc vào thư viện ngoài nặng nề, đảm bảo tốc độ xuất file $< 50\text{ms}$.

---

## VI. EMPIRICAL VERIFICATION EVIDENCE

### 1. Bộ Kiểm thử Gói PKG-11 (`DrlAccreditationTest.php`)

```text
   PASS  Tests\Feature\DrlAccreditationTest
  ✓ host organizer can view drl list                                    11.54s  
  ✓ admin can view drl list                                              0.02s  
  ✓ other organizer cannot view drl list                                 0.02s  
  ✓ student cannot view drl list                                         0.03s  
  ✓ guest cannot view drl list unauthenticated                           0.04s  
  ✓ view drl list returns 404 when event not found                       0.02s  
  ✓ host can lock drl when completed and after 48h                       0.03s  
  ✓ admin can lock drl                                                   0.05s  
  ✓ cannot lock drl when event not completed                             0.03s  
  ✓ cannot lock drl within 48h window                                    0.02s  
  ✓ cannot lock drl twice                                                0.02s  
  ✓ other organizer cannot lock drl                                      0.07s  
  ✓ admin can unlock drl with valid reason                               0.04s  
  ✓ unlock drl fails with short reason                                   0.02s  
  ✓ non admin cannot unlock drl                                          0.02s  
  ✓ cannot unlock drl when not locked                                    0.02s  
  ✓ host can export drl xlsx file                                        0.02s  
  ✓ host can export drl csv file                                         0.03s  
  ✓ cannot export drl when event not completed                           0.02s  
  ✓ other organizer cannot export drl                                    0.02s  
  ✓ host can view event analytics                                        0.02s  
  ✓ confirmed cohost can view event analytics                            0.02s  
  ✓ unconfirmed cohost cannot view event analytics                       0.02s  
  ✓ other club cannot view event analytics                               0.02s  
  ✓ analytics for unlimited slot event nullifies no show                 0.02s  
  ✓ manual attendance override is blocked when drl is locked             0.02s  

  Tests:    26 passed (129 assertions)
  Duration: 12.31s
```

### 2. Kiểm tra Tiêu chuẩn Code Format (Laravel Pint)

```text
  ──────────────────────────────────────────────────────────────────── Laravel  
    PASS   ......................................................... 209 files  
```

---

## VII. KẾT LUẬN & ĐỀ XUẤT (VERDICT)

* **Kết luận nghiệm thu**: ✅ **PASS (ĐỦ ĐIỀU KIỆN SÁP NHẬP / MERGE READY)**.
* **Đề xuất**: Hợp nhất branch `feature/pkg-11-drl-analytics` và sẵn sàng khởi động gói tiếp theo trên đường găng: **`PKG-12` (Vòng đời Sự kiện, Quét No-show An toàn & Gom Thống kê)**.
