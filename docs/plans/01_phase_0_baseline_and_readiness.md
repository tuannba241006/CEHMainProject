# Campus Event Hub (CEH) — Kế Hoạch Chi Tiết Phase 0: Baseline & Architecture Readiness

> **Tài liệu đặc tả**: Kế hoạch thực thi chi tiết Phase 0 (Baseline & Architecture Readiness)  
> **Dự án**: Campus Event Hub (CEH Main Project) — IS207 UIT  
> **Thời lượng dự kiến**: 3 – 5 ngày làm việc  
> **Người lập**: Tech Lead & Senior Project Manager  
> **Trạng thái**: Sẵn sàng thực thi (Ready for Execution)  

---

## 1. MỤC TIÊU CỐT LÕI CỦA PHASE 0

1. **Khóa Baseline tài liệu (SSOT)**: Đảm bảo tính nhất quán 100% giữa Đặc tả nghiệp vụ ([`srs_v3_1_3.md`](../srs_v3_1_3.md)), CSDL ([`database_v3.1.2_mysql.sql`](../database_v3.1.2_mysql.sql)) và API Contract ([`openapi_v3.2.3.yml`](../openapi_v3.2.3.yml)).
2. **Chuẩn hóa hạ tầng Dev**: Đảm bảo toàn bộ thành viên chỉ cần chạy 1 lệnh `docker-compose up -d` là toàn bộ service (Laravel 12, MySQL 8.4, Nginx, Mailpit) chạy trơn tru.
3. **Mở đường cho Frontend UI/UX**: Dựng OpenAPI Mock Server (Prism) độc lập tại cổng `4010` để đội UI/UX có thể test flow màn hình ngay lập tức.
4. **Thiết lập Quality Gates & Conventions**: Tự động hóa kiểm tra chuẩn code (Pint, ESLint), bảo đảm các quy tắc bất biến (Core Invariants) và Git commit hooks.

---

## 2. BẢNG PHÂN RÃ CÔNG VIỆC CHI TIẾT (WORK BREAKDOWN STRUCTURE)

### 📦 WP0.1: Rà soát & Đồng bộ Nhất quán Tài liệu (Baseline Consistency Audit)

- [ ] **Task 0.1.1: Đối soát Schema CSDL với OpenAPI Models**
  - **Mục tiêu**: Đảm bảo tên cột, kiểu dữ liệu, quan hệ khóa ngoại giữa DB SQL và OpenAPI schemas khớp nhau từng trường một.
  - **Phạm vi kiểm tra**:
    - Bảng người dùng & vai trò: `tai_khoan`, `phan_quyen`, `phien_dang_nhap`.
    - Bảng sự kiện: `su_kien`, `danh_muc`, `phong_hoi_truong`, `dat_phong`.
    - Bảng vé & điểm danh: `dang_ky`, `ve_su_kien`, `hang_doi_waitlist`, `kiosk_session`, `diem_danh`.
  - **Acceptance Criteria (AC)**:
    - [ ] Không có trường nào trong DB bị thiếu hoặc sai lệch kiểu so với schema trong OpenAPI.
    - [ ] Mọi trường ngày giờ đều dùng định dạng chuẩn ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`).

- [ ] **Task 0.1.2: Đối soát Business Rules & Status Enums giữa SRS và OpenAPI**
  - **Mục tiêu**: Đồng bộ toàn bộ các giá trị Enum trạng thái và HTTP error codes.
  - **Phạm vi kiểm tra**:
    - Trạng thái sự kiện: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `PUBLISHED`, `CANCELLED`, `COMPLETED`.
    - Trạng thái vé / đăng ký: `REGISTERED`, `WAITLIST`, `OFFERED`, `CANCELLED`, `ATTENDED`.
    - Cấu trúc Unified Error Envelope:
      ```json
      {
        "success": false,
        "error": { "code": "ERROR_CODE_SNAKE_CASE", "details": {} },
        "message": "Thông báo thân thiện tiếng Việt"
      }
      ```
  - **Acceptance Criteria (AC)**:
    - [ ] 100% mã lỗi và trạng thái trong SRS khớp với định nghĩa OpenAPI.

- [ ] **Task 0.1.3: Xuất bản Biên bản Rà soát Baseline**
  - **Mục tiêu**: Đóng băng baseline kỹ thuật trước khi code.
  - **Deliverable**: File tài liệu `docs/BASELINE_AUDIT_REPORT.md`.

---

### 📦 WP0.2: Chuẩn hóa Môi trường Container & Dev Tooling

- [x] **Task 0.2.1: Hoàn thiện & Tối ưu Dockerfile Backend**
  - **File liên quan**: [`compose.yaml`](../../compose.yaml), `docker/php/Dockerfile`.
  - **Nội dung kỹ thuật**:
    - Cài đặt đầy đủ các PHP extensions: `pdo_mysql`, `mbstring`, `bcmath`, `gd`, `zip`, `opcache`, `pcntl`.
    - Cấu hình phân quyền thư mục `backend/storage` và `backend/bootstrap/cache` cho `www-data`.
    - Đảm bảo cơ chế tự động sinh `APP_KEY` và migrate CSDL an toàn.
  - **Acceptance Criteria (AC)**:
    - [x] Container `app` khởi động thành công không bị exit/restart loop.
    - [x] Gọi `GET http://localhost:8000/api/health` trả về HTTP 200 `{ "status": "ok", "database": "connected" }`.

