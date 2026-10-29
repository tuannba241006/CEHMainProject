# Campus Event Hub (CEH) — Kế Hoạch Chi Tiết Phase 1: Backend Foundation & Core Security

> **Tài liệu đặc tả**: Phân rã công việc chi tiết Phase 1 (Backend Foundation, Database Migrations, Architecture & Authentication Module)  
> **Dự án**: Campus Event Hub (CEH Main Project) — IS207 UIT  
> **Thời lượng dự kiến**: 10 – 14 ngày làm việc (Sprint 1 & Sprint 2)  
> **Tác giả / Vai trò**: Tech Lead & Senior Project Manager  
> **Căn cứ kỹ thuật**: [`srs_v3_1_3.md`](../srs_v3_1_3.md) (FR-01..06, NFR-SEC-01..04), [`database_v3.1.2_mysql.sql`](../database_v3.1.2_mysql.sql) (24 Bảng 3NF & 3 Views), [`openapi_v3.2.3.yml`](../openapi_v3.2.3.yml) (Tags: `Auth & Account`, `Admin & Organizations`)  
> **Quy chuẩn mã Task (Task ID)**: Chuẩn hóa theo tiền tố `CEH-P1-[MODULE]-[NUM]` để dễ dàng quản lý, lọc và import trực tiếp vào Notion Database/Kanban.  

---

## 1. MỤC TIÊU CỐT LÕI CỦA PHASE 1 (SPRINT GOALS)

1. **Hoàn thiện 100% CSDL trên Laravel**: Chuyển đổi toàn bộ 24 bảng 3NF, 3 Views nghiệp vụ/AI, Generated Virtual Columns, Composite Indexes và Foreign Keys từ SQL DDL sang Laravel Migrations & Seeders chuẩn mực.
2. **Thiết lập Khung Kiến trúc Chuẩn (Clean Architecture & API Envelope)**: Xây dựng Base Controller, Unified API Envelope (`success`, `data`, `error`, `message`, `server_time`), Global Exception Handler bám sát hợp đồng OpenAPI v3.2.3.
3. **Thực thi Bảo mật & Phiên làm việc (Sanctum & RBAC)**: Hiện thực hóa Single Active Session cho `SinhVien`, phân quyền RBAC 4 vai trò, cơ chế chặn cờ `buoc_doi_mat_khau` và mã hóa Bcrypt (`cost = 12`).
4. **Triển khai Trọn vẹn Phân hệ Xác thực & Tài khoản (UC-AUTH-01 $\rightarrow$ UC-AUTH-05)**: Đăng ký sinh viên bằng email `@gm.uit.edu.vn` có đối chiếu MSSV, gửi OTP kích hoạt qua Queue, đăng nhập, đổi mật khẩu và quên mật khẩu.
5. **Đảm bảo Tính toàn vẹn Kiểm thử (Test Integrity Soft Harness)**: 100% Feature Tests chạy tự động, đạt độ bao phủ nghiệp vụ và xuất bản bộ Postman Collection cho Phase 1.

---

## 2. BẢNG TỔNG HỢP TASKS CHO NOTION (NOTION DATABASE IMPORT TABLE)

