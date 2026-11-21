# QA/QC AUDIT REPORT: PKG-10 — Khảo sát Đánh giá Sự kiện 48h & Cấp Chứng nhận số e-Certificate HMAC

> **Target**: Branch `feature/pkg-10-feedback-certificate` vs `origin/main` (11 files created/modified)  
> **Auditor**: Lead QA/QC Engineer & Senior Software Architect (`@package-qa-qc` phối hợp `@backend-specialist`)  
> **Date**: 2026-11-07  
> **SSOT References**: `docs/srs_v3_1_3.md` (FR-24, FR-25, UC-FEED-01, UC-CERT-01, NFR-SEC-02, NFR-SEC-04), `docs/plans/Phase_2_Work_Packages.md`, `docs/database_v3.1.2_mysql.sql`, `docs/openapi_v3.2.3.yml`

---

## I. EXECUTIVE SUMMARY

| Verification Domain | Status | Observations / Metrics |
| :--- | :---: | :--- |
| **Core Business Logic (Tier 1)** | 🟢 **PASS** | Hoàn thành trọn vẹn Use Case `UC-FEED-01` (Khảo sát 48h, Ân hạn 24h, Mở khóa ĐRL) và `UC-CERT-01` (Cấp e-Certificate HMAC-SHA256, Xác thực công khai che mờ PII Nghị định 13/2023/NĐ-CP, Thu hồi chứng nhận). |
| **Task Acceptance Criteria (Tier 2)** | 🟢 **PASS** | 100% tiêu chí nghiệm thu của 2 task `CEH-P2-FEED-01` và `CEH-P2-CERT-01` được thỏa mãn và có kiểm thử chứng minh đầy đủ. |
| **Package Definition of Done (Tier 3)** | 🟢 **PASS** | Bảo mật mã hóa HMAC-SHA256 chống làm giả, bảo vệ PII công khai theo Nghị định 13/2023/NĐ-CP, tuân thủ nghiêm ngặt các Database Check Constraints (`chk_dangky_feedback`, `chk_dangky_drl`, `chk_chungnhan_thuhoi`), Audit Log đầy đủ (`GRANT_FEEDBACK_GRACE`, `REVOKE_CERTIFICATE`). |
| **Data Integrity & Invariants** | 🟢 **PASS** | Khóa dòng `selectForUpdate()` trên vé và chứng nhận, tính lũy kế đánh giá sự kiện `danh_gia_trung_binh`, phòng thủ IDOR và Race Condition trong cấp/thu hồi chứng nhận. |
| **RBAC & Authorization** | 🟢 **PASS** | Chỉ Sinh viên sở hữu vé đã check-out hợp lệ mới được gửi Feedback và nhận Certificate; chỉ Quản trị viên (`Admin`) được cấp ân hạn 24h hoặc thu hồi chứng nhận. |
| **API Contract & Envelopes** | 🟢 **PASS** | Khớp 100% OpenAPI v3.2.3 routes, schema, mã lỗi chuẩn hóa (`FEEDBACK_WINDOW_CLOSED`, `EVENT_NOT_COMPLETED`, `CHECKOUT_REQUIRED`, `ZERO_DRL_INELIGIBLE`, `FEEDBACK_ALREADY_SUBMITTED`, `DRL_ALREADY_LOCKED`, `NOT_ELIGIBLE_FOR_CERTIFICATE`, `CERTIFICATE_REVOKED`). |
| **Test Coverage & Regression** | 🟢 **PASS** | 26/26 tests `FeedbackAndCertificateTest` passed (85 assertions, 12.84s). Toàn bộ test suite dự án 270/270 tests passed (1423 assertions, 73.79s). Zero regression. |
| **Code Style & Quality** | 🟢 **PASS** | Toàn bộ mã nguồn PKG-10 tuân thủ 100% tiêu chuẩn Laravel Pint (199 files clean). |

---

## II. BIDIRECTIONAL TRACEABILITY & VERIFICATION

### 1. Tier 1: SRS Use Case Alignment (Domain Essence)

