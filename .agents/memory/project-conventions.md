---
type: project
created: 2026-05-25
updated: 2026-10-26
---

# Project Conventions — CampusEventHub Main Project

## 1. Git Workflow
- Luôn tạo nhánh riêng biệt cho các tính năng hoặc bản sửa lỗi: `feature/[task-slug]` hoặc `fix/[bug-slug]`.
- Giữ các commit rõ ràng, nguyên tử (atomic) và tuân thủ Conventional Commits.

## 2. Nền tảng AI được hỗ trợ (AG Kit)
- AG Kit **chỉ hỗ trợ Google Antigravity và Gemini CLI**.
- Không tự ý nới lỏng hay thay đổi quy chuẩn kiểm soát bảo mật của bộ công cụ.

## 3. Kiến trúc Tech Stack Chuẩn mực
- **Dự án**: Campus Event Hub — Nền tảng Đăng ký, Quản lý Sự kiện Sinh viên & Điểm danh Thông minh (IS207 - UIT).
- **Backend**: PHP 8.2+ / **Laravel 12** theo kiến trúc phân tầng (FormRequests, Eloquent ORM, Service Layer, API Resources), Laravel Scheduler, Queue Workers.
- **Database**: **MySQL 8.0+ / MariaDB InnoDB** (ACID, Pessimistic Row-level Locking, Generated Virtual Columns).
- **Frontend**: **React 19 (Vite)**, Tailwind CSS v4, Lucide React, HTML5-QRCode scanner, Screen Wake Lock API.
- **Bảo mật & Phiên làm việc**: Laravel Sanctum (**Single Active Session**, HttpOnly Cookie, CSRF Token), HMAC-SHA256 (mã vé), TOTP RFC 6238 (QR động 30s Kiosk), Device Binding.
- **Test Integrity (Soft Harness)**: Tuân thủ nghiêm ngặt 2 lớp (Permission & Verification) theo `rules/test-integrity-harness.md`. Mọi file test là READ-ONLY trong quá trình sửa bug; nghiệm thu bắt buộc đối soát `git diff -- tests/` = 0 và có log terminal thực thi.

---

## 4. 📐 Coding Style & Consistency Standards

Mọi mã nguồn do AI tạo ra BẮT BUỘC phải đồng bộ 100% với các quy chuẩn:

### A. Naming Conventions
- **PHP (Laravel)**:
  - Models, Controllers, FormRequests, Resources, Jobs, Events, Services: `PascalCase` (e.g. `EventController`, `StoreRegistrationRequest`, `EventResource`, `RegistrationService`).
  - Methods, Functions, Variables: `camelCase` (e.g. `registerEvent()`, `checkInStudent()`, `$activeSession`).
  - Constants: `SCREAMING_SNAKE_CASE` (e.g. `MAX_CAPACITY`, `STATUS_APPROVED`).
  - Database Tables & Columns: `snake_case` (e.g. `su_kien`, `so_ve_con_lai`, `ma_don_vi_cha`, `trang_thai`).
- **JavaScript/React (Frontend)**:
  - Components, Pages: `PascalCase` (e.g. `EventCard.jsx`, `KioskScannerPage.jsx`).
  - Hooks: `camelCase` với tiền tố `use` (e.g. `useEventDetail.js`, `useKioskSession.js`).
  - Variables & Functions: `camelCase` (e.g. `ticketCount`, `handleSubmit()`).

### B. Cấu trúc Thư mục Backend (Laravel 12)
```
app/
├── Http/
│   ├── Controllers/Api/   # Chỉ nhận HTTP Request, gọi Service, trả về Resource
│   ├── Requests/          # FormRequest validation rules & authorization
│   ├── Resources/         # Eloquent API Resources định hình Envelope
│   └── Middleware/        # SingleSession, EnsureRole, Sanctum middleware
├── Models/                # Eloquent models, relationships, casts, scopes
├── Services/              # Nghiệp vụ cốt lõi, DB transactions & locking
├── Jobs/                  # Asynchronous queue jobs (Email, QR, Certificate)
└── Enums/                 # PHP 8.2 Enums cho Trạng thái (EventStatus, Role, v.v.)
routes/
└── api.php                # Định tuyến RESTful API
database/
├── migrations/            # Laravel migration files
└── seeders/               # Database seeders
```

### C. Chuẩn Hóa API Response Envelope
Mọi endpoint trả về từ Laravel API Resources BẮT BUỘC tuân thủ cấu trúc chuẩn:

```json
// Thành công (HTTP 200, 201)
{
  "success": true,
  "data": { ... },
  "message": "Mô tả kết quả tiếng Việt rõ ràng"
}

// Thất bại (HTTP 400, 401, 403, 404, 409, 422, 500)
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_SNAKE_CASE",
    "details": { ... }
  },
  "message": "Thông báo lỗi chi tiết, thân thiện"
}
```