| Task ID | Tên công việc (Task Name) | Module | Priority | Spec Tracing (SRS / DB / API) | Phụ thuộc (Dependencies) | Effort (Points/Days) |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **`CEH-P1-MIG-01`** | Migrations: Danh mục Đơn vị, Chuyên đề & Hội trường | Database | `P0` | DB: `don_vi_to_chuc`, `chuyen_de`, `phong_hoi_truong` | N/A | 1.5d |
| **`CEH-P1-MIG-02`** | Migrations: Tài khoản, Đăng ký tạm & OTP Quên mật khẩu | Database | `P0` | FR-01, FR-02, DB: `tai_khoan`, `dang_ky_tam_thoi`, `otp_quen_mat_khau` | `CEH-P1-MIG-01` | 1.5d |
| **`CEH-P1-MIG-03`** | Migrations: Sự kiện, Đồng tổ chức, Đặt phòng & Phiên Kiosk | Database | `P0` | FR-07..11, DB: `su_kien`, `su_kien_dong_to_chuc`, `dat_phong`, `phien_kiosk` | `CEH-P1-MIG-02` | 2.0d |
| **`CEH-P1-MIG-04`** | Migrations: Vé Đăng ký, Waitlist FIFO & Nhân viên Check-in | Database | `P0` | FR-14..18, DB: `dang_ky`, `hang_doi_waitlist`, `nhan_vien_check_in` | `CEH-P1-MIG-03` | 1.5d |
| **`CEH-P1-MIG-05`** | Migrations: Feedback, Chứng nhận & Nhật ký Kiểm toán / Điểm danh | Database | `P0` | FR-21..25, DB: `danh_gia_feedback`, `chung_nhan`, `nhat_ky_kiem_duyet`, `nhat_ky_diem_danh` | `CEH-P1-MIG-04` | 1.5d |
| **`CEH-P1-MIG-06`** | Migrations: Thông báo, Thống kê Ngày, Hạ tầng Queue/Cache & 3 Database Views | Database | `P0` | DB: `thong_bao`, `thong_ke_su_kien_ngay`, Views: `v_event_analytics`, `v_feedback_an_danh`, `v_admin_bi_summary` | `CEH-P1-MIG-05` | 1.0d |
| **`CEH-P1-SED-01`** | Database Seeders: Đơn vị UIT, Chuyên đề, Phòng Hội trường & Admin Gốc | Database | `P0` | SRS 1.6 Bootstrapping, UC-ADM-01, DB Data Specs | `CEH-P1-MIG-06` | 1.0d |
| **`CEH-P1-MOD-01`** | Eloquent Models & Quan hệ thực thể (Relationships, Casts, Scopes) | Core | `P0` | 24 Bảng CSDL, PHP 8.3 Types | `CEH-P1-MIG-06` | 2.0d |
| **`CEH-P1-ARC-01`** | Unified API Response Envelope & Global Exception Handler | Architecture | `P0` | OpenAPI Error Schemas, Project Conventions 4.C | N/A | 1.5d |
| **`CEH-P1-ARC-02`** | Cryptography Service (HMAC-SHA256 Signer, Constant-time Verifier & SHA-256 OTP) | Architecture | `P0` | NFR-SEC-02, UC-AUTH-01, UC-OPS-02 | N/A | 1.0d |
| **`CEH-P1-ARC-03`** | Audit Logger Service (Ghi nhật ký bất biến vào `nhat_ky_kiem_duyet`) | Architecture | `P1` | NFR-RELI-01, UC-EVT-03, UC-ADM-01 | `CEH-P1-MOD-01` | 1.0d |
| **`CEH-P1-MID-01`** | Middleware: Single Active Session Enforcement cho Sinh viên | Security | `P0` | NFR-SEC-01, UC-AUTH-02, DB: `sessions` | `CEH-P1-MOD-01` | 1.0d |
| **`CEH-P1-MID-02`** | Middleware: RBAC Role & Organization Scope Guard | Security | `P0` | SRS 1.4 RBAC, OpenAPI `x-roles`, `x-scope` | `CEH-P1-MOD-01` | 1.0d |
| **`CEH-P1-MID-03`** | Middleware: Bắt buộc đổi mật khẩu lần đầu (`buoc_doi_mat_khau`) & Tài khoản Hoạt động | Security | `P0` | UC-AUTH-02, UC-ADM-01, OpenAPI 403 Specs | `CEH-P1-MOD-01` | 0.5d |
| **`CEH-P1-MAIL-01`** | Mail Queue Service & Mailable Templates (Email OTP Đăng ký & Quên mật khẩu) | Service | `P1` | UC-AUTH-01, UC-AUTH-04, Docker Mailpit | N/A | 1.0d |
| **`CEH-P1-AUTH-01`** | API Đăng ký tài khoản Sinh viên & Gửi OTP (Email `@gm.uit.edu.vn` + MSSV) | Auth Module | `P0` | FR-01 (UC-AUTH-01), OpenAPI `/auth/register` | `CEH-P1-ARC-01`, `CEH-P1-MAIL-01` | 1.5d |
| **`CEH-P1-AUTH-02`** | API Gửi lại OTP & Xác thực OTP kích hoạt tài khoản | Auth Module | `P0` | FR-01 (UC-AUTH-01), OpenAPI `/auth/verify-registration-otp` | `CEH-P1-AUTH-01` | 1.0d |
| **`CEH-P1-AUTH-03`** | API Đăng nhập Sanctum SPA Cookie & Khởi tạo Single Active Session | Auth Module | `P0` | FR-02 (UC-AUTH-02), OpenAPI `/auth/login` | `CEH-P1-MID-01` | 1.5d |
| **`CEH-P1-AUTH-04`** | API Đăng xuất an toàn & Lấy thông tin người dùng hiện tại (`/auth/me`) | Auth Module | `P1` | FR-03, FR-05 (UC-AUTH-03, 05), OpenAPI `/auth/me`, `/logout` | `CEH-P1-AUTH-03` | 0.5d |
| **`CEH-P1-AUTH-05`** | API Cập nhật hồ sơ cá nhân & Đổi mật khẩu | Auth Module | `P1` | FR-03 (UC-AUTH-03), OpenAPI `/auth/profile`, `/change-password` | `CEH-P1-AUTH-04` | 1.0d |
| **`CEH-P1-AUTH-06`** | API Quên mật khẩu: Yêu cầu OTP, Xác thực OTP & Đặt lại mật khẩu | Auth Module | `P1` | FR-04 (UC-AUTH-04), OpenAPI `/auth/forgot-password`, `/reset-password` | `CEH-P1-MAIL-01` | 1.5d |
| **`CEH-P1-ADM-01`** | API Cấp phát Tài khoản Nội bộ (BTC/Khoa/Admin) & Quản trị Cây Đơn vị | Admin Module | `P0` | FR-06 (UC-ADM-01), OpenAPI `/admin/users/create-internal` | `CEH-P1-MID-02` | 1.5d |
| **`CEH-P1-TST-01`** | Automated Feature Tests: Auth, Session, RBAC & Validation Rules | QA / Test | `P0` | Test Integrity Harness, PHPUnit / Pest | Hoàn thành Auth APIs | 2.0d |
| **`CEH-P1-TST-02`** | Xuất bản Postman Collection cho Auth & Seed Data Verification | QA / Tooling | `P1` | OpenAPI v3.2.3, Verification Runbook | `CEH-P1-TST-01` | 0.5d |