* **UC-FEED-01 (Khảo sát Đánh giá Sự kiện & Cứu xét Ân hạn - FR-24)**:
  * **Nộp đánh giá (`POST /api/v1/events/{id}/feedback`)**:
    * Chỉ cho phép sinh viên đã hoàn thành check-out (`da_check_out = 1`) và có mức hưởng ĐRL hợp lệ (`ti_le_drl > 0`).
    * Chặn nộp trùng lặp nếu đã đánh giá (`da_feedback = 1`) với mã lỗi `FEEDBACK_ALREADY_SUBMITTED` (409 Conflict).
    * Giới hạn thời gian khảo sát: Bắt buộc trong vòng 48h kể từ `thoi_gian_ket_thuc` của sự kiện (`FEEDBACK_WINDOW_CLOSED`, 403 Forbidden).
    * Khi nộp thành công: Tự động cập nhật `da_feedback = 1`, `thoi_gian_feedback = NOW()`, kích hoạt cờ `du_dieu_kien_drl = 1`.
    * Tự động tính toán lại điểm đánh giá trung bình `danh_gia_trung_binh` và `tong_so_danh_gia` của sự kiện.
  * **Cấp ân hạn khảo sát (`POST /api/v1/admin/tickets/{id}/feedback-grace`)**:
    * Dành riêng cho Quản trị viên (`Admin`) để cứu xét các trường hợp đặc biệt quá hạn 48h.
    * Kiểm tra điều kiện: Vé chưa được nộp feedback, đã check-out hợp lệ, sự kiện chưa bị khóa chốt ĐRL (`da_chot_drl = 0`).
    * Khi cấp ân hạn: Gia hạn `han_chot_feedback = NOW() + 24h` trên bản ghi `dang_ky`.
    * Ghi vết đầy đủ vào `nhat_ky_kiem_duyet` với hành động `GRANT_FEEDBACK_GRACE` và lý do cứu xét (tối thiểu 5 ký tự).
    * Sinh viên được cấp ân hạn có thể nộp khảo sát thành công trong vòng 24h bổ sung.

* **UC-CERT-01 (Cấp e-Certificate, Xác thực Công khai Che mờ PII & Thu hồi - FR-25, NFR-SEC-02, NFR-SEC-04)**:
  * **Cấp e-Certificate (`POST /api/v1/tickets/{id}/certificate`)**:
    * Kiểm tra điều kiện: Sinh viên đã hoàn tất check-out, đã nộp khảo sát (`da_feedback = 1`), và đủ điều kiện ĐRL (`du_dieu_kien_drl = 1`, `ti_le_drl >= 0.5`).
    * Tính lũy tiến và bảo toàn Idempotency: Nếu chứng nhận đã tồn tại và chưa bị thu hồi, trả về bản ghi hiện tại mà không cấp mới trùng lặp.
    * Tạo mã định danh duy nhất `ma_chung_nhan` dạng UUID v4 và chữ ký bảo mật HMAC-SHA256:
      $$\text{signature} = \text{hash\_hmac}('sha256', \text{ticket\_id} \parallel \text{user\_id} \parallel \text{event\_id} \parallel \text{uuid}, \text{APP\_KEY})$$
    * Trả về chi tiết chứng nhận kèm liên kết xác thực công khai `verify_url`.
  * **Xác thực công khai (`GET /api/v1/certificates/verify/{hash}`)**:
    * Endpoint mở công khai (Public, không yêu cầu xác thực người dùng).
    * Áp dụng quy chuẩn che mờ thông tin định danh cá nhân (PII) theo **Nghị định 13/2023/NĐ-CP**:
      * Họ tên sinh viên: Che mờ các ký tự giữa của tên lót và tên chính, giữ họ và các ký tự đầu/cuối (ví dụ: `Nguyễn Văn An` $\rightarrow$ `Nguyễn V** A`).
      * Mã số sinh viên (MSSV): Giữ 4 ký tự đầu, che mờ phần còn lại (ví dụ: `22521234` $\rightarrow$ `2252****`).
    * Khi chứng nhận bị thu hồi (`da_thu_hoi = true`):
      * Trạng thái trả về: `da_thu_hoi: true`.
      * Tất cả thông tin PII, tên sự kiện, đơn vị tổ chức, ngày cấp đều trả về `null` để bảo vệ quyền riêng tư tuyệt đối.
      * Không làm lộ lý do thu hồi nội bộ trên giao diện công khai.
  * **Tải xuống chứng nhận PDF (`GET /api/v1/certificates/{id}/download`)**:
    * Cho phép sinh viên sở hữu hoặc Ban tổ chức tải bản PDF vector tiêu chuẩn (PDF-1.4).
    * Tự động từ chối tải file khi chứng nhận đã bị thu hồi (`CERTIFICATE_REVOKED`, 410 Gone).
  * **Thu hồi chứng nhận (`POST /api/v1/admin/certificates/{id}/revoke`)**:
    * Dành riêng cho `Admin`.
    * Cập nhật `da_thu_hoi = 1`, `thoi_gian_thu_hoi = NOW()`, `ly_do_thu_hoi` (tối thiểu 5 ký tự).
    * Ghi vết kiểm toán vào `nhat_ky_kiem_duyet` với hành động `REVOKE_CERTIFICATE`.
    * Vô hiệu hóa vĩnh viễn việc cấp lại hoặc tải file PDF của chứng nhận đó.