### D. Quy chuẩn RESTful Endpoints
- Endpoint URL: Dùng **danh từ số nhiều** + **kebab-case** (e.g. `/api/events`, `/api/registrations`, `/api/kiosk-sessions`).
- Tuyệt đối không đưa động từ vào URL (❌ `/api/bookTicket`, ✅ `POST /api/registrations`).

---

## 5. 🛡️ 5 Quy tắc Bất biến Cốt lõi (Core Invariants)

1. **Deadlock-Free Lock Ordering Invariant:**
   Mọi Transaction liên quan đến vé và hàng chờ bắt buộc tuân thủ thứ tự khóa dòng:
   $$\mathbf{tai\_khoan} \longrightarrow \mathbf{phong\_hoi\_truong} \longrightarrow \mathbf{dat\_phong} \longrightarrow \mathbf{su\_kien} \longrightarrow \mathbf{dang\_ky} \longrightarrow \mathbf{hang\_doi\_waitlist}$$
   Thực thi trong Laravel: `DB::transaction()` kết hợp `lockForUpdate()`.

2. **Bất biến Sức chứa & Kiểm soát Trùng lịch:**
   $$\text{so\_luong\_toi\_da} = \text{Vé hợp lệ} + \text{Slot OFFERED} + \text{so\_ve\_con\_lai} + \text{so\_slot\_dong\_bang}$$
   Chặn tuyệt đối (Hard Block) khi sinh viên đăng ký sự kiện giới hạn vé bị trùng khung giờ với sự kiện giới hạn vé khác.

3. **Chốt Hủy vé ($T - 4\text{h}$) & Waitlist ($T - 2\text{h}$):**
   - Chỉ được hủy vé khi $\text{NOW()} < \text{thoi\_gian\_bat\_dau} - 4\text{h}$.
   - Hạn chốt nhận vé Waitlist: $\text{han\_chot} = \min(\text{NOW()} + 60\text{ phút}, T - 2\text{h})$.
   - Đóng Waitlist tại mốc $T - 2\text{h}$, thu hồi slot `OFFERED` quá hạn, hoàn trả về `so_ve_con_lai`.

4. **Khung Điểm danh Hai chiều & Công thức $\Delta t$:**
   - Cổng Check-out khóa cứng đến $T_{end} - 25\text{ phút}$.
   - $\Delta t \ge 60\% \rightarrow$ 100% ĐRL | $30\% \le \Delta t < 60\% \rightarrow$ 50% ĐRL | $\Delta t < 30\% \rightarrow$ 0% ĐRL.
   - TOTP QR 30s Kiosk + Single Active Session + Device Binding.

5. **Khảo sát 48h & Chứng nhận Số:**
   - Hoàn thành feedback trong 48h sau sự kiện để đủ điều kiện xét ĐRL.
   - Cấp chứng nhận e-Certificate băm SHA-256 kèm che mờ PII theo Nghị định 13/2023/NĐ-CP.

---

## 6. 🏷️ Quy Chuẩn Định Danh Task ID (Semantic Task ID for Notion)

Mọi tác vụ kỹ thuật phân rã trong dự án BẮT BUỘC tuân thủ định dạng ngữ nghĩa:
$$\mathbf{CEH\text{-}P[Phase]\text{-}[Module]\text{-}[Index]}$$

* **Tiền tố dự án**: `CEH` (Campus Event Hub).
* **Giai đoạn**: `P1`, `P2`, `P3`, v.v.
* **Mã Phân hệ / Loại công việc (Module Codes)**:
  - `MIG`: Database Migrations & Views (Schema DDL).
  - `SED`: Database Seeders (Hạt giống dữ liệu ban đầu).
  - `MOD`: Eloquent Models & Quan hệ thực thể (Relationships, Casts, Scopes).
  - `ARC`: Architecture, Envelopes & Base Classes (Tầng nền tảng kiến trúc).
  - `MID`: Security & RBAC Middleware (Kiểm soát phiên, phân quyền, token).
  - `AUTH`: Authentication & Account APIs (Xác thực, đăng ký, đăng nhập).
  - `EVT`: Event Management APIs (Quản lý và duyệt sự kiện).
  - `BOOK`: Booking & Concurrency Locking (Đặt vé và kiểm soát tải cao).
  - `OPS`: Kiosk & Attendance APIs (Điểm danh hai chiều, Kiosk TOTP).
  - `ADM`: Administration & Internal User APIs (Quản trị hệ thống).
  - `MAIL`: Queue Mailables & Templates (Email tác vụ nền).
  - `TST`: Automated Tests & Postman Collections (Kiểm thử tự động).
* **Số thứ tự**: `01`, `02`, `03`...