- [x] **Task 0.2.2: Bổ sung Mailpit Service vào Docker Compose**
  - **Mục tiêu**: Giả lập máy chủ SMTP cục bộ để xem và kiểm tra email xác thực, email vé QR mà không gửi ra Internet.
  - **Cấu hình**: Thêm service `mailpit` vào `compose.yaml`:
    - Port SMTP: `1025`
    - Port Web Dashboard: `8025`
  - **Acceptance Criteria (AC)**:
    - [x] Mở trình duyệt tại `http://localhost:8025` hiển thị giao diện Mailpit Web UI sẵn sàng nhận thư.

- [x] **Task 0.2.3: Chuẩn hóa biến môi trường mẫu (`.env.example`)**
  - **File liên quan**: `backend/.env.example`.
  - **Acceptance Criteria (AC)**:
    - [x] Cung cấp đầy đủ các giá trị mặc định cho MySQL container, Mailpit, Sanctum domain, CORS cấu hình sẵn cho FE port `5173`.

---

### 📦 WP0.3: Dựng OpenAPI Mock Server phục vụ Frontend

- [x] **Task 0.3.1: Tích hợp Prism Mock Server vào Docker Compose**
  - **Mục tiêu**: Cung cấp API Server giả lập chạy thẳng từ [`docs/openapi_v3.2.3.yml`](../openapi_v3.2.3.yml) mà không cần viết code backend.
  - **Cấu hình**: Thêm container `mock-server` (image `stoplight/prism:5`), bind port `4010`.
  - **Acceptance Criteria (AC)**:
    - [x] Gọi `curl http://localhost:4010/api/v1/events` trả về danh sách sự kiện mẫu đúng cấu trúc đặc tả trong OpenAPI.
    - [x] Đội ngũ UI/UX có thể trỏ Frontend prototype vào `http://localhost:4010` để thao tác dữ liệu.

- [x] **Task 0.3.2: Xuất bản Postman / Bruno API Collection**
  - **Mục tiêu**: Cung cấp bộ request có sẵn cho cả team FE, BE và QA.
  - **Deliverable**: File `docs/collections/ceh_api_v3.2.3.postman_collection.json`.
  - **Acceptance Criteria (AC)**:
    - [x] Phân nhóm đầy đủ theo module: Auth, Events, Registrations, Kiosk Check-in, Admin BI.
    - [x] Có sẵn 2 environment: `Local Mock (Port 4010)` và `Local Laravel Dev (Port 8000)`.

---

### 📦 WP0.4: Code Quality Gates, Conventions & Git Workflow

- [x] **Task 0.4.1: Cấu hình Laravel Pint (PHP Linter & Formatter)**
  - **Mục tiêu**: Đảm bảo toàn bộ code Backend tuân thủ nghiêm ngặt PSR-12 và Laravel Conventions.
  - **Thực hiện**:
    - Thêm dependency `laravel/pint` vào `backend/composer.json`.
    - Bổ sung scripts: `"lint": "pint --test"`, `"lint:fix": "pint"`.
  - **Acceptance Criteria (AC)**:
    - [x] Chạy `composer run lint` trong container `app` báo cáo kết quả rõ ràng.