---

## 3. CHI TIẾT CÁC GÓI CÔNG VIỆC (WORK PACKAGES)

### 📦 WP1.1: Database Migrations & Data Seeding (Toàn bộ 24 Bảng & 3 Views)
> **Mục tiêu**: Xây dựng toàn bộ hệ thống schema CSDL chuẩn mực 3NF bằng Laravel Migrations, bảo đảm 100% khớp nối với [`database_v3.1.2_mysql.sql`](../database_v3.1.2_mysql.sql).

#### `CEH-P1-MIG-01`: Migrations: Danh mục Đơn vị, Chuyên đề & Hội trường
* **Bảng cần tạo**:
  1. `don_vi_to_chuc`: Khóa ngoại tự tham chiếu `ma_don_vi_cha` (NULL = Cấp trường; NOT NULL = CLB trực thuộc Khoa). Unique: `ten_don_vi`, `ma_dinh_danh`.
  2. `chuyen_de`: `ten_chuyen_de`, cờ `da_xoa`.
  3. `phong_hoi_truong`: `co_so` ('CoSo1', 'CoSo2'), `suc_chua_toi_da` (CHECK $\ge 10$), `trang_thai` ('KhaDung', 'BaoTri'), `trang_thiet_bi` (JSON), Check constraint bảo trì hợp lệ.
* **Acceptance Criteria (AC)**:
  - [ ] Migration chạy mượt mà không lỗi cú pháp.
  - [ ] Bật `SET FOREIGN_KEY_CHECKS = 1`, các ràng buộc khóa ngoại và unique index hoạt động chính xác.

#### `CEH-P1-MIG-02`: Migrations: Tài khoản, Đăng ký tạm & OTP Quên mật khẩu
* **Bảng cần tạo**:
  4. `tai_khoan`: `mssv` (8 chữ số, NULL cho tài khoản nội bộ), `email` (Unique), `mat_khau` (Bcrypt), `ma_khoa` (FK tới `don_vi_to_chuc`), `loai_tai_khoan` ('Admin', 'ToChuc', 'SinhVien'), `dong_y_nghi_dinh_13`, `buoc_doi_mat_khau`. Check constraint: `chk_taikhoan_mssv`, `chk_taikhoan_sv_mssv`, `chk_taikhoan_tochuc`.
  5. `dang_ky_tam_thoi`: Bảng đệm chứa thông tin sinh viên chờ nhập OTP, `ma_otp_hash` (CHAR 64 SHA-256), `so_lan_nhap_sai` (CHECK $\le 5$), `so_lan_gui_otp` (CHECK $\le 3$).
  6. `otp_quen_mat_khau`: Bảng quản lý OTP khôi phục mật khẩu, FK tới `tai_khoan`, `so_lan_thu_sai` $\le 5$.
  7. `sessions`: Chuẩn hóa bảng session cho Laravel Sanctum / Database Session driver (`user_id` FK tới `tai_khoan.ma_tai_khoan`).
* **Acceptance Criteria (AC)**:
  - [ ] Sinh viên bắt buộc có MSSV 8 chữ số và `dong_y_nghi_dinh_13 = 1`.
  - [ ] Tài khoản `ToChuc` bắt buộc phải có `ma_don_vi_to_chuc`.

#### `CEH-P1-MIG-03`: Migrations: Sự kiện, Đồng tổ chức, Đặt phòng & Phiên Kiosk
* **Bảng cần tạo**:
  8. `su_kien`: 11 trạng thái (`DRAFT` $\rightarrow$ `COMPLETED`), `khong_gioi_han_slot`, `so_luong_toi_da`, `so_ve_con_lai`, `so_slot_dong_bang`, `thoi_gian_mo_cong_check_in`, `dieu_khoan_drl`, `gio_tinh_nguyen`. Fulltext index trên `ten_su_kien`, `mo_ta`, `dien_gia`.
  9. `su_kien_dong_to_chuc`: Unique composite (`ma_su_kien`, `ma_don_vi_to_chuc`), `trang_thai_xac_nhan` ('CHO_XAC_NHAN', 'DONG_Y', 'TU_CHOI').
  10. `dat_phong`: Quản lý đặt phòng, `han_giu_cho_tam` (Soft Hold 48h), Virtual Columns: `co_pending`, `co_confirmed` kết hợp Unique Index để loại trừ xung đột phòng.
  11. `phien_kiosk`: Quản lý Kiosk Session Token độc lập, `kiosk_token_hash` (Unique), `totp_secret` (RFC 6238), `thoi_gian_het_han`, `da_thu_hoi`.
