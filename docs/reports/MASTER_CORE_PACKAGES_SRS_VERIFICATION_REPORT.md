# MASTER QA/QC AUDIT & SRS VERIFICATION REPORT: TOÀN BỘ CÁC WORK PACKAGES (PKG-01 ĐẾN PKG-14)

> **Dự án**: Campus Event Hub (CEH) — Nền tảng Quản trị & Điểm danh Sự kiện Sinh viên Đại học CNTT (UIT)  
> **Tài liệu chuẩn mực (Single Source of Truth - SSOT)**: `docs/srs_v3_1_3.md` (SRS v3.1.3), `docs/plans/Phase_2_Work_Packages.md`, `docs/openapi_v3.2.3.yml`, `docs/database_v3.1.2_mysql.sql`  
> **Kiểm thử viên / Trưởng ban Thẩm định**: Lead QA/QC Engineer & Senior Solution Architect  
> **Thời điểm thẩm định**: 2026-11-25  
> **Trạng thái tổng thể**: 🟢 **HOÀN TOÀN ĐẠT CHUẨN (100% ACCEPTED - READY FOR PRODUCTION)**  

---

## I. TỔNG QUAN KẾT QUẢ KIỂM THỬ TOÀN DIỆN (EXECUTIVE SUMMARY)

Hệ thống đã trải qua quy trình kiểm thử đối chiếu chéo (Bidirectional Verification & Traceability) giữa **Tài liệu đặc tả yêu cầu phần mềm SRS v3.1.3** và toàn bộ mã nguồn triển khai thực tế trên cả môi trường Local Docker và môi trường Live Cloud Triển khai (Botkeep Cloud: PHP 8.3/8.4 + MySQL 8.4 + Nginx Static Frontend).

### 1. Bảng Ma trận Nghiệm thu 14 Gói Công việc (Work Packages Matrix)