---

## III. TASK-LEVEL DOD & AC CONFORMANCE

### 1. Task `CEH-P2-FEED-01` (1.5d)
* [x] **Controller**: `FeedbackController.php` hiện thực 2 action: `submitFeedback` và `grantGrace`.
* [x] **Service**: `FeedbackService.php` hiện thực toàn vẹn quy trình nghiệp vụ kiểm tra 48h, xử lý ân hạn 24h, cập nhật điểm trung bình sự kiện và kích hoạt ĐRL.
* [x] **Requests**: `SubmitFeedbackRequest.php` (kiểm tra điểm 1-5 sao, ý kiến đóng góp tối đa 1000 ký tự) và `FeedbackGraceRequest.php` (kiểm tra lý do cứu xét tối thiểu 5 ký tự).
* [x] **Database Constraints**: Tuân thủ triệt để `chk_dangky_feedback` (`da_check_out = 1` khi `da_feedback = 1`) và `chk_dangky_drl`.

### 2. Task `CEH-P2-CERT-01` (2.0d)
* [x] **Controller**: `CertificateController.php` hiện thực 6 action: `issueOrGet`, `myCertificates`, `downloadPdf`, `verifyPublic`, `adminIndex`, `revoke`.
* [x] **Service**: `CertificateService.php` hiện thực sinh mã UUID, tính chữ ký HMAC-SHA256, sinh file PDF vector nhị phân không phụ thuộc thư viện ngoài, che mờ PII Nghị định 13/2023/NĐ-CP và quản lý danh sách chứng nhận.
* [x] **Resources**: `CertificateResource.php` (chuẩn OpenAPI) và `VerifyCertificateResource.php` (che mờ PII hoặc null khi bị thu hồi).
* [x] **Requests**: `RevokeCertificateRequest.php` (lý do thu hồi tối thiểu 5 ký tự).
* [x] **Audit Logging**: Ghi vết chính xác vào bảng `nhat_ky_kiem_duyet` với các hành động `GRANT_FEEDBACK_GRACE` và `REVOKE_CERTIFICATE`.

---

## IV. PACKAGE-LEVEL DOD & DOWNSTREAM READINESS