- [x] **Task 0.4.2: Cấu hình ESLint & Prettier cho Frontend**
  - **Mục tiêu**: Chuẩn hóa phong cách code React/Vite cho đội Frontend.
  - **Acceptance Criteria (AC)**:
    - [x] Chạy `npm run lint` trong `frontend/` không phát sinh lỗi cấu hình.

- [x] **Task 0.4.3: Thiết lập Git Hook & Kiểm soát 5 Quy tắc Bất biến (Core Invariants)**
  - **Mục tiêu**: Khóa an toàn trước khi commit code.
  - **Nội dung kiểm tra**:
    - Chặn commit các file nhạy cảm (`.env`, `credentials`).
    - Bắt buộc commit message theo chuẩn Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
    - Nhắc nhở quy tắc Deadlock-free Lock Ordering và Test Integrity Harness.

---

### 📦 WP0.5: Nghiệm thu & Chốt Gatekeeper (Phase 0 Sign-off)

- [x] **Task 0.5.1: Thực hiện Verification Run-through**
  - **Kịch bản kiểm thử nghiệm thu**:
    1. Reset về commit sạch.
    2. Chạy lệnh: `docker compose up -d`.
    3. Kiểm tra container status: `app`, `db`, `frontend`, `mailpit`, `mock-server` đều `healthy` / `running`.
    4. Kiểm tra endpoint Backend: `GET http://localhost:8000/api/health` -> HTTP 200.
    5. Kiểm tra endpoint Mock API: `GET http://localhost:4010/api/v1/events` -> HTTP 200 (Mock Data).
    6. Kiểm tra giao diện Mailpit: `GET http://localhost:8025` -> HTTP 200.
    7. Kiểm tra kết nối CSDL MySQL: Port `3307` nhận kết nối từ DBeaver / Navicat / CLI -> OK.
  - **Deliverable**: Biên bản nghiệm thu kỹ thuật [`docs/PHASE_0_SIGNOFF.md`](../PHASE_0_SIGNOFF.md).

---

## 3. MA TRẬN PHÂN CÔNG & DEPENDENCY GRAPH

| Gói công việc (WP) | Người phụ trách đề xuất | Phụ thuộc (Prerequisites) | Sản phẩm đầu ra (Deliverable) |
| :--- | :--- | :--- | :--- |
| **WP0.1**: Baseline Audit | Tech Lead / System Architect | Bộ 3 docs v3.1 / v3.2 | `docs/BASELINE_AUDIT_REPORT.md` |
| **WP0.2**: Docker & Dev Stack | DevOps / Senior BE | `compose.yaml` hiện tại | Stack Docker hoàn chỉnh, Mailpit sẵn sàng |
| **WP0.3**: Mock Server & Postman | Senior BE / QA Engineer | `docs/openapi_v3.2.3.yml` | Container Prism (port 4010) + Postman JSON |
| **WP0.4**: Quality Gates & Hooks | Fullstack / Tech Lead | Backend & Frontend repos | Pint, ESLint, Git hooks |
| **WP0.5**: Phase 0 Sign-off | Tech Lead & Senior PM | WP0.1 -> WP0.4 | `docs/PHASE_0_SIGNOFF.md` |

---

## 4. TIÊU CHÍ HOÀN THÀNH (DEFINITION OF DONE - DoD)

Phase 0 chính thức hoàn tất khi:
1. [x] Không còn bất kỳ sự bất đồng bộ nào giữa Database Schema SQL, OpenAPI Spec và SRS.
2. [x] Thành viên mới chỉ cần gõ `docker compose up -d` là khởi động thành công toàn bộ stack môi trường phát triển.
3. [x] Mock Server hoạt động ổn định tại cổng `4010`, phục vụ song song cho đội thiết kế UI/UX.
4. [x] Biên bản nghiệm thu `docs/PHASE_0_SIGNOFF.md` được ký duyệt bởi Tech Lead.