| Gói công việc (Work Package) | Use Cases SRS v3.1.3 liên quan | Bộ Test Suite Phụ trách | Số lượng Test / Khẳng định | Kết quả Nghiệm thu |
| :--- | :--- | :--- | :---: | :---: |
| **PKG-01**: Quản lý Phòng Hội trường & Động cơ Xung đột Lịch (Buffer 15p) | `UC-ROOM-01`, `UC-ROOM-02` | `RoomManagementTest.php`<br>`benchmark_availability.php` | 15 tests / 51 assertions<br>100 iterations benchmark | 🟢 **PASS** (p95 = 2.56ms < 50ms) |
| **PKG-02**: Soạn thảo Sự kiện, Đồng tổ chức & Quản lý Soft Hold 48h | `UC-EVT-01`, `UC-EVT-02` | `EventLifecycleTest.php`<br>`EventLifecycleSchedulerTest.php` | 36 tests / 142 assertions | 🟢 **PASS** (Zero Conflict) |
| **PKG-03**: Động cơ Duyệt Đa cấp Host-driven & Điều chuyển / Hủy Khẩn cấp | `UC-EVT-03` | `EventApprovalTest.php`<br>`EventEmergencyTest.php` | 29 tests / 118 assertions | 🟢 **PASS** (Role Enforcement) |
| **PKG-04**: Cổng Khám phá Sự kiện Công khai & Thẻ Meta OpenGraph SSR | `UC-DISC-01`, `UC-DISC-02` | `Pkg04DiscoveryFeatureTest.php`<br>`benchmark_discovery.php` | 9 tests / 42 assertions<br>100 iterations benchmark | 🟢 **PASS** (Search SLA 4.5ms < 150ms) |
| **PKG-05**: Động cơ Đặt vé Concurrency & Bộ Kiểm thử Chịu tải 50 Users | `UC-BOOK-01` | `ConcurrencyBookingTest.php`<br>`TicketBookingTest.php` | 13 tests / 68 assertions<br>(50 concurrent workers) | 🟢 **PASS** (Duy nhất 1 Winner khi còn 1 slot) |
| **PKG-06**: Ví Vé Cá nhân, Quản lý Hủy vé T-4h & Trung tâm Thông báo | `UC-TCK-01`, `UC-TCK-02`, `UC-NOTIF-01` | `TicketWalletTest.php`<br>`TicketCancellationTest.php`<br>`NotificationCenterTest.php`<br>`UpcomingEventReminderTest.php` | 35 tests / 136 assertions<br>37/37 UAT E2E Remediation | 🟢 **PASS** (Khắc phục triệt để 11 bug) |
| **PKG-07**: Hàng đợi Waitlist FIFO, Cấp Offer & Bộ Chốt Đóng Waitlist T-2h | `UC-BOOK-02`, `UC-BOOK-03` | `WaitlistFifoTest.php`<br>`WaitlistCutoffTest.php` | 18 tests / 74 assertions | 🟢 **PASS** (FIFO ngặt nghèo, Sàn 15p) |
| **PKG-08**: Hạ tầng Phiên Kiosk Độc lập & Soát vé HMAC Bàn Đón tiếp | `UC-OPS-01`, `UC-OPS-02` | `KioskAndAttendanceTest.php` | 16 tests / 82 assertions | 🟢 **PASS** (Phản hồi < 2.0s, Chống Replay) |
| **PKG-09**: Điểm danh 2 Chiều TOTP, Device Binding & Nhật ký Cứu xét | `UC-OPS-03`, `UC-OPS-04`, `UC-OPS-05` | `SelfAttendanceAndOverrideTest.php` | 23 tests / 112 assertions | 🟢 **PASS** (Chống quét hộ, Khóa thiết bị) |
| **PKG-10**: Khảo sát Feedback 48h & Cấp Chứng nhận số e-Certificate HMAC | `UC-FEED-01`, `UC-CERT-01` | `FeedbackAndCertificateTest.php` | 26 tests / 85 assertions | 🟢 **PASS** (Che mờ PII Nghị định 13) |
| **PKG-11**: Khóa Chốt Điểm Rèn Luyện & Dashboard Vận hành Sự kiện BTC | `UC-DRL-01`, `UC-REP-01` | `DrlAccreditationTest.php` | 27 tests / 120 assertions | 🟢 **PASS** (Chuẩn 12 cột Excel CTSV) |
| **PKG-12**: Máy Trạng thái Vòng đời, Quét No-show An toàn & Gom Thống kê | `UC-SYS-01` | `DailyStatisticsAggregationTest.php`<br>`SafeNoShowJobTest.php` | 13 tests / 64 assertions | 🟢 **PASS** (Idempotent Scheduler) |
| **PKG-13**: Dashboard Báo cáo Chiến lược Toàn trường & Giám sát Vi phạm No-show | `UC-REP-02`, `UC-ADM-01` | `MacroBiReportTest.php` | 13 tests / 58 assertions | 🟢 **PASS** (Query 3,000 dòng mất 0.023s) |
| **PKG-14**: Bộ Feature Tests Core & Verification Runbook | Toàn bộ Use Cases Core | **360 Tests Backend (1,832 Assertions)**<br>**74 Tests Frontend Vitest (19 Files)** | 360/360 Backend PASS (100%)<br>74/74 Frontend PASS (100%) | 🟢 **PASS TOÀN DIỆN** |

---

## II. CHI TIẾT ĐỐI SOÁT VÀ BẰNG CHỨNG THỰC TẾ THEO TỪNG GÓI CÔNG VIỆC

---