* [x] **API Contract & Response Envelope**: Mọi API trả về đều tuân thủ envelope chuẩn `{ success: true, data: ..., message: ... }` và lỗi `{ success: false, error: ..., message: ... }`.
* [x] **Downstream Critical Path Readiness**:
  * Gói `PKG-10` hoàn thành xuất sắc các điều kiện tiền đề cho **`PKG-11` (Khóa Chốt Điểm Rèn Luyện & Dashboard BTC)**: Dữ liệu `du_dieu_kien_drl` và `ti_le_drl` của sinh viên đã được chốt và sẵn sàng để tính điểm và xuất báo cáo CTSV.
  * Cung cấp dữ liệu đánh giá và chứng nhận cho **`PKG-13` (Nền tảng AI Core & Organizer Copilot)** phân tích cảm xúc và tổng hợp ý kiến sinh viên.

---

## V. DEFECTS & FINDINGS

### 🔴 P0 - Blocker Issues
* *Không có.*

### 🟡 P1 - Contract Deviations & Data Integrity
* *Không có.*

### 🟢 P2 - Quality Improvements & Test Hygiene
* **Ghi chú môi trường kiểm thử CI/Docker**: Đã bổ sung cấu hình `force="true"` cho biến môi trường `APP_ENV=testing` trong `backend/phpunit.xml` nhằm đảm bảo tính nhất quán tuyệt đối giữa môi trường container runtime và test runner.

---

## VI. EMPIRICAL VERIFICATION EVIDENCE

### 1. Bộ Kiểm thử Gói PKG-10 (`FeedbackAndCertificateTest.php`)

```text
   PASS  Tests\Feature\FeedbackAndCertificateTest
  ✓ student can submit feedback for completed event within 48h          12.26s  
  ✓ submit feedback fails when event not completed                       0.02s  
  ✓ submit feedback fails when student has not checked out               0.02s  
  ✓ submit feedback fails when student ti le drl is zero                 0.02s  
  ✓ submit feedback fails when student does not own ticket               0.02s  
  ✓ submit feedback fails when already submitted                         0.02s  
  ✓ submit feedback fails when 48h window expired                        0.02s  
  ✓ admin can grant 24h feedback grace period                            0.02s  
  ✓ student can submit feedback within admin granted grace period after… 0.02s  
  ✓ non admin cannot grant feedback grace                                0.02s  
  ✓ grant feedback grace fails if feedback already submitted             0.02s  
  ✓ grant feedback grace fails if event drl locked                       0.02s  
  ✓ student can issue certificate when eligible                          0.02s  
  ✓ issue certificate is idempotent                                      0.02s  
  ✓ cannot issue certificate when not eligible                           0.02s  
  ✓ cannot issue certificate for another students ticket                 0.02s  
  ✓ student can view my certificates                                     0.02s  
  ✓ student can download certificate pdf                                 0.02s  
  ✓ non owner student cannot download certificate pdf                    0.02s  
  ✓ public verification returns masked pii under decree 13               0.02s  
  ✓ public verification returns 404 for unknown hash                     0.02s  
  ✓ admin can revoke certificate                                         0.02s  
  ✓ revoked certificate shows da thu hoi and null pii on public verify   0.02s  
  ✓ cannot download revoked certificate pdf                              0.02s  
  ✓ cannot fetch or reissue revoked certificate                          0.02s  
  ✓ admin can list certificates with filter and search                   0.02s  

  Tests:    26 passed (85 assertions)
  Duration: 12.84s
```

### 2. Toàn bộ Bộ Kiểm thử Dự án (Project-wide Regression Verification)

```text
  Tests:    270 passed (1423 assertions)
  Duration: 73.79s
```

### 3. Kiểm tra Tiêu chuẩn Code Format (Laravel Pint)

```text
  ──────────────────────────────────────────────────────────────────── Laravel  
    PASS   ......................................................... 199 files  
```

---

## VII. KẾT LUẬN & ĐỀ XUẤT (VERDICT)

* **Kết luận nghiệm thu**: ✅ **PASS (ĐỦ ĐIỀU KIỆN SÁP NHẬP / MERGE READY)**.
* **Đề xuất**: Hợp nhất branch `feature/pkg-10-feedback-certificate` vào `main` và sẵn sàng khởi động **`PKG-11` (Khóa Chốt Điểm Rèn Luyện & Dashboard BTC)**.
