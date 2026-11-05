# QA/QC AUDIT REPORT: PKG-08 — Hạ tầng Kiosk & Soát vé HMAC

> **Target**: `fix/pkg08-kiosk-audit` vs `origin/main`
> **Auditor**: QA/QC audit
> **Date**: 2026-11-05
> **SSOT**: `docs/srs_v3_1_3.md`, `docs/plans/Phase_2_Work_Packages.md`, `docs/plans/03_phase_2_domain_features_and_business_logic.md`, `docs/openapi_v3.2.3.yml`, `docs/database_design_v3.1.2.md`

## I. EXECUTIVE SUMMARY

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| Nghiệp vụ UC-OPS-01 | **PASS** | Fallback check-out chạy ở backend qua scheduler; mở sớm lưu giờ kết thúc thực tế; TOTP dùng payload và thời hạn từ API. |
| Nghiệp vụ UC-OPS-02 | **PASS** | HMAC, kiểm tra event và chống replay dùng logic backend thực; soát vé tại bàn tính thời lượng/ĐRL và trả kết quả theo OpenAPI. |
| Tính toàn vẹn & phân quyền | **PASS / PARTIAL** | Hàng vé được khóa và các event được kiểm tra; test chi tiết về quyền staff/event còn thiếu. |
| API contract | **PASS** | Staff-scan resource và các mã lỗi liên quan đã theo OpenAPI (OpenAPI được ưu tiên khi khác kế hoạch task). |
| Test / NFR | **PARTIAL** | Tất cả test PKG-08 và CryptoService qua; toàn bộ suite có 8 test PKG-04 bị chặn an toàn do đang trỏ vào DB `ceh`, không phải `ceh_test`; chưa đo NFR latency. |
| Phạm vi gói | **CONDITIONAL** | Báo cáo và sửa lỗi tập trung PKG-08. Các thay đổi PKG-09 có sẵn ngoài phạm vi này không được rà soát hay nghiệm thu lại. |

**Verdict: CONDITIONAL — chưa nên mở PR cho đến khi chạy full suite bằng `ceh_test` và xác nhận các khác biệt yêu cầu còn lại.** Các test tập trung PKG-08 đã xanh; lỗi full-suite hiện tại là guard chủ động bảo vệ DB, không phải lỗi nghiệp vụ PKG-08.

## II. BIDIRECTIONAL TRACEABILITY & VERIFICATION

### 1. Tier 1: SRS Use Case Alignment

| UC / Task | Trạng thái | Đối soát |
|---|---|---|
| UC-OPS-01 / CEH-P2-OPS-01 | **Đạt** | Kiosk tạo phiên/token, lấy TOTP và QR payload từ API; fallback check-out được lịch hóa phía server; thao tác mở sớm ghi giờ kết thúc thực tế. |
| UC-OPS-02 / CEH-P2-OPS-02 | **Đạt** | Staff scan xác thực HMAC, event, trạng thái vé và replay; check-out tính Δt/ĐRL; response theo schema OpenAPI. Camera scanner dùng ZXing; mất mạng báo lỗi và yêu cầu thử lại, không ghi nhận offline. |
| UC-OPS-05 / CEH-P2-OPS-02 | **Thiếu kiểm chứng** | Endpoint phân công/thu hồi theo event có sẵn; chưa có kiểm thử đủ cho quyền host, phân công chéo event và hiệu lực phân công. |
| UC-OPS-03, UC-OPS-04 | **Ngoài phạm vi** | Thuộc PKG-09; không dùng để kết luận PKG-08 đạt hay không. |

### 2. Tier 2: Task-level DoD & AC

- Dùng chung `AttendanceScoringService` cho self-checkout và staff checkout, với ngưỡng đầy đủ/một phần/không đạt.
- Fallback command khóa và cập nhật đăng ký trong transaction, đồng thời ghi audit log `AUTO_OPEN_CHECKOUT`.
- Mã lỗi và response staff-scan được đồng bộ với OpenAPI.
- Frontend API mode dùng event được phân công, payload kiosk từ server và camera decoder; không gọi luồng check-in demo sau khi API thành công.
- Offline scanner fail-closed, hiển thị thông báo và yêu cầu retry. UI demo vẫn có dữ liệu mô phỏng nhưng được tách khỏi API mode.

### 3. Tier 3: Package DoD & Downstream Readiness

- Docker Compose có scheduler chạy `php artisan schedule:work`; fallback đăng ký mỗi 5 phút và được xác nhận trong `schedule:list`.
- API giữ response envelope theo contract; các test focused xác nhận cả lỗi sai event và luồng replay.
- Chưa có benchmark PKG-08 để xác nhận NFR latency ≤2.0 giây.

## III. DEFECTS & FINDINGS

### Đã khắc phục