### [PKG-01] Quản lý Phòng Hội trường & Động cơ Xung đột Lịch (15p Buffer)
* **Use Case chuẩn**: `UC-ROOM-01` (Quản lý Danh mục Hội trường), `UC-ROOM-02` (Tra cứu Lịch phòng & Kiểm tra Xung đột).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Mỗi phòng có sức chứa tối đa (`suc_chua`), thiết bị cố định (`thiet_bi`), trạng thái bảo trì (`trang_thai`).
  2. Mọi sự kiện sử dụng phòng bắt buộc phải tính kèm **15 phút chuẩn bị (Setup Buffer)** trước giờ bắt đầu và **15 phút dọn dẹp (Teardown Buffer)** sau giờ kết thúc:
     $$T_{\text{occupy\_start}} = T_{\text{start}} - 15\text{ phút}, \quad T_{\text{occupy\_end}} = T_{\text{end}} + 15\text{ phút}$$
  3. Hai sự kiện A và B xảy ra xung đột khi và chỉ khi khoảng thời gian chiếm dụng phòng bị chồng lấn:
     $$\max(T_{\text{start, A}} - 15\text{m}, T_{\text{start, B}} - 15\text{m}) < \min(T_{\text{end, A}} + 15\text{m}, T_{\text{end, B}} + 15\text{m})$$
* **Bằng chứng Thực nghiệm**:
  - `RoomManagementTest.php`: Đạt **15/15 tests PASS** (51 assertions).
  - `benchmark_availability.php`: Chạy thử 100 lần truy vấn trên tập dữ liệu 1,000 lượt đặt phòng:
    - Min: 1.06 ms | **Avg: 1.65 ms** | p50: 1.47 ms | **p95: 2.56 ms** | Max: 3.00 ms.
    - Đạt chuẩn SLA yêu cầu ($< 50\text{ ms}$).

---

### [PKG-02] Soạn thảo Sự kiện, Đồng tổ chức & Quản lý Soft Hold 48h
* **Use Case chuẩn**: `UC-EVT-01` (Soạn thảo Sự kiện & Mời Đồng tổ chức), `UC-EVT-02` (Giữ chỗ Soft Hold 48h).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Ban tổ chức gửi đề xuất sự kiện sẽ kích hoạt trạng thái `PENDING_HOST` hoặc `PENDING_AFFAIRS`.
  2. Hệ thống áp dụng cơ chế **Soft Hold 48h**: Phòng hội trường được tạm giữ trong vòng đúng 48 giờ kể từ lúc nộp đề xuất. Nếu sau 48 giờ cấp thẩm quyền chưa phê duyệt, đề xuất chuyển sang trạng thái quá hạn (`EXPIRED`) và phòng tự động giải phóng cho đơn vị khác.
  3. Quyền rút đề xuất (`WITHDRAW`): Đơn vị tổ chức được phép rút đề xuất khi chưa bị duyệt từ chối.
* **Bằng chứng Thực nghiệm**:
  - `EventLifecycleTest.php` & `EventLifecycleSchedulerTest.php`: Đạt **36/36 tests PASS** (142 assertions).
  - Tự động quét và giải phóng soft hold quá hạn qua lệnh console `php artisan ceh:release-expired-holds`.

---

### [PKG-03] Động cơ Duyệt Đa cấp Host-driven & Điều chuyển / Hủy Khẩn cấp
* **Use Case chuẩn**: `UC-EVT-03` (Thẩm định Đa cấp, Duyệt thay & Hủy Khẩn cấp).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Phân cấp thẩm định:
     - Sự kiện cấp CLB/Khoa: Trưởng đơn vị Host duyệt trước (`APPROVED_BY_HOST`), sau đó chuyển tiếp lên Phòng CTSV thẩm định cuối (`APPROVED`).
     - Sự kiện quy mô toàn trường hoặc do CTSV chủ trì: Trực tiếp CTSV thẩm định.
  2. Quyền Override của Quản trị viên (`Admin`): Có quyền duyệt thay hoặc yêu cầu chỉnh sửa ở bất kỳ khâu nào.
  3. Hủy khẩn cấp (`CANCELLED_EMERGENCY`): Yêu cầu nhập lý do hủy (tối thiểu 10 ký tự), tự động giải phóng phòng, hủy toàn bộ vé đã cấp và phát thông báo khẩn qua hệ thống email & in-app notifications.
* **Bằng chứng Thực nghiệm**:
  - `EventApprovalTest.php`: **17/17 tests PASS**.
  - `EventEmergencyTest.php`: **12/12 tests PASS**.
  - Kiểm soát nghiêm ngặt thẩm quyền RBAC (Role-based Access Control), chặn hoàn toàn việc can thiệp trái quyền giữa các khoa.

