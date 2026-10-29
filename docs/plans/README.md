# Danh Mục Kế Hoạch & Lộ Trình Dự Án (Project Plans & Roadmap)

Thư mục này lưu trữ toàn bộ các báo cáo chiến lược, kế hoạch phân rã công việc (WBS) và hướng dẫn thực thi theo từng giai đoạn của dự án **Campus Event Hub (CEH Main Project)**.

---

## 📑 Danh Sách Tài Liệu Kế Hoạch

| STT | Tài liệu | Mô tả tóm tắt | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | [**00_project_roadmap_and_feasibility.md**](./00_project_roadmap_and_feasibility.md) | **Đánh giá khả năng & Khung kế hoạch tổng thể (Master WBS)**<br>- Đánh giá tính khả thi phát triển Backend song song với thiết kế UI Frontend.<br>- Khung WBS 6 giai đoạn (Phase 0 đến Phase 5).<br>- Quản trị rủi ro và chiến lược API-First / Contract-First. | `Approved Skeleton` |
| 2 | [**01_phase_0_baseline_and_readiness.md**](./01_phase_0_baseline_and_readiness.md) | **Kế hoạch thực thi chi tiết Phase 0: Baseline & Architecture Readiness**<br>- WP0.1: Rà soát & đồng bộ nhất quán tài liệu (SRS, DB SQL, OpenAPI).<br>- WP0.2: Chuẩn hóa môi trường Container (Docker, PHP 8.2+, MySQL 8.4, Mailpit).<br>- WP0.3: Dựng OpenAPI Mock Server (Prism) phục vụ Frontend.<br>- WP0.4: Thiết lập Code Quality Gates (Pint, ESLint, Git hooks).<br>- WP0.5: Nghiệm thu & Gatekeeper Sign-off. | `Completed (100%)` |
| 3 | [**02_phase_1_backend_foundation.md**](./02_phase_1_backend_foundation.md) | **Kế hoạch chi tiết Phase 1: Backend Foundation & Core Security**<br>- Chuẩn hóa mã Task có ý nghĩa theo tiền tố `CEH-P1-[MODULE]-[NUM]` (tiện lợi quản lý trên Notion).<br>- WP1.1: 24 Bảng CSDL Migrations & 3 Views CSDL, Seeders chuẩn UIT.<br>- WP1.2: Kiến trúc nền tảng, Unified Envelope, Crypto & Audit Services, Middleware RBAC/Sanctum.<br>- WP1.3: Toàn bộ 11 APIs Xác thực & Quản trị tài khoản (UC-AUTH-01..05 & UC-ADM-01).<br>- WP1.4: Bộ Feature Tests tự động theo Soft Harness & Postman Collection. | `Ready for Execution` |
| 4 | [**03_phase_2_domain_features_and_business_logic.md**](./03_phase_2_domain_features_and_business_logic.md) | **Kế hoạch chi tiết Phase 2: Domain Features & Business Logic**<br>- 10 Work Packages (WP2.1 đến WP2.10) bao phủ 100% FR-07 đến FR-32 và 26 Use Cases.<br>- 31 Tasks chuẩn hóa mã `CEH-P2-[MODULE]-[NUM]` sẵn sàng import Notion.<br>- Kiểm soát xung đột phòng đệm 15p, luồng duyệt đa cấp Host-driven (Khoa $\rightarrow$ CTSV).<br>- Đặt vé chịu tải Concurrency, Deadlock-Free Lock Ordering, Waitlist FIFO (Sàn 15p, đóng $T-2\text{h}$).<br>- Kiosk Dynamic TOTP QR 30s, soát vé HMAC $<2.0\text{s}$, Device Binding, phân bậc ĐRL $\Delta t$.<br>- Khảo sát 48h, e-Certificate NĐ 13, xuất biểu mẫu ĐRL CTSV, BI Views & Tích hợp AI Core. | `Ready for Execution` |

---

## 🏷️ Quy Ước Mã Số Task (Task ID Convention cho Notion)

Toàn bộ các tác vụ kỹ thuật từ Phase 1 trở đi được định danh duy nhất theo cú pháp:
$$\mathbf{CEH\text{-}P[Phase]\text{-}[Module]\text{-}[Index]}$$

* **Tiền tố dự án**: `CEH` (Campus Event Hub).
* **Giai đoạn**: `P1`, `P2`, `P3`, v.v.
* **Mã Phân hệ (Module Codes)**:
  - `MIG`: Database Migrations & Views.
  - `SED`: Database Seeders.
  - `MOD`: Eloquent Models & Relationships.
  - `ARC`: Architecture, Envelopes & Base Classes.
  - `MID`: Security & RBAC Middleware.
  - `AUTH`: Authentication & Account APIs.
  - `ADM`: Administration & Internal User APIs.
  - `MAIL`: Queue Mailables & Templates.
  - `ROOM`: Room & Facility Management APIs.
  - `EVT`: Event Lifecycle & Multi-level Approval APIs.
  - `DISC`: Event Discovery & Public Catalog APIs.
  - `BOOK`: Ticket Booking, Waitlist FIFO & Concurrency.
  - `TCK`: Personal Ticket & HMAC Signature APIs.
  - `OPS`: Kiosk, Attendance & Two-way Check-in APIs.
  - `FEED`: Survey Feedback & Grace Period APIs.
  - `CERT`: Cryptographic e-Certificate APIs.
  - `DRL`: DRL Accreditation & Export APIs.
  - `REP`: Analytics, Reporting & Macro BI APIs.
  - `NOTIF`: In-app Notification Center APIs.
  - `SYS`: Background Workers & Schedulers (Cron Tasks).
  - `AI`: AI Copilot & BI Agent Services.
  - `TST`: Automated Tests & Postman Collections.
* **Số thứ tự**: `01`, `02`, `03`...