1. **Fallback check-out phụ thuộc kiosk/client** — chuyển thành command và service backend, lịch chạy mỗi 5 phút; thêm scheduler service vào Compose.
2. **Thiếu điểm ĐRL cho check-out tại bàn** — chia sẻ logic tính thời lượng và các ngưỡng ĐRL với self-checkout.
3. **Thiếu giờ kết thúc thực tế khi xác nhận mở cổng sớm** — giờ kết thúc được lưu và dùng làm mốc tính thời lượng.
4. **Staff-scan lệch OpenAPI** — resource và mã lỗi đã được đồng bộ theo OpenAPI.
5. **Scanner chỉ là demo, không báo lỗi offline đúng cách** — bổ sung camera ZXing và API scan; không ghi nhận khi mất kết nối.
6. **Kiosk đọc sai thời hạn TOTP và dựng QR cục bộ trong API mode** — dùng `expires_in_seconds` và `qr_payload` từ API, xác thực định dạng trước khi hiển thị.
7. **Lỗi camera/fullscreen bị che** — hiển thị lỗi để người vận hành có thể xử lý.

### 🟡 P1 — Cần chốt yêu cầu

1. **Cửa sổ TOTP khác nhau giữa tài liệu**: SRS mô tả mã hiện tại/chu kỳ trước, trong khi kế hoạch task ghi dung sai ±1 bước. Chưa thay đổi cửa sổ chấp nhận; cần chủ sở hữu SSOT chốt hành vi để tránh chấp nhận mã tương lai ngoài ý muốn.

### 🟢 P2 — Còn thiếu kiểm chứng

2. **Test quyền và phạm vi Staff**: thêm test host, staff được/không được phân công, phân công chéo event và hiệu lực phân công.
3. **Offline/retry và NFR**: bổ sung test/benchmark về offline, retry sau reconnect, thời gian phản hồi, và các trường hợp hết hạn/hủy vé nếu chưa được bao phủ ở suite tổng thể.
4. **Phạm vi diff**: các thay đổi thuộc PKG-09 cần được quản lý/đánh giá riêng; không gộp kết quả nghiệm thu của chúng vào báo cáo PKG-08.

## IV. EMPIRICAL VERIFICATION EVIDENCE

| Check Layer | Command / Method | Environment | Result | Evidence / Reason if NOT RUN |
|---|---|---|---|---|
| Frontend build | `npm run build --prefix frontend` | Local Node | **PASS** | TypeScript/Vite build thành công; cảnh báo bundle JS khoảng 1.75 MB trước gzip. |
| Frontend lint | `npm run lint --prefix frontend` | Local Node | **PASS** | ESLint và html-validate đều exit code 0. |
| Dependency audit | `npm audit --audit-level=high --prefix frontend` | Local Node | **PASS (threshold)** | Không có mức High/Critical; còn 4 cảnh báo Moderate trong dependency tree ESLint/minimatch. |
| PKG-08 feature + HMAC unit | `docker compose exec -T app php artisan test tests/Feature/KioskAndAttendanceTest.php tests/Unit/CryptoServiceTest.php` | Docker/MySQL | **PASS** | 11 tests, 60 assertions. |
| Backend full suite | `docker compose exec -T app php artisan test` | Docker | **FAIL (8 unrelated tests)** | 190 passed, 8 `Pkg04DiscoveryFeatureTest` fail có chủ đích vì guard chỉ cho phép DB `ceh_test`; lệnh đang chạy với DB `ceh`. Không thay đổi guard hoặc chạy test lên DB chính. |
| Compose config | `docker compose config` | Docker | **PASS** | Cấu hình scheduler hợp lệ, không publish cổng ứng dụng trùng. |
| Scheduler | `docker compose up -d scheduler`; `docker compose exec -T scheduler php artisan schedule:list` | Docker | **PASS** | Container hoạt động; command fallback hiển thị mỗi 5 phút. |
| App health | `curl.exe http://localhost:8000/up` | Docker | **PASS** | HTTP 200. |
| Frontend tests | — | — | **NOT RUN** | Không có test runner/script frontend được cấu hình. |
| Concurrency / NFR latency | PKG-08 benchmark | — | **NOT RUN** | Chưa có benchmark kiosk/staff-scan trong repository. |
| Diff hygiene | `git diff --check` | Local | **PASS** | Không có whitespace error. |

## V. DUAL-GATE VERDICT & ACTION CHECKLIST

### 1. Merge-Ready Gate: **CONDITIONAL**

- [x] Các test feature PKG-08 và CryptoService chạy thành công.
- [x] Frontend build và lint thành công.
- [x] OpenAPI staff-scan contract và unified error codes được áp dụng.
- [x] Docker scheduler chạy fallback định kỳ trong môi trường local.
- [ ] Chạy toàn bộ backend suite bằng DB riêng `ceh_test`; không dùng DB `ceh`.
- [ ] Chốt cửa sổ chấp nhận TOTP giữa SRS và task plan.
- [ ] Hoàn thiện kiểm thử quyền Staff/event và NFR latency.
- [ ] Xác nhận các thay đổi PKG-09 được tách hoặc có PR/phạm vi nghiệm thu riêng.

### 2. Launch-Ready Gate: **CONDITIONAL**

- [x] Fallback check-out được thực thi phía server trong Docker Compose.
- [ ] Xác minh scheduler tương đương được cấu hình trong môi trường production.
- [ ] Hoàn thiện quy trình rollback và xác minh vận hành với dữ liệu staging.
