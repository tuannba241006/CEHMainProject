# ĐẶC TẢ NHIỆM VỤ KIỂM THỬ UAT CHUẨN ISO/IEC/IEEE 29119-3 — CAMPUS EVENT HUB (CEH)

> **Mã tài liệu:** `CEH-UAT-SPEC-v1.0`  
> **Chuẩn áp dụng:** **ISO/IEC/IEEE 29119-3 (Test Documentation)** & **Agile Task Specification**  
> **Căn cứ kỹ thuật (SSOT):**  
> 1. `docs/srs_v3_1_3.md` (FR-01 $\rightarrow$ FR-30, 30 Use Cases Core).  
> 2. `docs/openapi_v3.2.3.yml` (REST API Contract 40+ endpoints).  
> 3. `docs/database_v3.1.2_mysql.sql` (24 bảng 3NF).  
> 4. `.agents/memory/project-conventions.md` (Chuẩn mã Task, Deadlock-free Lock Order, 5 Invariants).  
> **Môi trường thực thi:** Localhost (Mỗi thành viên sở hữu 1 máy / 1 database độc lập, tự chủ dữ liệu 100%).  
> **Phạm vi:** Tuyến nghiệp vụ cốt lõi (Tạm hoãn phân hệ AI `UC-AI-01`, `UC-AI-02`).

---