* **Acceptance Criteria (AC)**:
  - [ ] Bất biến CSDL: `(so_ve_con_lai + so_slot_dong_bang) <= so_luong_toi_da` được đảm bảo bởi Check Constraint.

#### `CEH-P1-MIG-04`: Migrations: Vé Đăng ký, Waitlist FIFO & Nhân viên Check-in
* **Bảng cần tạo**:
  12. `dang_ky`: `ma_ve_uuid` (CHAR 36), `chu_ky_hmac` (CHAR 64), 4 trạng thái ('DaDangKy', 'DaCheckIn', 'DaCheckOut', 'DaHuy'), `ma_thiet_bi_nghi_van`, `nghi_van_gian_lan`, `ti_le_drl`, `han_an_han_feedback`, Virtual Column `ma_tk_hieu_luc` (chặn 1 sinh viên đăng ký nhiều vé hiệu lực cùng sự kiện).
  13. `hang_doi_waitlist`: `so_thu_tu` FIFO, 8 trạng thái ('WAITING', 'OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'SKIPPED_CONFLICT', 'CLOSED_WAITLIST', 'CANCELLED'), `han_chot_xac_nhan`, Virtual Column `ma_tk_dang_cho`.
  14. `nhan_vien_check_in`: Phân quyền Event-scoped Staff (`ma_tai_khoan`, `ma_su_kien`).
* **Acceptance Criteria (AC)**:
  - [ ] Check constraint điểm danh: `DaCheckOut` bắt buộc `da_check_in = 1` và `thoi_gian_check_out >= thoi_gian_check_in`.

#### `CEH-P1-MIG-05`: Migrations: Feedback, Chứng nhận & Nhật ký Kiểm toán / Điểm danh
* **Bảng cần tạo**:
  15. `danh_gia_feedback`: Thang điểm 1-5 cho nội dung, diễn giả, tổ chức; FK tới `dang_ky`.
  16. `chung_nhan`: `ma_hash` HMAC, `da_thu_hoi`, `nguoi_thu_hoi`.
  17. `nhat_ky_kiem_duyet`: 25 hành động kiểm toán (Audit Trail), cho phép `nguoi_thuc_hien = NULL` (Hệ thống tự động).
  18. `nhat_ky_diem_danh`: Lưu vết điều chỉnh điểm danh thủ công, `ti_le_drl_cu`, `ti_le_drl_moi`, `ly_do` $\ge 10$ ký tự.
* **Acceptance Criteria (AC)**:
  - [ ] Mọi hành động từ chối (`REJECT_FACULTY`, `REJECT_ADMIN`) bắt buộc lý do $\ge 10$ ký tự.

#### `CEH-P1-MIG-06`: Migrations: Thông báo, Thống kê Ngày, Hạ tầng Queue/Cache & 3 Database Views
* **Bảng & Views**:
  19. `thong_bao`: Quản lý In-app Notification, 13 loại thông báo.
  20. `thong_ke_su_kien_ngay`: Bảng tổng hợp số liệu cho Báo cáo vĩ mô toàn trường.
  21. `jobs`, `failed_jobs`, `cache`, `cache_locks`: Hạ tầng hàng đợi và khóa bộ nhớ phân tán.
  22. **3 Views CSDL**:
      - `v_event_analytics`: Thống kê tổng hợp số vé, tỷ lệ lấp đầy, số phút cháy vé, điểm feedback trung bình.
      - `v_feedback_an_danh`: Ẩn danh hóa người đánh giá phục vụ Organizer Copilot (`UC-AI-01`).
      - `v_admin_bi_summary`: Dữ liệu phân tích vĩ mô chỉ đọc phục vụ Admin BI Agent (`UC-AI-02`).
* **Acceptance Criteria (AC)**:
  - [ ] Chạy `php artisan migrate:status` hiển thị 100% migrations thành công (Ran).

#### `CEH-P1-SED-01`: Database Seeders: Đơn vị UIT, Chuyên đề, Phòng Hội trường & Admin Gốc
* **Nội dung Seeder**:
  - `DonViToChucSeeder`: Khởi tạo 6 Khoa (Khoa HTTT, KHMT, KTMT, MMT&TT, KTPM, TTĐPT), các Phòng ban (P.CTSV, Đoàn - Hội), và các CLB trực thuộc Khoa (WebDev, AI Club, CyberSecurity...).
  - `ChuyenDeSeeder`: Công nghệ, Học thuật, Kỹ năng mềm, Khởi nghiệp, Tình nguyện.
  - `PhongHoiTruongSeeder`: Hội trường E, Hội trường A, C109, B114 (sức chứa, cơ sở 1/2).
  - `TaiKhoanSeeder`:
    - Admin gốc: `admin@uit.edu.vn` (Mật khẩu mặc định băm Bcrypt, `buoc_doi_mat_khau = 0`).
    - Cán bộ P.CTSV: `pctsv@uit.edu.vn` (`loai_tai_khoan = Admin`).
    - Đại diện Khoa HTTT: `httt@uit.edu.vn` (`loai_tai_khoan = ToChuc`, `ma_don_vi_to_chuc = 1`).
    - Sinh viên mẫu: `22520001@gm.uit.edu.vn` (`mssv = '22520001'`).
* **Acceptance Criteria (AC)**:
  - [ ] Chạy `php artisan db:seed` thành công không phát sinh lỗi trùng lặp dữ liệu.

---

### 📦 WP1.2: Core Architecture, Services & Security Middleware
> **Mục tiêu**: Xây dựng nền tảng kiến trúc phần mềm, bảo mật tầng HTTP và các dịch vụ dùng chung.

#### `CEH-P1-ARC-01`: Unified API Response Envelope & Global Exception Handler
* **Thực hiện**:
  - Tạo trait `App\Http\Controllers\Api\ApiResponseTrait`:
    - `successResponse($data, $message, $code = 200)` kèm `server_time` (ISO 8601).
    - `errorResponse($errorCode, $message, $details = null, $code = 400)`.
  - Cấu hình `bootstrap/app.php` (Laravel 11/12 Exception Handling):
    - `ValidationException` $\rightarrow$ Trả HTTP 422 cấu trúc `{ "success": false, "error": "VALIDATION_ERROR", "details": {...} }`.
    - `AuthenticationException` $\rightarrow$ Trả HTTP 401 `{ "success": false, "error": "UNAUTHENTICATED" }`.
    - `AuthorizationException` $\rightarrow$ Trả HTTP 403 `{ "success": false, "error": "FORBIDDEN" }`.
    - `ModelNotFoundException` $\rightarrow$ Trả HTTP 404 `{ "success": false, "error": "RESOURCE_NOT_FOUND" }`.
    - `ThrottleRequestsException` $\rightarrow$ Trả HTTP 429 `{ "success": false, "error": "RATE_LIMIT_EXCEEDED" }` kèm header `Retry-After`.
* **Acceptance Criteria (AC)**:
  - [x] 100% phản hồi từ API (dù thành công hay ngoại lệ) đều tuân thủ chặt chẽ cấu trúc Unified Envelope chuẩn OpenAPI v3.2.3.

#### `CEH-P1-ARC-02`: Cryptography Service
* **File**: `app/Services/CryptoService.php`.
* **Chức năng**:
  - `signTicket(string $uuid, int $userId, int $eventId): string`: Ghép chuỗi `"{uuid}|{userId}|{eventId}"`, băm HMAC-SHA256 với `config('app.key')`.
  - `verifyTicket(string $signature, string $uuid, int $userId, int $eventId): bool`: So sánh chữ ký an toàn theo thời gian hằng số bằng hàm `hash_equals()`.
  - `hashOtp(string $plainOtp): string`: Băm OTP bằng SHA-256 (`hash('sha256', $plainOtp)`).
* **Acceptance Criteria (AC)**:
  - [x] Chữ ký tạo ra chống giả mạo, `verifyTicket` trả về `false` khi có bất kỳ sai lệch nào.

#### `CEH-P1-ARC-03`: Audit Logger Service
* **File**: `app/Services/AuditLogService.php`.
* **Chức năng**:
  - Hàm `logAudit(string $action, ?int $eventId, ?int $regId, ?int $targetUserId, ?string $prevStatus, ?string $nextStatus, ?string $reason)`: Tự động bắt `auth()->id()`, ghi bản ghi vào bảng `nhat_ky_kiem_duyet`. Nếu chạy trong Queue Worker/Console, gán `nguoi_thuc_hien = NULL`.
* **Acceptance Criteria (AC)**:
  - [x] Các hành động bắt buộc lý do $\ge 10$ ký tự được kiểm tra và chặn nếu truyền lý do rỗng.

#### `CEH-P1-MID-01`: Middleware Single Active Session Enforcement
* **File**: `app/Http/Middleware/EnsureSingleActiveSession.php`.
* **Nghiệp vụ (NFR-SEC-01 & UC-AUTH-02)**:
  - Khi người dùng đăng nhập có `loai_tai_khoan = 'SinhVien'`:
    - Truy vấn bảng `sessions` xóa toàn bộ các session cũ của `user_id` này ngoại trừ ID session hiện tại.
  - Các vai trò `Admin` và `ToChuc` được phép duy trì đa phiên.
* **Acceptance Criteria (AC)**:
  - [x] Sinh viên đăng nhập trên trình duyệt B sẽ tự động làm mất phiên (bị logout) trên trình duyệt A.

#### `CEH-P1-MID-02`: Middleware RBAC Role & Organization Scope Guard
* **File**: `app/Http/Middleware/EnsureUserRole.php`.
* **Nghiệp vụ**:
  - Nhận tham số vai trò: `role:Admin`, `role:Admin,ToChuc`, `role:SinhVien`.
  - Kiểm tra `auth()->user()->loai_tai_khoan`. Nếu không thỏa mãn $\rightarrow$ trả HTTP 403 `FORBIDDEN`.
* **Acceptance Criteria (AC)**:
  - [x] Sinh viên truy cập route Admin bị chặn ngay với HTTP 403.

#### `CEH-P1-MID-03`: Middleware Bắt buộc Đổi mật khẩu lần đầu
* **File**: `app/Http/Middleware/EnsurePasswordChanged.php`.
* **Nghiệp vụ (UC-AUTH-02, UC-ADM-01 & OpenAPI Specification)**:
  - Nếu `auth()->user()->buoc_doi_mat_khau == true`:
    - Cho phép gọi 3 endpoints ngoại lệ: `GET /api/v1/auth/me`, `PUT /api/v1/auth/change-password`, `POST /api/v1/auth/logout`.
    - Toàn bộ các API được bảo vệ khác đều bị chặn cứng với HTTP 403 `{ "success": false, "error": "PASSWORD_CHANGE_REQUIRED", "message": "Bạn bắt buộc phải đổi mật khẩu lần đầu trước khi tiếp tục" }`.
  - Đồng thời kiểm tra cờ `hoat_dong == 1`. Nếu bị khóa bởi Admin $\rightarrow$ trả HTTP 403 `ACCOUNT_LOCKED`.
* **Acceptance Criteria (AC)**:
  - [x] Tài khoản nội bộ mới cấp không thể gọi bất kỳ API nghiệp vụ nào cho đến khi hoàn tất đổi mật khẩu.

---

### 📦 WP1.3: Phân hệ Xác thực & Quản lý Tài khoản (Auth & Account Module)
> **Mục tiêu**: Hiện thực hóa 100% các API thuộc phân hệ Auth theo đặc tả trong SRS và OpenAPI.

#### `CEH-P1-MAIL-01`: Mail Queue Service & Mailable Templates
* **Files**: `app/Mail/RegistrationOtpMailable.php`, `app/Mail/ForgotPasswordOtpMailable.php`.
* **Nội dung**:
  - Giao diện email HTML responsive chuẩn brand CEH (Indigo `#4f46e5`, Font Outfit/Inter).
  - Hiển thị mã OTP 6 số to rõ, thời hạn hiệu lực 10 phút, cảnh báo bảo mật không chia sẻ mã.
  - Sử dụng Laravel Queue (`implements ShouldQueue`) để không làm nghẽn tiến trình HTTP Request.
* **Acceptance Criteria (AC)**:
  - [ ] Kích hoạt gửi mail $\rightarrow$ Job được đẩy vào bảng `jobs` $\rightarrow$ Queue Worker xử lý $\rightarrow$ Email xuất hiện trên Mailpit `http://localhost:8025`.

#### `CEH-P1-AUTH-01`: API Đăng ký tài khoản Sinh viên qua Email OTP
* **Endpoint**: `POST /api/v1/auth/register` (Public).
* **Nghiệp vụ (`UC-AUTH-01`)**:
  - Validation:
    - `ho_ten`: min 2, max 150.
    - `mssv`: regex `^[0-9]{8}$`.
    - `email`: format email, regex `^[0-9]{8}@gm\.uit\.edu\.vn$`.
    - **Ràng buộc logic cốt lõi**: Tiền tố email trước dấu `@` bắt buộc phải trùng tuyệt đối với `mssv` (`email_prefix == mssv`).
    - `dong_y_nghi_dinh_13`: bắt buộc `true`.
    - `mat_khau`: min 8, max 72 ký tự; `xac_nhan_mat_khau` khớp.
  - Kiểm tra tồn tại trong `tai_khoan`: nếu email hoặc MSSV đã tồn tại $\rightarrow$ trả lỗi HTTP 422.
  - Rate limit: tối đa 3 lần gửi OTP trong 10 phút (`chk_tamthoi_gui`).
  - Xử lý: Sinh OTP 6 số, băm SHA-256 lưu vào `dang_ky_tam_thoi`, gửi email OTP qua Queue.
* **Acceptance Criteria (AC)**:
  - [ ] Nhập MSSV `22520001` nhưng email `22520002@gm.uit.edu.vn` bị chặn với lỗi `MSSV_EMAIL_MISMATCH`.
  - [ ] Không tích chọn Nghị định 13 bị chặn với lỗi `ND13_CONSENT_REQUIRED`.

#### `CEH-P1-AUTH-02`: API Gửi lại & Xác thực OTP hoàn tất Đăng ký
* **Endpoints**:
  - `POST /api/v1/auth/resend-registration-otp`
  - `POST /api/v1/auth/verify-registration-otp`
* **Nghiệp vụ (`UC-AUTH-01`)**:
  - Kiểm tra bản ghi trong `dang_ky_tam_thoi`.
  - Nếu `het_han_otp < now()` $\rightarrow$ trả HTTP 400 `OTP_EXPIRED`.
  - Nếu số lần nhập sai $\ge 5$ $\rightarrow$ trả HTTP 400 `OTP_ATTEMPTS_EXCEEDED`.
  - Nếu sai mã OTP $\rightarrow$ tăng `so_lan_nhap_sai`, trả HTTP 400 `OTP_INVALID` kèm số lần thử còn lại.
  - Nếu đúng OTP:
    - Bắt đầu DB Transaction:
      - Tạo bản ghi mới trong `tai_khoan` (`loai_tai_khoan = 'SinhVien'`, `hoat_dong = 1`, `dong_y_nghi_dinh_13 = 1`).
      - Xóa bản ghi trong `dang_ky_tam_thoi`.
    - Trả HTTP 201 kèm dữ liệu tài khoản và thông báo thành công.
* **Acceptance Criteria (AC)**:
  - [ ] Nhập sai 5 lần liên tiếp sẽ khóa bản ghi đăng ký tạm, bắt buộc yêu cầu lại từ đầu.

#### `CEH-P1-AUTH-03`: API Đăng nhập Sanctum SPA Cookie & Single Session
* **Endpoint**: `POST /api/v1/auth/login` (Public).
* **Nghiệp vụ (`UC-AUTH-02`)**:
  - Cho phép đăng nhập bằng `ten_dang_nhap` (MSSV 8 số HOẶC địa chỉ Email trường).
  - Rate limiting chống Brute Force: Tối đa 5 lần thử sai trong 1 phút. Nếu vượt quá $\rightarrow$ tạm khóa 5 phút, trả HTTP 429 `RATE_LIMIT_EXCEEDED` kèm header `Retry-After: 300`.
  - Xác thực mật khẩu qua `Hash::check()`. Nếu sai $\rightarrow$ trả HTTP 401 `INVALID_CREDENTIALS`.
  - Kiểm tra `hoat_dong == 0` $\rightarrow$ trả HTTP 403 `ACCOUNT_LOCKED`.
  - Đăng nhập thành công:
    - Gọi `Auth::login($user)`.
    - Regenerate session ID chống Session Fixation.
    - Kích hoạt Middleware Single Active Session (xóa các session khác của Sinh viên).
    - Trả về HTTP 200 kèm User Resource và `server_time`.
* **Acceptance Criteria (AC)**:
  - [ ] Đăng nhập bằng MSSV hoặc Email đều hoạt động như nhau.
  - [ ] Trả về header `Set-Cookie: laravel_session=...; HttpOnly; SameSite=Lax`.

#### `CEH-P1-AUTH-04`: API Đăng xuất & Lấy thông tin người dùng (`/auth/me`)
* **Endpoints**:
  - `POST /api/v1/auth/logout` (Auth)
  - `GET /api/v1/auth/me` (Auth - Miễn trừ cờ `buoc_doi_mat_khau`)
* **Nghiệp vụ (`UC-AUTH-03`, `UC-AUTH-05`)**:
  - `logout`: Hủy session hiện tại (`Auth::guard('web')->logout()`), xóa session trong database, hủy cookie `laravel_session`.
  - `me`: Trả về thông tin chi tiết của người dùng đang đăng nhập (bao gồm MSSV, vai trò, đơn vị tổ chức, khoa, cờ `buoc_doi_mat_khau`).
* **Acceptance Criteria (AC)**:
  - [ ] Sau khi gọi `/auth/logout`, gọi tiếp `/auth/me` ngay lập tức nhận HTTP 401 `UNAUTHENTICATED`.

#### `CEH-P1-AUTH-05`: API Cập nhật hồ sơ cá nhân & Đổi mật khẩu
* **Endpoints**:
  - `PUT /api/v1/auth/profile` (Auth)
  - `PUT /api/v1/auth/change-password` (Auth - Miễn trừ cờ `buoc_doi_mat_khau`)
* **Nghiệp vụ (`UC-AUTH-03`)**:
  - `change-password`:
    - Yêu cầu: `mat_khau_hien_tai`, `mat_khau_moi` (min 8), `xac_nhan_mat_khau_moi`.
    - Mật khẩu mới không được trùng mật khẩu cũ.
    - Cập nhật mật khẩu mới (Bcrypt `cost = 12`).
    - **Xóa cờ bắt buộc đổi mật khẩu**: `buoc_doi_mat_khau = 0`.
* **Acceptance Criteria (AC)**:
  - [ ] Đổi mật khẩu thành công làm cờ `buoc_doi_mat_khau` chuyển từ `1` sang `0`.

#### `CEH-P1-AUTH-06`: API Quên mật khẩu & Đặt lại mật khẩu qua OTP
* **Endpoints**:
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/verify-forgot-password-otp`
  - `POST /api/v1/auth/reset-password`
* **Nghiệp vụ (`UC-AUTH-04`)**:
  - Sinh OTP 6 số lưu vào bảng `otp_quen_mat_khau` (hiệu lực 10 phút, băm SHA-256).
  - Xác thực đúng OTP $\rightarrow$ cấp `reset_token` dùng 1 lần.
  - Reset password cập nhật mật khẩu mới, đánh dấu `da_su_dung = 1` cho mã OTP.
* **Acceptance Criteria (AC)**:
  - [ ] OTP đã sử dụng hoặc quá 10 phút không thể dùng để reset password.

#### `CEH-P1-ADM-01`: API Cấp phát Tài khoản Nội bộ & Quản trị Cây Đơn vị
* **Endpoint**: `POST /api/v1/admin/users/create-internal` (Chỉ dành cho role `Admin`).
* **Nghiệp vụ (`UC-ADM-01`)**:
  - Admin tạo tài khoản cho Cán bộ / Ban tổ chức / Khoa bằng email trường `@uit.edu.vn`.
  - Bắt buộc gắn với đơn vị tổ chức (`ma_don_vi_to_chuc`).
  - Thiết lập mật khẩu ban đầu và **đánh dấu cờ `buoc_doi_mat_khau = 1`**.
  - Ghi nhật ký kiểm toán vào `nhat_ky_kiem_duyet` với hành động `'GRANT_ORGANIZER'`.
* **Acceptance Criteria (AC)**:
  - [ ] Tài khoản được cấp phát đăng nhập lần đầu tiên có `buoc_doi_mat_khau = true`.

---

### 📦 WP1.4: Automated Tests & Verification (Soft Harness Compliance)
> **Mục tiêu**: Kiểm thử tự động toàn diện, tuân thủ nghiêm ngặt 2 tầng Soft Harness (Permission & Verification).

#### `CEH-P1-TST-01`: Automated Feature Tests cho Toàn bộ Phase 1
* **File test**:
  - `tests/Feature/Auth/RegistrationTest.php`: Kiểm tra toàn bộ luồng đăng ký OTP, chặn sai MSSV, chặn thiếu Nghị định 13, giới hạn gửi OTP.
  - `tests/Feature/Auth/LoginSessionTest.php`: Kiểm tra đăng nhập email/MSSV, Single Active Session (đăng nhập thiết bị mới hủy phiên cũ của sinh viên, giữ đa phiên cho Admin).
  - `tests/Feature/Auth/PasswordEnforcementTest.php`: Kiểm tra chặn 403 khi `buoc_doi_mat_khau = true`, mở khóa sau khi đổi mật khẩu.
  - `tests/Feature/Auth/ForgotPasswordTest.php`: Kiểm tra luồng khôi phục mật khẩu.
  - `tests/Feature/Admin/CreateInternalUserTest.php`: Kiểm tra quyền Admin tạo user nội bộ.
* **Acceptance Criteria (AC)**:
  - [ ] Chạy `php artisan test` đạt **100% Passed**.

#### `CEH-P1-TST-02`: Xuất bản Postman Collection cho Phase 1 & Verification Runbook
* **Deliverable**: File `docs/collections/ceh_phase_1_auth_collection.json`.
* **Kịch bản kiểm thử (Runbook)**:
  1. Chạy lệnh: `php artisan migrate:fresh --seed`.
  2. Chạy test suite: `php artisan test --testsuite=Feature`.
  3. Kiểm tra code styling: `composer run lint`.
* **Acceptance Criteria (AC)**:
  - [ ] Không có lỗi linting, toàn bộ test cases pass.

---

## 4. TIÊU CHÍ HOÀN THÀNH PHASE 1 (DEFINITION OF DONE - DoD)

Phase 1 chính thức hoàn thành khi thỏa mãn toàn bộ các điều kiện nghiệm thu sau:
1. ✅ **Database Migration & Seeders Hoàn Chỉnh**: Chạy `php artisan migrate:fresh --seed` tự động khởi tạo 24 bảng 3NF, 3 Views CSDL và dữ liệu hạt giống ban đầu mà không có bất kỳ lỗi nào.
2. ✅ **100% Auth APIs Sẵn Sàng**: Toàn bộ 11 endpoints của Phân hệ Xác thực & Quản trị tài khoản hoạt động chính xác theo đặc tả OpenAPI v3.2.3.
3. ✅ **Bảo mật Đạt Chuẩn**:
   - Single Active Session hoạt động đúng với vai trò `SinhVien`.
   - Cơ chế chặn đổi mật khẩu lần đầu (`buoc_doi_mat_khau`) chặn đúng mã lỗi `403 PASSWORD_CHANGE_REQUIRED`.
   - Mật khẩu mã hóa Bcrypt `cost = 12`, mã OTP lưu trữ dạng băm SHA-256.
4. ✅ **Test Suite Xanh 100%**: Tất cả các kịch bản kiểm thử tự động của Phase 1 đều pass, log terminal thực tế được đối soát theo đúng Test Integrity Harness.
5. ✅ **Code Format Chuẩn PSR-12**: Chạy `composer run lint` thông qua Pint không có cảnh báo/lỗi định dạng.