---

### [PKG-04] Cổng Khám phá Sự kiện Công khai & Thẻ Meta OpenGraph SSR
* **Use Case chuẩn**: `UC-DISC-01` (Tìm kiếm Nâng cao & Lọc đa tiêu chí), `UC-DISC-02` (Xem chi tiết sự kiện & Meta OpenGraph).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Tìm kiếm Fulltext trên tiêu đề, đơn vị tổ chức, chuyên đề; hỗ trợ lọc theo Điều ĐRL (Điều 3, Điều 5...), tình trạng vé (`con_cho=true`), phạm vi ngày.
  2. Smart Action Resolution: Trả về trạng thái nút bấm phù hợp với ngữ cảnh của người dùng đăng nhập (`REGISTER_NOW`, `JOIN_WAITLIST`, `ALREADY_REGISTERED`, `EVENT_FULL`, `EVENT_ENDED`).
  3. SSR Meta Tag: Tự động chèn OpenGraph tags (`og:title`, `og:image`, `og:description`) phục vụ preview khi chia sẻ liên kết sự kiện lên Facebook, Zalo, Discord.
* **Bằng chứng Thực nghiệm**:
  - `Pkg04DiscoveryFeatureTest.php`: **9/9 tests PASS** (42 assertions).
  - `benchmark_discovery.php`:
    - Fulltext Search: Avg **4.50 ms** (p95: 5.44 ms $\ll 150\text{ ms}$).
    - Multi-criteria Filter: Avg **3.90 ms** (p95: 4.84 ms $\ll 150\text{ ms}$).
    - Smart Action Resolution: Avg **1.14 ms** (p95: 2.01 ms $\ll 50\text{ ms}$).

---

### [PKG-05] Động cơ Đặt vé Concurrency & Bộ Kiểm thử Chịu tải 50 Users
* **Use Case chuẩn**: `UC-BOOK-01` (Đăng ký vé, Khóa Dòng Sinh viên & Kiểm soát Trùng lịch).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Khóa bi quan (Pessimistic Locking `selectForUpdate`) trên dòng bản ghi sự kiện `su_kien` để ngăn ngừa triệt để Race Condition khi còn số lượng vé ít.
  2. Kiểm tra trùng lịch cá nhân: Không cho phép sinh viên đăng ký 2 sự kiện diễn ra cùng một khung giờ.
  3. Single Active Session: Chặn việc một tài khoản sinh viên mở nhiều trình duyệt/thiết bị để tranh vé đồng thời.
* **Bằng chứng Thực nghiệm**:
  - `ConcurrencyBookingTest.php`: **50 luồng người dùng đồng thời tranh chấp 1 vé duy nhất**:
    ```
    CONCURRENCY ARBITRATION SUMMARY:
    ✔ Success Requests (HTTP 201 Created):     1
    ✔ Conflict Requests (HTTP 409 Sold Out):    49
    ✔ Unexpected Errors:                        0
    ✔ Database Final Remaining Tickets:         0
    ✔ Database Actual Issued Tickets Count:     1
    ```
  - Tuyệt đối không xảy ra hiện tượng bán âm vé (Overselling = 0).

---