## 📑 MỤC LỤC
1. [Khung Chuẩn Đặc Tả Nhiệm Vụ & Tiêu Chí Nghiệm Thu (DoD)](#1-khung-chuẩn-đặc-tả-nhiệm-vụ--tiêu-chí-nghiệm-thu-dod)
2. [Bảng Ma Trận 7 Gói Nhiệm Vụ UAT (RACI & Prioritization)](#2-bảng-ma-trận-7-gói-nhiệm-vụ-uat-raci--prioritization)
3. [Đặc Tả Chi Tiết 7 Gói Nhiệm Vụ (Task & Test Case Cards)](#3-đặc-tả-chi-tiết-7-gói-nhiệm-vụ-task--test-case-cards)
   - [`CEH-UAT-PKG-01`: Xác Thực, Định Danh & Bảo Vệ Phiên (AUTH)](#ceh-uat-pkg-01-xác-thực-định-danh--bảo-vệ-phiên-auth)
   - [`CEH-UAT-PKG-02`: Quản Trị Hệ Thống, Đơn Vị & Lịch Phòng (ADM & ROOM)](#ceh-uat-pkg-02-quản-trị-hệ-thống-đơn-vị--lịch-phòng-adm--room)
   - [`CEH-UAT-PKG-03`: Vòng Đời Sự Kiện, Đồng Tổ Chức & Phê Duyệt Đa Cấp (EVT)](#ceh-uat-pkg-03-vòng-đời-sự-kiện-đồng-tổ-chức--phê-duyệt-đa-cấp-evt)
   - [`CEH-UAT-PKG-04`: Khám Phá, Đặt Vé Concurrency & Hàng Đợi Waitlist (DISC & BOOK)](#ceh-uat-pkg-04-khám-phá-đặt-vé-concurrency--hàng-đợi-waitlist-disc--book)
   - [`CEH-UAT-PKG-05`: Soát Vé Hiện Trường, Kiosk TOTP QR & Chống Gian Lận (OPS & TCK)](#ceh-uat-pkg-05-soát-vé-hiện-trường-kiosk-totp-qr--chống-gian-lận-ops--tck)
   - [`CEH-UAT-PKG-06`: Cứu Xét Điểm Danh, Tính ĐRL $\Delta t$ & Chứng Nhận Số HMAC (POST-EVT)](#ceh-uat-pkg-06-cứu-xét-điểm-danh-tính-đrl-delta-t--chứng-nhận-số-hmac-post-evt)
   - [`CEH-UAT-PKG-07`: Tác Vụ Nền Tự Động (Cron), Email & Báo Cáo Chiến Lược (SYS & REP)](#ceh-uat-pkg-07-tác-vụ-nền-tự-động-cron-email--báo-cáo-chiến-lược-sys--rep)
4. [Mẫu Báo Cáo Lỗi Chuẩn (Defect Report Template)](#4-mẫu-báo-cáo-lỗi-chuẩn-defect-report-template)

---

## 1. KHUNG CHUẨN ĐẶC TẢ NHIỆM VỤ & TIÊU CHÍ NGHIỆM THU (DoD)

Mỗi gói công việc trong tài liệu này được cấu trúc theo chuẩn **Agile Task Card kết hợp ISO/IEC/IEEE 29119-3 Test Case Specification**, gồm 6 phần bắt buộc:
1. **Header định danh chuẩn:** Mã Task (`CEH-UAT-PKG-XX`), Mức ưu tiên (P0/P1/P2), Người phụ trách, Ánh xạ Use Case & Endpoint SSOT.
2. **User Story & Mục tiêu nghiệp vụ:** Mô tả bài toán dưới góc nhìn người dùng thực tế.
3. **Môi trường & Hướng dẫn tự tạo dữ liệu Local (Self-Seeding):** Cách tự setup 100% độc lập không cần người khác hỗ trợ.
4. **Ma trận Kịch bản Kiểm thử Chi tiết (Test Case Matrix):**
   - Mã Test Case (`TC-XXX-YY.ZZ`)
   - Phân loại (Positive, Negative, Boundary, Security, Concurrency)
   - Các bước thao tác (Step-by-Step)
   - Dữ liệu đầu vào (Input Data)
   - **Kỳ vọng 3 tầng (3-Tier Expected Outcome):** Giao diện (UI) $\rightarrow$ Mã mạng API (HTTP Code & Envelope) $\rightarrow$ Dữ liệu Database (Cột/Bảng).
5. **Nhiệm vụ Triển khai Mã nguồn Refactor Mock Data (Implementation Task):** Chỉ rõ file, dòng code, lỗi hiện tại và yêu cầu sửa kỹ thuật.
6. **Tiêu chí nghiệm thu (Definition of Done - DoD):** Điều kiện để Task được tính là Hoàn tất.

---

## 2. BẢNG MA TRẬN 7 GÓI NHIỆM VỤ UAT (RACI & PRIORITIZATION)

| Mã Gói | Tên Gói Nghiệp Vụ | Người nhận | Mức Ưu Tiên | Use Cases SSOT | Độ phức tạp |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **`CEH-UAT-PKG-04`** | **Đặt Vé Concurrency & Waitlist FIFO** | **Tester 4** | **P0 (Tối quan trọng)** | `UC-DISC-01/02`, `UC-BOOK-01/02/03` | Rất cao |
| **`CEH-UAT-PKG-05`** | **Soát Vé Kiosk TOTP & Chống Gian Lận** | **Tester 5** | **P0 (Tối quan trọng)** | `UC-TCK-01/02`, `UC-OPS-01/02/03/05` | Rất cao |
| **`CEH-UAT-PKG-06`** | **Cứu Xét, ĐRL $\Delta t$, Chứng Nhận HMAC** | **Tester 6** | **P0 (Tối quan trọng)** | `UC-OPS-04`, `UC-FEED-01`, `UC-CERT-01`, `UC-DRL-01` | Cao |
| **`CEH-UAT-PKG-03`** | **Vòng Đời Sự Kiện, Soft Hold & Duyệt** | **Tester 3** | **P1 (Cao)** | `UC-EVT-01/02/03`, `UC-REP-01` | Khá cao |
| **`CEH-UAT-PKG-07`** | **Tác Vụ Nền (Cron), Email & Báo Cáo** | **Tester 7** | **P1 (Cao)** | `UC-SYS-01`, `UC-NOTIF-01`, `UC-REP-02` | Khá cao |
| **`CEH-UAT-PKG-02`** | **Quản Trị Đơn Vị & Lịch Phòng Đệm 15p** | **Tester 2** | **P2 (Trung bình)** | `UC-ADM-01`, `UC-ROOM-01/02` | Trung bình |
| **`CEH-UAT-PKG-01`** | **Xác Thực, Định Danh & Bảo Vệ Phiên** | **Tester 1** | **P2 (Trung bình)** | `UC-AUTH-01..05` | Trung bình |

---

## 3. ĐẶC TẢ CHI TIẾT 7 GÓI NHIỆM VỤ (TASK & TEST CASE CARDS)

---

### `CEH-UAT-PKG-01`: XÁC THỰC, ĐỊNH DANH & BẢO VỆ PHIÊN (AUTH)
* **Mã Task:** `CEH-UAT-PKG-01`
* **Người thực hiện:** **Tester 1**
* **Mức ưu tiên:** P2 | **Ước lượng Effort:** 1.0 Ngày
* **Ánh xạ SSOT:** `UC-AUTH-01`, `UC-AUTH-02`, `UC-AUTH-03`, `UC-AUTH-04`, `UC-AUTH-05` | `POST /api/v1/auth/*`, `PUT /api/v1/auth/profile`

#### 1. User Story & Mục tiêu
> **Là một** Sinh viên UIT, **tôi muốn** đăng ký và đăng nhập hệ thống an toàn bằng email trường `@gm.uit.edu.vn`, quản lý thông tin cá nhân và phiên làm việc, **để** đảm bảo danh tính chính chủ và quyền lợi tích lũy Điểm Rèn Luyện.

#### 2. Môi trường & Hướng dẫn Tự tạo Dữ liệu Local
* **URL:** `http://localhost:5173/auth/register`, `http://localhost:5173/auth/login`.
* **Cách lấy OTP đăng ký/quên mật khẩu:** Xem trong log Laravel tại `backend/storage/logs/laravel.log` (tìm chuỗi `OTP:` hoặc mã số 6 chữ số), hoặc xem tại Mailpit `http://localhost:8025`.
* **Database reset (nếu cần):** `php artisan migrate:fresh --seed` (tạo sẵn tài khoản test).

#### 3. Ma trận Kịch bản Kiểm thử Chi tiết (Test Case Matrix)

| Mã TC | Tên kịch bản | Phân loại | Các bước thực hiện | Dữ liệu đầu vào | Kỳ vọng 3 tầng (UI - API - Database) | Trạng thái |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **`TC-AUTH-01.01`** | Đăng ký sinh viên hợp lệ | Positive | 1. Vào `/auth/register`<br>2. Nhập thông tin hợp lệ<br>3. Tích checkbox NĐ 13<br>4. Nhấn "Tiếp tục"<br>5. Nhập OTP lấy từ log | • MSSV: `21520001`<br>• Email: `21520001@gm.uit.edu.vn`<br>• Checkbox NĐ 13: checked | • **UI:** Chuyển sang form nhập OTP $\rightarrow$ Thông báo kích hoạt thành công, về trang Login.<br>• **API:** `POST /auth/register` $\rightarrow$ 200, `POST /auth/verify-registration-otp` $\rightarrow$ 200.<br>• **DB:** Bảng `tai_khoan` có bản ghi `ten_dang_nhap = '21520001'`, `dong_y_nghi_dinh_13 = 1`. | [ ] |
| **`TC-AUTH-01.02`** | Chặn MSSV không khớp Email | Negative | 1. Vào `/auth/register`<br>2. Nhập email một đằng, MSSV một nẻo<br>3. Bấm "Tiếp tục" | • MSSV: `21529999`<br>• Email: `21520001@gm.uit.edu.vn` | • **UI:** Hiện thông báo lỗi vi phạm định danh email trường.<br>• **API:** Trả về `422 Unprocessable Content`, mã lỗi `MSSV_EMAIL_MISMATCH`.<br>• **DB:** Không tạo bản ghi đệm `dang_ky_tam_thoi`. | [ ] |
| **`TC-AUTH-01.03`** | Chặn không đồng thuận Nghị định 13 | Boundary | 1. Nhập đủ thông tin hợp lệ<br>2. Bỏ trống checkbox Nghị định 13<br>3. Nhấn Đăng ký | Checkbox NĐ 13: unchecked | • **UI:** Nút bấm bị vô hiệu hóa hoặc form hiển thị cảnh báo đỏ yêu cầu đồng thuận.<br>• **API:** (Nếu gọi trực tiếp) Trả về `422` lỗi `ND13_CONSENT_REQUIRED`. | [ ] |
| **`TC-AUTH-02.01`** | Single Active Session (Đá phiên) | Security | 1. Mở Chrome đăng nhập tài khoản SV A.<br>2. Mở tab Ẩn danh (Incognito) đăng nhập cùng tài khoản SV A.<br>3. Quay lại Chrome, nhấn F5 hoặc bấm chuyển trang. | Tài khoản SV: `21520001` | • **UI:** Trình duyệt Chrome văng về trang Login kèm toast: *"Phiên làm việc đã hết hạn hoặc được đăng nhập ở thiết bị khác"**.<br>• **API:** Trả về `401 Unauthorized` do Sanctum token/session cũ bị thu hồi.<br>• **DB:** Cột `session_id` hoặc personal token trong DB chỉ lưu phiên mới nhất. | [ ] |
| **`TC-AUTH-04.01`** | Chống dò Email Quên Mật Khẩu | Security | 1. Vào `/auth/forgot-password`<br>2. Nhập một email ảo không tồn tại<br>3. Nhấn gửi | Email: `khongtontai999@gm.uit.edu.vn` | • **UI:** Vẫn hiển thị thông báo chung: *"Nếu email tồn tại, hệ thống đã gửi OTP..."*.<br>• **API:** Trả về HTTP 200 (không trả 404 để chống kẻ xấu dò danh sách email). | [ ] |

#### 4. Tiêu chí Nghiệm thu Hoàn tất (Definition of Done - DoD)
- [ ] 100% Test Cases từ `TC-AUTH-01.01` đến `TC-AUTH-04.01` đều đạt kết quả **PASS**.
- [ ] Không có lỗi console JavaScript hoặc ngoại lệ unhandled 500 phát sinh.

---

### `CEH-UAT-PKG-02`: QUẢN TRỊ HỆ THỐNG, ĐƠN VỊ & LỊCH PHÒNG (ADM & ROOM)
* **Mã Task:** `CEH-UAT-PKG-02`
* **Người thực hiện:** **Tester 2**
* **Mức ưu tiên:** P2 | **Ước lượng Effort:** 1.5 Ngày
* **Ánh xạ SSOT:** `UC-ADM-01`, `UC-ROOM-01`, `UC-ROOM-02` | `GET/POST/PUT /api/v1/admin/*`, `GET/POST/PUT /api/v1/rooms/*`

#### 1. User Story & Mục tiêu
> **Là một** Quản trị viên (Admin P.CTSV), **tôi muốn** quản lý cây phân cấp tổ chức, cấp phát tài khoản cán bộ nội bộ và quản lý danh mục phòng hội trường với thuật toán kiểm tra xung đột thời gian thực, **để** bảo đảm hạ tầng tổ chức sự kiện chính xác và không bị trùng phòng.

#### 2. Môi trường & Hướng dẫn Tự tạo Dữ liệu Local
* **Tài khoản đăng nhập:** `admin@uit.edu.vn` / mật khẩu seeder.
* **URL:** `http://localhost:5173/admin/rooms`, `http://localhost:5173/admin/organizations`, `http://localhost:5173/admin/users`.

#### 3. Ma trận Kịch bản Kiểm thử Chi tiết (Test Case Matrix)

| Mã TC | Tên kịch bản | Phân loại | Các bước thực hiện | Dữ liệu đầu vào | Kỳ vọng 3 tầng (UI - API - Database) | Trạng thái |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **`TC-ROOM-01.01`** | CRUD Hội trường mới | Positive | 1. Vào Quản lý phòng $\rightarrow$ "Thêm phòng"<br>2. Nhập tên, sức chứa, cơ sở, thiết bị<br>3. Bấm Lưu $\rightarrow$ Sửa $\rightarrow$ Xóa | Tên: `Hội trường E`, Sức chứa: `300`, Cơ sở: `CoSo1` | • **UI:** Phòng mới xuất hiện ngay trên danh sách với đầy đủ badge thiết bị.<br>• **API:** `POST /rooms` $\rightarrow$ 201, `PUT /rooms/{id}` $\rightarrow$ 200, `DELETE /rooms/{id}` $\rightarrow$ 200.<br>• **DB:** Bảng `phong_hoi_truong` có bản ghi tương ứng. | [ ] |
| **`TC-ROOM-02.01`** | Đệm an toàn phòng 15 phút (Buffer Collision) | Boundary | 1. Đặt phòng A cho Sự kiện 1 từ 08:00 - 10:00.<br>2. Vào kiểm tra lịch phòng A cho Sự kiện 2 từ 10:05 - 11:30.<br>3. Bấm "Kiểm tra khả dụng" | Phòng: A<br>Khung giờ: `10:05 - 11:30` (cách SK1 chỉ 5 phút) | • **UI:** Hiển thị cảnh báo đỏ vi phạm đệm 15 phút dọn dẹp/bàn giao.<br>• **API:** `GET /rooms/{id}/availability` trả về `{ hop_le: false, ly_do: "Vi phạm đệm an toàn 15 phút..." }`.<br>• **DB:** Không tạo bản ghi `dat_phong`. | [ ] |
| **`TC-ROOM-02.02`** | Đệm an toàn phòng 15 phút (Hợp lệ) | Positive | Kiểm tra lịch phòng A cho Sự kiện 2 từ 10:15 - 11:30 | Khung giờ: `10:15 - 11:30` (cách SK1 đúng 15 phút) | • **UI:** Hiển thị trạng thái xanh "Phòng khả dụng".<br>• **API:** `GET /rooms/{id}/availability` trả về `{ hop_le: true }`. | [ ] |
| **`TC-ADM-01.01`** | Ép đổi mật khẩu cán bộ mới lần đầu | Security | 1. Admin cấp tài khoản mới: `canbo_khoa@uit.edu.vn`<br>2. Mở tab ẩn danh đăng nhập bằng tài khoản này | Tài khoản cán bộ mới tạo | • **UI:** Hệ thống chuyển hướng thẳng sang màn hình Đổi mật khẩu lần đầu, khóa toàn bộ menu điều hướng khác cho đến khi đổi thành công.<br>• **API:** `buoc_doi_mat_khau == 1` kích hoạt middleware `password.changed`.<br>• **DB:** Sau khi đổi, `tai_khoan.buoc_doi_mat_khau = 0`. | [ ] |

#### 4. Nhiệm vụ Triển khai Mã nguồn Refactor Mock Data (Implementation Task)
* **File tác động:** [frontend/src/screens/admin/AdminPortal.tsx#L306-L340](file:///c:/Users/ADMIN/uit/IS207_PTUDW/CEHMainProject/frontend/src/screens/admin/AdminPortal.tsx#L306-L340)
* **Lỗi hiện tại:** Khối `catch` nuốt lỗi và tự trả về `ORGANIZATIONS` / `CONTRACT_TOPICS`.
* **Yêu cầu kỹ thuật:** 
  - Đổi `list` trả về đúng `res.data || []`. Khi backend rỗng, hiển thị Empty State ("Chưa có đơn vị/chủ đề nào").
  - Khi API lỗi, kích hoạt `showToast(getApiErrorMessage(err), "error")`.

#### 5. Tiêu chí Nghiệm thu Hoàn tất (DoD)
- [ ] 100% Test Cases từ `TC-ROOM-01.01` đến `TC-ADM-01.01` đều đạt kết quả **PASS**.
- [ ] Hoàn thành nhiệm vụ Refactor trên `AdminPortal.tsx`, kiểm tra khi DB rỗng không còn hiển thị dữ liệu mock.

---

### `CEH-UAT-PKG-03`: VÒNG ĐỜI SỰ KIỆN, ĐỒNG TỔ CHỨC & PHÊ DUYỆT ĐA CẤP (EVT)
* **Mã Task:** `CEH-UAT-PKG-03`
* **Người thực hiện:** **Tester 3**
* **Mức ưu tiên:** P1 | **Ước lượng Effort:** 2.0 Ngày
* **Ánh xạ SSOT:** `UC-EVT-01`, `UC-EVT-02`, `UC-EVT-03`, `UC-REP-01` | `POST /events`, `POST /events/{id}/submit-approval`, `POST /events/{id}/review`, `POST /events/{id}/withdraw`

#### 1. User Story & Mục tiêu
> **Là một** Đại diện Ban Tổ Chức (CLB/Khoa) và Cán bộ thẩm định, **tôi muốn** soạn thảo sự kiện, mời đơn vị đồng tổ chức (giữ chỗ tạm 48h), phê duyệt đa cấp theo phân cấp quản lý hoặc điều chuyển/hủy khẩn cấp, **để** bảo đảm quy trình duyệt sự kiện minh bạch và bảo toàn tài nguyên phòng ốc.

#### 2. Môi trường & Hướng dẫn Tự tạo Dữ liệu Local
* **Tài khoản test:**
  - Tab 1 (BTC Host): `btochuc@uit.edu.vn` (CLB Trực thuộc Khoa).
  - Tab 2 (Co-host B): Đăng nhập tài khoản CLB thứ hai.
  - Tab 3 (Duyệt Khoa / Admin CTSV): `admin@uit.edu.vn`.
* **URL:** `http://localhost:5173/organizer/events`, `http://localhost:5173/management/approval`.

#### 3. Ma trận Kịch bản Kiểm thử Chi tiết (Test Case Matrix)

| Mã TC | Tên kịch bản | Phân loại | Các bước thực hiện | Dữ liệu đầu vào | Kỳ vọng 3 tầng (UI - API - Database) | Trạng thái |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **`TC-EVT-02.01`** | Soft Hold 48h & Xung đột phòng tạm | Boundary | 1. BTC A tạo sự kiện, chọn Hội trường A, mời CLB B làm Co-host $\rightarrow$ Gửi đề xuất.<br>2. Dùng tài khoản C tạo sự kiện khác chọn cùng Hội trường A cùng khung giờ. | Sự kiện A: có mời Co-host | • **UI:** Sự kiện chuyển sang `WAITING_COHOST_CONFIRM`. Tài khoản C bị báo lỗi phòng đang được giữ chỗ tạm.<br>• **API:** `dat_phong` ghi nhận `trang_thai = 'TAM_GIU'`, `han_giu_cho_tam = NOW() + 48h`. | [ ] |
| **`TC-EVT-02.02`** | Co-host từ chối $\rightarrow$ Rơi về DRAFT & Nhả phòng | State Machine | CLB B đăng nhập vào mục Lời mời, nhấn "Từ chối" kèm lý do | Lời mời Co-host Sự kiện A | • **UI:** Sự kiện A tự động rơi về `DRAFT`. Phòng A lập tức được giải phóng.<br>• **API:** `POST /events/{id}/co-host-respond` $\rightarrow$ 200.<br>• **DB:** `su_kien.trang_thai = 'DRAFT'`, `dat_phong` chuyển sang `DA_HUY`. | [ ] |
| **`TC-EVT-02.03`** | Rút đề xuất (`WITHDRAW_PROPOSAL`) | State Machine | Khi sự kiện đang ở `PENDING_FACULTY` hoặc `WAITING_COHOST_CONFIRM`, BTC A nhấn "Rút đề xuất" | Sự kiện đang chờ duyệt | • **UI:** Sự kiện trở về `DRAFT`, nhả phòng.<br>• **API:** `POST /events/{id}/withdraw` $\rightarrow$ 200.<br>• **DB:** Lưu log `'WITHDRAW_PROPOSAL'` trong `nhat_ky_kiem_duyet`. | [ ] |
| **`TC-EVT-03.01`** | Phê duyệt Đa cấp Host-driven Routing | Positive | 1. CLB Khoa nộp đề xuất $\rightarrow$ Vào `PENDING_FACULTY`.<br>2. Khoa duyệt $\rightarrow$ Chuyển sang `PENDING_ADMIN`.<br>3. CTSV duyệt $\rightarrow$ Chuyển sang `APPROVED`. | Sự kiện do CLB thuộc Khoa chủ trì | • **UI:** Trạng thái sự kiện biến đổi tuần tự qua từng cấp duyệt.<br>• **API:** `POST /events/{id}/review` với hành động `KHOA_DUYET` và `CTSV_DUYET`.<br>• **DB:** Cột `trang_thai` cập nhật tương ứng, ghi nhận `nguoi_thuc_hien` trong `nhat_ky_kiem_duyet`. | [ ] |
| **`TC-EVT-03.02`** | Hủy Khẩn Cấp & Thu Hồi Phòng | Security | Admin CTSV nhấn nút "Hủy khẩn cấp" một sự kiện đã duyệt | Nhập lý do: *"Sự cố thiên tai"* | • **UI:** Sự kiện chuyển sang badge đỏ `CANCELLED`. Toàn bộ vé chuyển sang `DA_HUY`.<br>• **API:** `POST /events/{id}/emergency-cancel` $\rightarrow$ 200.<br>• **DB:** Giải phóng bản ghi `dat_phong` ngay lập tức. | [ ] |

#### 4. Nhiệm vụ Triển khai Mã nguồn Refactor Mock Data (Implementation Task)
* **File tác động:** [frontend/src/screens/organizer/Dashboard.tsx#L116-L145](file:///c:/Users/ADMIN/uit/IS207_PTUDW/CEHMainProject/frontend/src/screens/organizer/Dashboard.tsx#L116-L145)
* **Lỗi hiện tại:** Biểu đồ Pie và Line đang tính từ `tickets` context và fallback về `CHART_PIE_DATA`, `CHART_LINE_DATA`.
* **Yêu cầu kỹ thuật:** 
  - Xóa bỏ import hằng số mock biểu đồ.
  - Bind trực tiếp dữ liệu từ API `reportsService.organizerAnalytics(eventId)`: map `phan_bo_theo_khoa` vào PieChart và `luu_luong_theo_khung_gio` vào LineChart. Khi rỗng, hiển thị Empty State.

#### 5. Tiêu chí Nghiệm thu Hoàn tất (DoD)
- [ ] 100% Test Cases từ `TC-EVT-02.01` đến `TC-EVT-03.02` đạt **PASS**.
- [ ] Hoàn thành refactor biểu đồ trên `Dashboard.tsx`, hiển thị đúng dữ liệu thật từ API.

---

### `CEH-UAT-PKG-04`: KHÁM PHÁ, ĐẶT VÉ CONCURRENCY & HÀNG ĐỢI WAITLIST (DISC & BOOK)
* **Mã Task:** `CEH-UAT-PKG-04`
* **Người thực hiện:** **Tester 4**
* **Mức ưu tiên:** 🥇 **P0 (Tối quan trọng - Hạng 1)** | **Ước lượng Effort:** 2.5 Ngày
* **Ánh xạ SSOT:** `UC-DISC-01`, `UC-DISC-02`, `UC-BOOK-01`, `UC-BOOK-02`, `UC-BOOK-03` | `POST /events/{id}/book`, `POST /events/{id}/waitlist`, `POST /waitlist/{id}/claim`

#### 1. User Story & Mục tiêu
> **Là một** Sinh viên, **tôi muốn** tìm kiếm và đặt vé sự kiện với cơ chế khóa hàng chống trùng lịch, xếp hàng danh sách chờ FIFO khi hết vé và nhận lượt giữ chỗ công bằng, **để** đảm bảo có suất tham dự chính thức mà không bị tình trạng âm vé (overselling) hay chen ngang hàng đợi.

#### 2. Môi trường & Hướng dẫn Tự tạo Dữ liệu Local
* **Setup Database:**
  - Chọn 1 sự kiện `APPROVED`. Cập nhật trong bảng `su_kien`: `so_luong_toi_da = 2`, `so_ve_con_lai = 1` (để còn đúng 1 vé).
* **Tài khoản test:** Mở 2 trình duyệt riêng biệt đăng nhập 2 sinh viên:
  - SV 1: `21520001`
  - SV 2: `21520002`
* **URL:** `http://localhost:5173/events/{id}`.

#### 3. Ma trận Kịch bản Kiểm thử Chi tiết (Test Case Matrix)

| Mã TC | Tên kịch bản | Phân loại | Các bước thực hiện | Dữ liệu đầu vào | Kỳ vọng 3 tầng (UI - API - Database) | Trạng thái |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **`TC-BOOK-01.01`** | Chống trùng lịch (Schedule Conflict) | Negative | 1. SV 1 đã có vé Sự kiện A (08:00 - 11:00).<br>2. SV 1 truy cập Sự kiện B diễn ra lúc 09:00 - 10:30 cùng ngày.<br>3. Bấm nút "Đăng ký giữ chỗ ngay" | Sự kiện B trùng giờ sự kiện A | • **UI:** Xuất hiện Toast/Modal cảnh báo trùng lịch với Sự kiện A, không trừ vé.<br>• **API:** Trả về `409 Conflict`, mã lỗi `SCHEDULE_CONFLICT`.<br>• **DB:** Không tạo bản ghi `dang_ky` mới. | [ ] |
| **`TC-BOOK-01.02`** | Đua vé cuối Concurrency (Chống Oversell) | Concurrency | 1. Sự kiện còn đúng 1 vé.<br>2. Mở SV 1 trên Chrome, SV 2 trên Edge.<br>3. Cùng đếm "3-2-1" và nhấn nút Đăng ký đồng thời. | Sự kiện còn 1 vé | • **UI:** Một sinh viên báo thành công có mã vé; sinh viên còn lại nhận thông báo hết vé và nút chuyển thành "Vào Danh sách chờ".<br>• **API:** Một request trả 201, request kia trả `409` (`EVENT_SOLD_OUT`).<br>• **DB:** `so_ve_con_lai = 0` (tuyệt đối không âm `-1`), bảng `dang_ky` chỉ có đúng 1 bản ghi mới. | [ ] |
| **`TC-BOOK-02.01`** | Tham gia Danh sách chờ (Waitlist FIFO) | Positive | Khi sự kiện hết vé, SV 2 bấm nút "Vào Danh sách chờ (Waitlist)" | Sự kiện `so_ve_con_lai == 0` | • **UI:** Nút chuyển sang trạng thái "Đang trong hàng chờ (Hạng #1)".<br>• **API:** `POST /events/{id}/waitlist` $\rightarrow$ 201.<br>• **DB:** Bảng `hang_doi_waitlist` tạo bản ghi với `trang_thai = 'WAITING'`, `thu_tu_hang = 1`. | [ ] |
| **`TC-BOOK-03.01`** | Cấp Claim Offer khi có người hủy | State Machine | 1. SV 1 thực hiện hủy vé trước $T-4\text{h}$.<br>2. Kiểm tra trạng thái của SV 2 trong hàng đợi. | SV 1 hủy vé | • **UI:** SV 2 xuất hiện nút nổi bật "Nhận vé (Còn 60 phút)".<br>• **API:** Bản ghi waitlist của SV 2 chuyển sang `OFFERED`.<br>• **DB:** `thoi_gian_het_han_giu_cho` được tính chính xác $\min(\text{NOW()}+60\text{m}, T-2\text{h})$. | [ ] |
| **`TC-BOOK-03.02`** | Đóng băng Slot sàn 15 phút chống chen ngang | Boundary | Chỉnh giờ sự kiện sao cho cách mốc $T-2\text{h}$ chỉ còn 10 phút ($< 15\text{m}$). SV 1 hủy vé. | Thời gian cách $T-2\text{h}$ dưới 15 phút | • **UI:** Giao diện sự kiện không mở bán vé công khai cho người ngoài.<br>• **API:** Không cấp thêm offer mới.<br>• **DB:** `su_kien.so_slot_dong_bang` tăng lên 1; slot bị đóng băng nguyên tử. | [ ] |

#### 4. Nhiệm vụ Triển khai Mã nguồn Refactor Mock Data (Implementation Task)
* **File tác động:** [frontend/src/context/TicketDataContext.tsx#L269](file:///c:/Users/ADMIN/uit/IS207_PTUDW/CEHMainProject/frontend/src/context/TicketDataContext.tsx#L269)
* **Lỗi hiện tại:** State `tickets` khởi tạo bằng mảng mock `TICKETS`.
* **Yêu cầu kỹ thuật:** Khởi tạo `useState<Ticket[]>([])` rỗng. Kiểm tra luồng săn vé khi state ban đầu rỗng đảm bảo vé được thêm vào mảng mượt mà.

#### 5. Tiêu chí Nghiệm thu Hoàn tất (DoD)
- [ ] 100% Test Cases từ `TC-BOOK-01.01` đến `TC-BOOK-03.02` đạt **PASS**.
- [ ] Chứng minh thực nghiệm không bao giờ xảy ra lỗi âm vé khi test tương tranh.

---

### `CEH-UAT-PKG-05`: SOÁT VÉ HIỆN TRƯỜNG, KIOSK TOTP QR & CHỐNG GIAN LẬN (OPS & TCK)
* **Mã Task:** `CEH-UAT-PKG-05`
* **Người thực hiện:** **Tester 5**
* **Mức ưu tiên:** 🥈 **P0 (Tối quan trọng - Hạng 2)** | **Ước lượng Effort:** 2.5 Ngày
* **Ánh xạ SSOT:** `UC-TCK-01`, `UC-TCK-02`, `UC-OPS-01`, `UC-OPS-02`, `UC-OPS-03`, `UC-OPS-05` | `POST /kiosk/*`, `POST /attendance/*`

#### 1. User Story & Mục tiêu
> **Là một** Nhân viên soát vé và Sinh viên tham dự, **tôi muốn** trình chiếu mã Dynamic TOTP 30s tại Kiosk, quét vé hai chiều với cơ chế chống quét hộ Device Binding và kiểm soát thời gian ra vào, **để** đảm bảo tính trung thực tuyệt đối của việc có mặt tại hội trường.

#### 2. Môi trường & Hướng dẫn Tự tạo Dữ liệu Local
* **Thiết bị:** 1 máy tính mở Kiosk trình chiếu QR (`/organizer/kiosk`), 1 điện thoại di động (hoặc tab thứ hai) mở camera/quét mã.
* **Tài khoản test:** Tài khoản BTC mở Kiosk, Tài khoản Staff soát vé tại bàn, Tài khoản Sinh viên tham dự.

#### 3. Ma trận Kịch bản Kiểm thử Chi tiết (Test Case Matrix)

| Mã TC | Tên kịch bản | Phân loại | Các bước thực hiện | Dữ liệu đầu vào | Kỳ vọng 3 tầng (UI - API - Database) | Trạng thái |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **`TC-TCK-02.01`** | Khóa hủy vé tại ranh giới $T-4\text{h}$ | Boundary | Chỉnh giờ bắt đầu sự kiện trong DB sao cho còn cách hiện tại 3 tiếng 50 phút ($< 4\text{h}$). Sinh viên vào Ví vé. | Sự kiện cách giờ bắt đầu $< 4\text{h}$ | • **UI:** Nút "Hủy vé" bị disabled hoặc ấn vào hiện popup chặn quá hạn.<br>• **API:** `POST /tickets/{id}/cancel` trả về `400/409` (`TICKET_CANCEL_LOCKED_T4H`).<br>• **DB:** Trạng thái vé giữ nguyên `DaDangKy`. | [ ] |
| **`TC-OPS-01.01`** | Dynamic TOTP 30 giây hết hạn | Security | 1. Mở màn Kiosk. Dùng điện thoại chụp ảnh mã QR lại.<br>2. Đợi 35–40 giây cho Kiosk xoay sang mã TOTP chu kỳ mới.<br>3. Dùng ứng dụng quét mã từ ảnh chụp cũ. | Ảnh chụp QR TOTP cũ | • **UI:** Ứng dụng báo lỗi "Mã QR đã hết hạn, vui lòng quét mã mới trên màn chiếu".<br>• **API:** Trả về `400 Bad Request`, mã lỗi `INVALID_OR_EXPIRED_TOTP`.<br>• **DB:** Không cập nhật điểm danh. | [ ] |
| **`TC-OPS-03.01`** | Chống quét hộ (Device Binding) | Anti-Fraud | 1. SV A dùng điện thoại X quét check-in $\rightarrow$ Thành công.<br>2. Đăng xuất SV A, đăng nhập SV B trên cùng điện thoại X.<br>3. SV B quét check-in cùng sự kiện đó. | Cùng 1 `device_id` quét cho 2 tài khoản | • **UI:** Hệ thống cảnh báo phát hiện thiết bị nghi vấn, từ chối điểm danh tự động, yêu cầu gặp Staff đối soát thẻ.<br>• **API:** Trả về `403` hoặc cờ `canh_bao_doi_soat_the = 1`.<br>• **DB:** Ghi nhận `ma_thiet_bi_nghi_van` vào bảng `dang_ky`. | [ ] |
| **`TC-OPS-05.01`** | Event-scoped Staff Phân quyền chéo | Security | Gán tài khoản Staff cho Sự kiện 1. Cầm máy Staff đó quét vé của Sự kiện 2. | Vé thuộc sự kiện 2 | • **UI:** Máy quét báo lỗi: *"Vé không thuộc sự kiện bạn được phân công"**.<br>• **API:** Trả về `403 Forbidden` (`STAFF_EVENT_MISMATCH`). | [ ] |
| **`TC-OPS-02.01`** | Fallback Check-out tại bàn đón tiếp | Fallback | Giả lập Kiosk hỏng. Staff chuyển sang màn hình quét vé tại bàn, chọn chế độ "Check-out", quét mã vé HMAC của SV. | Mã vé HMAC sinh viên | • **UI:** Báo Check-out thành công cho sinh viên.<br>• **API:** `POST /attendance/staff-scan` với `che_do_quet = 'CHECK_OUT'` $\rightarrow$ 200.<br>• **DB:** Cập nhật `thoi_gian_check_out = NOW()`. | [ ] |

#### 4. Nhiệm vụ Triển khai Mã nguồn Refactor Mock Data (Implementation Task)
* **Files tác động:** [Staff.tsx](file:///c:/Users/ADMIN/uit/IS207_PTUDW/CEHMainProject/frontend/src/screens/organizer/Staff.tsx) và [AdminStaff.tsx](file:///c:/Users/ADMIN/uit/IS207_PTUDW/CEHMainProject/frontend/src/screens/admin/AdminStaff.tsx).
* **Lỗi hiện tại:** Dùng `STAFF_LIST` mock khi DB rỗng; dùng hàm `generateToken()` tạo chuỗi token giả trên RAM.
* **Yêu cầu kỹ thuật:**
  1. Khởi tạo `staffItems = []`. Khi API trả về rỗng, hiển thị Empty State ("Chưa phân công nhân viên nào").
  2. Xóa bỏ hàm `generateToken()`; phân công staff bằng gọi API `attendanceService.assignStaff`.
  3. Xóa bỏ logic điểm danh in-memory trong `TicketDataContext.tsx`.

#### 5. Tiêu chí Nghiệm thu Hoàn tất (DoD)
- [ ] 100% Test Cases từ `TC-TCK-02.01` đến `TC-OPS-02.01` đạt **PASS**.
- [ ] Hoàn thành refactor `Staff.tsx`, dọn sạch token giả và mock data.

---

### `CEH-UAT-PKG-06`: CỨU XÉT ĐIỂM DANH, TÍNH ĐRL $\Delta t$ & CHỨNG NHẬN SỐ HMAC (POST-EVT)
* **Mã Task:** `CEH-UAT-PKG-06`
* **Người thực hiện:** **Tester 6**
* **Mức ưu tiên:** 🥉 **P0 (Tối quan trọng - Hạng 3)** | **Ước lượng Effort:** 2.0 Ngày
* **Ánh xạ SSOT:** `UC-OPS-04`, `UC-FEED-01`, `UC-CERT-01`, `UC-DRL-01` | `POST /attendance/manual-override`, `GET /certificates/*`, `POST /drl/lock`

#### 1. User Story & Mục tiêu
> **Là một** Sinh viên và Cán bộ CTSV, **tôi muốn** đánh giá khảo sát 48h, nhận giấy chứng nhận điện tử HMAC (bảo vệ dữ liệu cá nhân theo NĐ 13), cứu xét sai sót điểm danh có lưu vết kiểm toán và khóa chốt xuất danh sách ĐRL chuẩn mẫu, **để** bảo đảm quyền lợi rèn luyện chính xác của sinh viên.

#### 2. Môi trường & Hướng dẫn Tự tạo Dữ liệu Local
* **Setup Database:**
  - Chỉnh 1 sự kiện sang `COMPLETED`.
  - Tạo sẵn 3 vé trong bảng `dang_ky` với các giờ điểm danh:
    - Vé 1: Tham gia đủ 90% thời lượng.
    - Vé 2: Tham gia 60% thời lượng.
    - Vé 3: Tham gia 30% thời lượng.
* **URL:** `http://localhost:5173/student/achievements`, `http://localhost:5173/management/affairs`.

#### 3. Ma trận Kịch bản Kiểm thử Chi tiết (Test Case Matrix)

| Mã TC | Tên kịch bản | Phân loại | Các bước thực hiện | Dữ liệu đầu vào | Kỳ vọng 3 tầng (UI - API - Database) | Trạng thái |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **`TC-DRL-01.01`** | Công thức thời lượng $\Delta t$ & Bậc ĐRL | Business Rule | Vào xem tính toán ĐRL của 3 vé mẫu đã chuẩn bị | 3 vé có thời lượng khác nhau | • **UI:** Vé 1 hưởng 100% ĐRL; Vé 2 hưởng 50% ĐRL; Vé 3 hưởng 0% ĐRL.<br>• **DB:** Trường `ti_le_drl` lưu tương ứng `1.0`, `0.5`, `0.0`. | [ ] |
| **`TC-OPS-04.01`** | Cứu xét Sửa tay & Audit Trail | Audit | BTC vào sửa tay trạng thái điểm danh cho vé 3 lên 100% ĐRL | Nhập lý do: *"Hỗ trợ kỹ thuật hội trường"* | • **UI:** Hiện popup bắt buộc nhập lý do cứu xét $\rightarrow$ Lưu thành công.<br>• **API:** `POST /attendance/manual-override` $\rightarrow$ 200.<br>• **DB:** Lưu log vào `nhat_ky_diem_danh` ghi nhận `ti_le_drl_cu = 0.0`, `ti_le_drl_moi = 1.0`, người sửa và lý do. | [ ] |
| **`TC-CERT-01.01`** | Che mờ PII Nghị định 13 trên PDF | Compliance | Sinh viên bấm tải PDF Chứng nhận tham gia sự kiện | Vé hợp lệ | • **UI:** Tải file `chung-nhan-{id}.pdf`.<br>• **PDF Content:** Họ tên và MSSV bị che mờ một phần (ví dụ: `Nguyễn V*** A`, `2152****`), có mã QR xác thực HMAC. | [ ] |
| **`TC-CERT-01.02`** | Thu hồi Chứng nhận số (Revoke) | Security | 1. Quét QR trên PDF $\rightarrow$ Mở trang web xác thực: báo hợp lệ.<br>2. Admin vào bấm "Thu hồi chứng nhận" kèm lý do.<br>3. Quét lại mã QR trên PDF. | Mã hash chứng nhận | • **UI:** Trang web chuyển sang màn hình cảnh báo đỏ: *"CHỨNG NHẬN ĐÃ BỊ THU HỒI"*, chặn tải lại file.<br>• **API:** `POST /admin/certificates/{id}/revoke` $\rightarrow$ 200.<br>• **DB:** `chung_nhan.da_thu_hoi = 1`. | [ ] |
| **`TC-DRL-01.02`** | Đóng băng danh sách ĐRL & Xuất Excel | Positive | Admin CTSV bấm "Khóa chốt ĐRL" $\rightarrow$ Bấm "Xuất file Excel" | Sự kiện hoàn tất | • **UI:** Tải file `.xlsx` chuẩn mẫu CTSV. Mọi nút sửa tay điểm danh của sự kiện bị khóa cứng.<br>• **API:** `POST /events/{id}/drl/lock` $\rightarrow$ 200.<br>• **DB:** `su_kien.da_chot_drl = 1`. | [ ] |

#### 4. Nhiệm vụ Triển khai Mã nguồn Refactor Mock Data (Implementation Task)
* **File tác động:** [frontend/src/screens/management/AffairsOperations.tsx#L109](file:///c:/Users/ADMIN/uit/IS207_PTUDW/CEHMainProject/frontend/src/screens/management/AffairsOperations.tsx#L109) và [ApprovalDataContext.tsx](file:///c:/Users/ADMIN/uit/IS207_PTUDW/CEHMainProject/frontend/src/context/ApprovalDataContext.tsx#L341).
* **Lỗi hiện tại:** Bẫy `(!attendanceRecords || attendanceRecords.length === 0)` nuốt lỗi do luôn có sẵn `SEED_ATTENDANCE` mock.
* **Yêu cầu kỹ thuật:** Khởi tạo `attendanceRecords = []` và `certificates = []`. Bỏ điều kiện bẫy trên để khi API lỗi thì bắt buộc kích hoạt `showToast(getApiErrorMessage(err), "error")`.

#### 5. Tiêu chí Nghiệm thu Hoàn tất (DoD)
- [ ] 100% Test Cases từ `TC-DRL-01.01` đến `TC-DRL-01.02` đạt **PASS**.
- [ ] Hoàn thành refactor `AffairsOperations.tsx`, xử lý dứt điểm lỗi nuốt thông báo lỗi.

---

### `CEH-UAT-PKG-07`: TÁC VỤ NỀN TỰ ĐỘNG (CRON), EMAIL & BÁO CÁO CHIẾN LƯỢC (SYS & REP)
* **Mã Task:** `CEH-UAT-PKG-07`
* **Người thực hiện:** **Tester 7**
* **Mức ưu tiên:** P1 | **Ước lượng Effort:** 2.0 Ngày
* **Ánh xạ SSOT:** `UC-SYS-01`, `UC-NOTIF-01`, `UC-REP-02` | `php artisan schedule:run`, `GET /admin/analytics/macro`

#### 1. User Story & Mục tiêu
> **Là một** Quản trị viên hệ thống và Trưởng phòng CTSV, **tôi muốn** các tiến trình tự động nền (Cron jobs) chuyển trạng thái vòng đời sự kiện, quét No-show an toàn không phạt oan sinh viên, mở cổng check-out dự phòng và tổng hợp Dashboard báo cáo vĩ mô toàn trường, **để** bảo đảm hệ thống vận hành tự động và số liệu phân tích chính xác 100%.

#### 2. Môi trường & Hướng dẫn Tự tạo Dữ liệu Local
* **Terminal Backend:** Chạy các lệnh kiểm thử cron trực tiếp:
  ```bash
  php artisan schedule:run
  # hoặc: php artisan ceh:transition-events
  # hoặc: php artisan ceh:scan-no-show
  ```
* **URL:** `http://localhost:5173/admin/portal` (Tab Báo cáo vĩ mô).

#### 3. Ma trận Kịch bản Kiểm thử Chi tiết (Test Case Matrix)

| Mã TC | Tên kịch bản | Phân loại | Các bước thực hiện | Dữ liệu đầu vào | Kỳ vọng 3 tầng (UI - API - Database) | Trạng thái |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **`TC-SYS-01.01`** | Quét No-show An toàn (Sự kiện Mở tự do) | Safety Invariant | Tạo sự kiện loại "Mở tự do" (`khong_gioi_han_slot = 1`). Sinh viên đăng ký nhưng không check-in. Cho sự kiện kết thúc $\rightarrow$ Chạy lệnh quét No-show. | Sự kiện mở tự do | • **Kỳ vọng:** Sinh viên tuyệt đối **KHÔNG bị gắn cờ No-show**.<br>• **DB:** `dang_ky.vi_pham_no_show = 0`. | [ ] |
| **`TC-SYS-01.02`** | Quét No-show An toàn (BTC quên mở cổng) | Safety Invariant | Tạo sự kiện giới hạn slot. **BTC không mở cổng Check-in** trong suốt thời gian diễn ra sự kiện. Sự kiện kết thúc $\rightarrow$ Chạy lệnh quét No-show. | Sự kiện không mở cổng check-in | • **Kỳ vọng:** Bảo vệ quyền lợi sinh viên! Hệ thống nhận diện lỗi từ BTC, **KHÔNG phạt bất kỳ sinh viên nào**.<br>• **DB:** `dang_ky.vi_pham_no_show = 0`. | [ ] |
| **`TC-SYS-01.03`** | Fallback Check-out tự động (Tác vụ 4) | Fallback | Sự kiện chạm giờ kết thúc kế hoạch nhưng BTC quên bấm mở cổng Check-out. Chạy cron Tác vụ 4. | Sự kiện kết thúc chưa mở cổng checkout | • **Kỳ vọng:** Tác vụ tự động kích hoạt chế độ Check-out dự phòng.<br>• **DB:** Ghi log hệ thống `nguoi_thuc_hien = NULL` vào `nhat_ky_kiem_duyet`. | [ ] |
| **`TC-SYS-01.04`** | Gom số liệu ngày 00:05 (Tác vụ 6) | Data Pipeline | Chạy lệnh gom số liệu thống kê ngày: `php artisan ceh:aggregate-daily-stats` | Sự kiện hoàn tất trong ngày | • **DB:** Tạo/cập nhật bản ghi trong bảng `thong_ke_su_kien_ngay`. | [ ] |
| **`TC-REP-02.01`** | Đối soát Tính toàn vẹn Dashboard Vĩ mô | Data Integrity | Đăng nhập Admin vào xem Dashboard vĩ mô. Đếm đối chiếu trực tiếp với database: tổng sự kiện, tổng sinh viên, số vi phạm No-show. | Dữ liệu DB hiện tại | • **UI:** Các con số và biểu đồ trên Dashboard khớp chính xác 100% với dữ liệu truy vấn từ database, không lệch một đơn vị nào. | [ ] |

#### 4. Tiêu chí Nghiệm thu Hoàn tất (DoD)
- [ ] 100% Test Cases từ `TC-SYS-01.01` đến `TC-REP-02.01` đạt **PASS**.
- [ ] Xác nhận không có hiện tượng phạt oan No-show trong cả 2 trường hợp an toàn.

---

## 4. MẪU BÁO CÁO LỖI CHUẨN (DEFECT REPORT TEMPLATE)

Khi phát hiện bất kỳ lỗi nào trong quá trình chạy UAT, thành viên lập phiếu theo định dạng chuẩn:

```markdown
### [BUG] - [MÃ GÓI] - [MÃ TC] - [Tiêu đề lỗi ngắn gọn]
* **Mã Test Case liên quan:** (ví dụ: TC-BOOK-01.02, TC-OPS-03.01, ...)
* **Phân loại lỗi:**
  - [ ] P0 - Critical (Chặn đứng luồng, âm vé, mất dữ liệu, gian lận thiết bị)
  - [ ] P1 - High (Sai lệch nghiệp vụ biên, lỗi phân quyền RBAC, sai công thức ĐRL)
  - [ ] P2 - Medium (Giao diện hiển thị mock data, thiếu Empty State, lỗi UX)
* **Môi trường & Tài khoản:** (Role: SinhVien/BTC/Admin, Email: ...)
* **Các bước tái hiện (Steps to Reproduce):**
  1. Vào trang ...
  2. Nhập dữ liệu ...
  3. Bấm nút ...
* **Kết quả kỳ vọng (Expected):** (Theo mô tả 3 tầng của Test Case)
* **Kết quả thực tế (Actual):** (Mô tả chi tiết những gì diễn ra trên UI, Network, DB)
* **Bằng chứng đính kèm (Evidence):** (Ảnh chụp màn hình, Mã lỗi API, Log console/terminal)
```