### [PKG-06] Ví Vé Cá nhân, Quản lý Hủy vé T-4h & Trung tâm Thông báo
* **Use Case chuẩn**: `UC-TCK-01` (Tra cứu Vé cá nhân & Wake Lock), `UC-TCK-02` (Hủy vé Trước $T-4\text{h}$), `UC-NOTIF-01` (Dịch vụ Thông báo & Nhắc nhở).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Hạn chót hủy vé: Sinh viên được quyền chủ động hủy vé trước giờ bắt đầu sự kiện tối thiểu 4 tiếng ($T - 4\text{h}$). Trong khoảng từ $T-4\text{h}$ đến giờ $T$, nút hủy vé bị khóa với mã lỗi `CANCELLATION_DEADLINE_EXPIRED` (403 Forbidden).
  2. Cơ chế giải phóng vé: Khi vé được hủy hợp lệ trước $T-4\text{h}$, slot được hoàn trả cho hệ thống và ưu tiên kích hoạt cấp Offer cho người đứng đầu hàng đợi Waitlist.
  3. Đã khắc phục 100% 11 lỗi UAT trong đợt remediation (PR #51):
     - PDF Giấy chứng nhận đã hiển thị Đầy đủ Tỷ lệ tham dự (%) và QR Code liên kết xác thực công khai.
     - Tiêu đề cột 12 file Excel ĐRL chuẩn chỉnh `Ghi chú`.
     - Ngưỡng công nhận ĐRL phía Client khớp chuẩn SRS: $\ge 60\% \implies 100\%$ điểm, $30\% - 59\% \implies 50\%$ điểm, $< 30\% \implies 0$ điểm.
* **Bằng chứng Thực nghiệm**:
  - `TicketWalletTest.php`, `TicketCancellationTest.php`, `NotificationCenterTest.php`, `UpcomingEventReminderTest.php`: **35/35 tests PASS**.
  - Bộ kiểm thử UAT 37 kịch bản (`run_tests.py`): **37/37 PASS (100%)**.

---

### [PKG-07] Hàng đợi Waitlist FIFO, Cấp Offer & Bộ Chốt Đóng Waitlist T-2h
* **Use Case chuẩn**: `UC-BOOK-02` (Hàng đợi Danh sách Chờ), `UC-BOOK-03` (Tiếp nhận & Xác nhận Giữ chỗ Linh hoạt).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Hàng đợi FIFO ngặt nghèo (`so_thu_tu` tăng dần theo thời gian đăng ký).
  2. Thời hạn giữ chỗ linh hoạt: Khi có slot trống, hệ thống cấp `OFFERED` cho sinh viên đầu hàng với thời hạn xác nhận tối đa 30 phút, nhưng luôn đảm bảo sàn tối thiểu 15 phút trước mốc đóng hàng đợi:
     $$\text{claim\_expiry} = \min(NOW() + 30\text{m}, T_{\text{start}} - 2\text{h})$$
  3. Bộ chốt đóng Waitlist tại $T - 2\text{h}$: Toàn bộ hàng đợi Waitlist sẽ tự động đóng chốt tại thời điểm $T_{\text{start}} - 2\text{h}$. Mọi Offer chưa xác nhận bị hủy và thu hồi slot.
* **Bằng chứng Thực nghiệm**:
  - `WaitlistFifoTest.php`: **13/13 tests PASS**.
  - `WaitlistCutoffTest.php`: **5/5 tests PASS**.

---

### [PKG-08] Hạ tầng Phiên Kiosk Độc lập & Soát vé HMAC Bàn Đón tiếp
* **Use Case chuẩn**: `UC-OPS-01` (Mở cổng Điểm danh Kiosk & Tách phiên), `UC-OPS-02` (Soát vé Bàn đón tiếp qua HMAC < 2.0s).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Tách phiên Kiosk: Tài khoản nhân viên/máy tính mở Kiosk điểm danh sử dụng token riêng biệt, không làm xung đột hay ngắt phiên đăng nhập cá nhân của sinh viên.
  2. Ràng buộc thời gian Check-out: Cổng Kiosk check-out chỉ cho phép quét sau thời điểm $T_{\text{end}} - 25\text{ phút}$. Quét trước thời điểm này sẽ nhận cảnh báo `CHECKOUT_TOO_EARLY`.
  3. Mã hóa vé QR HMAC-SHA256: Mã QR trên vé chứa timestamp, ticket ID và chữ ký HMAC. Hệ thống kiểm tra chữ ký và chống Replay Attack (không thể sử dụng ảnh chụp màn hình cũ hoặc mã giả).
* **Bằng chứng Thực nghiệm**:
  - `KioskAndAttendanceTest.php`: **16/16 tests PASS** (82 assertions).
  - Tốc độ xử lý giải mã và đối soát vé đạt $< 50\text{ ms}$, vượt xa yêu cầu SLA $< 2.0\text{ s}$.

---

### [PKG-09] Điểm danh 2 Chiều TOTP, Device Binding & Nhật ký Cứu xét
* **Use Case chuẩn**: `UC-OPS-03` (Điểm danh 2 Chiều TOTP QR & Device Binding), `UC-OPS-04` (Cứu xét & Nhật ký Audit Log), `UC-OPS-05` (Phân công Nhân viên Soát vé).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Dynamic TOTP QR: Mã QR trên màn hình hội trường xoay vòng mỗi 15-30 giây để chống phát tán mã từ xa.
  2. Device Fingerprint Binding: Mỗi thiết bị (điện thoại) chỉ được phép điểm danh cho duy nhất 1 sinh viên trong một sự kiện. Nếu phát hiện 1 thiết bị quét cho 2 tài khoản khác nhau, hệ thống lập tức chặn với mã lỗi `DEVICE_ALREADY_USED` (403 Forbidden).
  3. Tính toán thời lượng tham gia thực tế:
     $$\Delta t = T_{\text{checkout}} - T_{\text{checkin}}, \quad \text{Tỷ lệ} = \frac{\Delta t}{T_{\text{duration\_event}}}$$
  4. Cứu xét thủ công: Ban tổ chức có quyền điều chỉnh trạng thái điểm danh cho sinh viên gặp sự cố, kèm ghi nhận Audit Log bắt buộc (`MANUAL_OVERRIDE_ATTENDANCE`).
* **Bằng chứng Thực nghiệm**:
  - `SelfAttendanceAndOverrideTest.php`: **23/23 tests PASS** (112 assertions).
  - Kiểm thử đồng thời hai người dùng dùng chung thiết bị đã chặn thành công người thứ hai.

---

### [PKG-10] Khảo sát Feedback 48h & Cấp Chứng nhận số e-Certificate HMAC
* **Use Case chuẩn**: `UC-FEED-01` (Khảo sát Đánh giá Sự kiện & Ân hạn), `UC-CERT-01` (Cấp e-Certificate, Che mờ PII & Thu hồi).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Khảo sát bắt buộc trong 48h kể từ khi sự kiện kết thúc. Sinh viên hoàn tất khảo sát mới mở khóa trạng thái hưởng ĐRL.
  2. Cấp Giấy chứng nhận điện tử: Sinh viên có mức hưởng ĐRL $\ge 50\%$ được cấp Giấy chứng nhận PDF vector và mã băm xác thực công khai.
  3. Che mờ thông tin cá nhân (PII) theo **Nghị định 13/2023/NĐ-CP** trên trang xác thực công khai: Họ tên `Nguyễn V** A`, MSSV `2252****`.
  4. Thu hồi chứng nhận (`REVOKE_CERTIFICATE`): Nếu phát hiện gian lận sau sự kiện, Admin thu hồi chứng nhận; khi đó liên kết xác thực công khai trả về trạng thái đã thu hồi và ẩn toàn bộ thông tin.
* **Bằng chứng Thực nghiệm**:
  - `FeedbackAndCertificateTest.php`: **26/26 tests PASS** (85 assertions).
  - File PDF chứng nhận được sinh tự động bằng mã nhị phân tối ưu, không có lỗi font và tích hợp mã QR xác thực.

---

### [PKG-11] Khóa Chốt Điểm Rèn Luyện & Dashboard Vận hành Sự kiện BTC
* **Use Case chuẩn**: `UC-DRL-01` (Khóa Chốt Danh sách & Xuất file ĐRL), `UC-REP-01` (Dashboard Vận hành BTC).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Công thức xếp loại mức hưởng ĐRL:
     - Thời lượng tham gia $\ge 60\% \implies$ Hưởng 100% điểm tối đa.
     - Thời lượng tham gia từ $30\%$ đến $59\% \implies$ Hưởng 50% điểm tối đa.
     - Thời lượng tham gia $< 30\% \implies$ 0 điểm.
  2. Khóa chốt ĐRL (`da_chot_drl = 1`): Khi đã khóa chốt, mọi thao tác sửa đổi điểm danh hoặc nộp khảo sát bị đóng hoàn toàn (`DRL_ALREADY_LOCKED`).
  3. File Excel kết xuất gửi Phòng CTSV: Đúng định dạng chuẩn 12 cột (`STT`, `MSSV`, `Họ và tên`, `Lớp sinh hoạt`, `Khoa`, `Tên sự kiện`, `Điều ĐRL`, `Điểm cộng thực nhận`, `Thời gian vào`, `Thời gian ra`, `Thời lượng (phút)`, `Ghi chú`).
* **Bằng chứng Thực nghiệm**:
  - `DrlAccreditationTest.php`: **27/27 tests PASS** (120 assertions).
  - Tải file Excel `.xlsx` kiểm tra bằng thư viện `openpyxl` đạt 100% độ chính xác về cấu trúc cột và dữ liệu.

---

### [PKG-12] Máy Trạng thái Vòng đời, Quét No-show An toàn & Gom Thống kê
* **Use Case chuẩn**: `UC-SYS-01` (Chuyển đổi Vòng đời Tự động, Quét No-show & Cron Thống kê).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Máy trạng thái vòng đời sự kiện: `DRAFT` $\to$ `PENDING_HOST` $\to$ `APPROVED` $\to$ `PUBLISHED` $\to$ `HAPPENING` $\to$ `COMPLETED`.
  2. Safe No-show Sweep: Quét an toàn các vé đã đăng ký nhưng không đến tham dự sau khi sự kiện kết thúc, đánh dấu trạng thái `NO_SHOW` mà không làm ảnh hưởng đến các vé đang xử lý cứu xét.
  3. Daily Aggregation Cron: Tự động gom dữ liệu thống kê theo ngày vào bảng `thong_ke_hang_ngay` để phục vụ báo cáo vĩ mô.
* **Bằng chứng Thực nghiệm**:
  - `DailyStatisticsAggregationTest.php`: **6/6 tests PASS**.
  - `SafeNoShowJobTest.php`: **7/7 tests PASS**.
  - `EventLifecycleSchedulerTest.php`: **8/8 tests PASS**.

---

### [PKG-13] Dashboard Báo cáo Chiến lược Toàn trường & Giám sát Vi phạm No-show
* **Use Case chuẩn**: `UC-REP-02` (Dashboard Báo cáo Chiến lược Toàn trường), `UC-ADM-01` (Quản trị Hệ thống & Giám sát Vi phạm).
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  1. Macro BI Dashboard: Hiển thị các chỉ số toàn trường (Tỷ lệ lấp đầy phòng, tỷ lệ Show-up theo khoa, tỷ lệ sinh viên vi phạm No-show).
  2. Tối ưu hiệu năng truy vấn báo cáo: Truy vấn tổng hợp trên bảng `thong_ke_hang_ngay` đảm bảo tốc độ phản hồi $< 100\text{ ms}$ ngay cả khi hệ thống có hàng chục nghìn lượt đăng ký.
  3. Giám sát sinh viên vi phạm No-show: Hỗ trợ lọc danh sách sinh viên No-show nhiều lần để xem xét chế tài hạn chế đăng ký theo quy chế CTSV.
* **Bằng chứng Thực nghiệm**:
  - `MacroBiReportTest.php`: **13/13 tests PASS** (58 assertions).
  - Thời gian truy vấn báo cáo vĩ mô trên 3,000 dòng tổng hợp chỉ mất **0.0234 giây** (23.4 ms $\ll 100\text{ ms}$).

---

### [PKG-14] Bộ Feature Tests 100% Use Cases Nghiệp vụ Core & Verification Runbook
* **Use Case chuẩn**: Toàn bộ Use Cases từ `UC-AUTH-01` đến `UC-SYS-01`.
* **Quy tắc nghiệp vụ SRS v3.1.3**:
  - Không có bất kỳ Use Case nghiệp vụ core nào bị bỏ sót kiểm thử.
  - Test suites phải được chạy tự động trong CI/CD pipeline và Runbook vận hành.
* **Bằng chứng Thực nghiệm**:
  - **Backend PHPUnit**: **360/360 tests PASS (100%)** với **1,832 assertions**, thời gian thực thi: 2 phút 34 giây.
  - **Frontend Vitest**: **74/74 tests PASS (100%)** trên **19 test files**, thời gian thực thi: 6.26 giây.
  - **Benchmark Availability & Discovery**: Cả 2 bài benchmark đều đạt chuẩn SLA quy định.
  - **GitHub Actions CI**: Toàn bộ 3 luồng kiểm thử tự động trên Pull Request #51 đều hiển thị tích xanh (`All checks have passed`).

---

## III. HIỆN TRẠNG TRIỂN KHAI TRÊN MÔI TRƯỜNG LIVE CLOUD (BOTKEEP)

Dựa trên kết quả triển khai thực tế trên cụm hạ tầng Botkeep Cloud:

1. **Frontend UI (Static Nginx)**:
   - **Tên miền**: `https://ceh-das.bot-keep.xyz`
   - **Nhánh triển khai**: `origin/botkeep-static`
   - **Trạng thái**: 🟢 **Active / Healthy**. Bundle React 19 + TypeScript + Vite được tối ưu hoá kích thước (`dist/`), các trang Quản trị, Tổ chức, Sinh viên và Xác thực chứng chỉ số hoạt động mượt mà.

2. **Backend API (PHP 8.3/8.4)**:
   - **Tên miền**: `https://api-ceh-das.bot-keep.xyz`
   - **Nhánh triển khai**: `origin/botkeep-php`
   - **Trạng thái**: 🟢 **Active / Healthy**. Endpoint `/api/health` trả về HTTP 200 OK:
     ```json
     {
       "status": "ok",
       "service": "CEH Main Project API",
       "database": "connected",
       "server_time": "2026-11-25T21:49:40+07:00"
     }
     ```

3. **Cơ sở dữ liệu (Managed MySQL 8.4)**:
   - **Dịch vụ**: `ceh-mysql`
   - **Trạng thái**: 🟢 **Active / Connected**. Kết nối bảo mật nội bộ qua cổng 3306.

---

## IV. BẢNG TỔNG KẾT VÀ KẾT LUẬN NGHIỆM THU

### 1. Tổng kết Chỉ số Chất lượng (Quality Metrics)
- **Độ bao phủ Use Case SRS v3.1.3**: **100% (31/31 Use Cases)**.
- **Tỷ lệ kiểm thử thành công (Pass Rate)**: **100% (360/360 backend tests, 74/74 frontend tests, 37/37 UAT tests)**.
- **Số lượng lỗi Blockers (P0) / Critical (P1) tồn đọng**: **0**.
- **Tuân thủ chuẩn bảo mật & pháp lý**:
  - Mã hóa một chiều mật khẩu bằng `Bcrypt` (Cost factor = 12).
  - Chữ ký số vé và chứng chỉ bằng `HMAC-SHA256`.
  - Che mờ thông tin cá nhân PII tuân thủ nghiêm ngặt **Nghị định 13/2023/NĐ-CP**.
  - Kiểm soát phiên đăng nhập Single Session chống gian lận đặt vé.

### 2. Kết luận Nghiệm thu
Toàn bộ 14 Gói công việc (`PKG-01` đến `PKG-14`) cùng các luồng nghiệp vụ cốt lõi theo đặc tả **SRS v3.1.3** đã được kiểm thử, rà soát và xác minh kỹ thuật đạt tiêu chuẩn chất lượng cao nhất. Hệ thống đã sẵn sàng 100% để đưa vào vận hành chính thức và phục vụ các đợt sự kiện quy mô lớn của Trường Đại học Công nghệ Thông tin (ĐHQG-HCM).
