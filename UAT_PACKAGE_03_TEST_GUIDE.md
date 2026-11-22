# KẾ HOẠCH & HƯỚNG DẪN KIỂM THỬ UAT GÓI SỐ 3 (CEH-UAT-PKG-03)
## VÒNG ĐỜI SỰ KIỆN, ĐỒNG TỔ CHỨC, PHÊ DUYỆT ĐA CẤP & DASHBOARD BÁO CÁO BTC

> **Mã tài liệu:** `CEH-UAT-PKG-03-GUIDE-v1.0`  
> **Ánh xạ Use Cases (SSOT):** `UC-EVT-01`, `UC-EVT-02`, `UC-EVT-03`, `UC-REP-01`  
> **Căn cứ kỹ thuật (SSOTs):**  
> 1. `docs/srs_v3_1_3.md` (FR-09, FR-10, FR-11, FR-26)  
> 2. `docs/openapi_v3.2.3.yml` (Event Lifecycle, Co-host, Review, Emergency & Reports REST API)  
> 3. `docs/database_v3.1.2_mysql.sql` (Schema `su_kien`, `su_kien_dong_to_chuc`, `dat_phong`, `nhat_ky_kiem_duyet`, `dang_ky`, `v_event_analytics`)  
> 4. `UAT_HANDOVER_SPECIFICATION.md` (Gói `CEH-UAT-PKG-03` - Tester 3)  
> **Môi trường thực thi:** Localhost (`http://localhost:5173`, Backend API: `http://localhost:8000`, Mailpit: `http://localhost:8025`)  
> **Seeder chuyên biệt:** `backend/database/seeders/UatPkg03EventLifecycleSeeder.php`

---

## 🔑 I. DANH SÁCH TÀI KHOẢN TEST (ACTOR ROSTER)

Toàn bộ tài khoản đã được kích hoạt cờ Nghị định 13 (`dong_y_nghi_dinh_13 = 1`), mật khẩu đã được băm bằng Bcrypt cost=12 sẵn sàng đăng nhập:

| Vai trò / Đơn vị | Email đăng nhập | Mật khẩu | Mã đơn vị / Đơn vị cha | Quyền & Trách nhiệm trong Gói 3 |
| :--- | :--- | :---: | :---: | :--- |
| **Host A (Chủ trì chính)** | `clb.webdev@uit.edu.vn` | `Club@123` | ID: 9 (Trực thuộc Khoa HTTT - ID: 1) | Soạn thảo sự kiện, cấu hình slot, gửi duyệt, rút đề xuất, xem Dashboard BTC |
| **Co-host B (Đồng tổ chức)** | `clb.aiclub@uit.edu.vn` | `Club@123` | ID: 10 (Trực thuộc Khoa KHMT - ID: 2) | Nhận lời mời đồng tổ chức, bấm Xác nhận Đồng ý / Từ chối |
| **Khoa Parent của Host A** | `canbo.httt@uit.edu.vn` | `Faculty@123` | ID: 1 (Khoa HTTT - Cấp Khoa) | Thẩm định cấp 1 (`PENDING_FACULTY` $\rightarrow$ `PENDING_ADMIN`) |
| **Admin P.CTSV (Cấp Trường)** | `admin@uit.edu.vn` | `Admin@123` | ID: 7 (Phòng CTSV) | Phê duyệt cấp 2, Duyệt thay Khoa, Điều chuyển phòng, Hủy khẩn cấp |
| **Đơn vị ngoài lề (Security)** | `clb.cyber@uit.edu.vn` | `Club@123` | ID: 11 (CLB ATTT) | Kiểm thử bảo mật chặn `403 Forbidden` khi truy cập Dashboard báo cáo |
| **Sinh viên kiểm thử vé** | `21520001@gm.uit.edu.vn` | `Student@123` | MSSV: `21520001` (Khoa HTTT) | Giữ vé test sự kiện hủy khẩn cấp |

> [!TIP]
> **Lệnh nạp/khôi phục dữ liệu UAT Gói 3 bất kỳ lúc nào:**  
> Nếu trong quá trình test bạn đã bấm duyệt hoặc chuyển trạng thái và muốn phục hồi lại 10 sự kiện về trạng thái ban đầu, chỉ cần chạy lệnh:
> ```powershell
> docker exec -it cehmainproject-app-1 php artisan db:seed --class=UatPkg03EventLifecycleSeeder
> ```

---

## 🗄️ II. MA TRẬN 10 SỰ KIỆN TEST VÒNG ĐỜI & EDGE CASES (ID: 301 $\rightarrow$ 310)

File seeder `UatPkg03EventLifecycleSeeder.php` đã tạo sẵn 10 sự kiện tương ứng với từng Use Case và kịch bản:

| Mã SK | Tên sự kiện | Trạng thái ban đầu | Phòng & Sức chứa | Mục tiêu kịch bản kiểm thử |
| :---: | :--- | :---: | :--- | :--- |
| **`301`** | **Workshop Clean Architecture** | `DRAFT` | Hội trường E (500 chỗ) | Test form soạn thảo, validate sức chứa, thời gian & bấm Gửi duyệt có mời Co-host (`UC-EVT-01`, `UC-EVT-02.01`). |
| **`302`** | **Hackathon AI for Smart Campus** | `WAITING_COHOST_CONFIRM` | Hội trường A (Soft hold 48h) | Test Co-host CLB AI bấm **"Xác nhận Đồng ý"** $\rightarrow$ Tự động chuyển sang `PENDING_FACULTY` (`UC-EVT-02.AC.1`). |
| **`303`** | **Tọa đàm Khởi nghiệp & Gọi vốn** | `WAITING_COHOST_CONFIRM` | Phòng C109 (Soft hold 48h) | Test Co-host CLB AI bấm **"Từ chối"** kèm lý do $\rightarrow$ Hủy giữ phòng & rơi về `COHOST_REJECTED` (`UC-EVT-02.AC.2`). |
| **`304`** | **Hội thảo Database Concurrency** | `PENDING_FACULTY` | Phòng B114 (100 chỗ) | Test Host A bấm **"Rút đề xuất" (`WITHDRAW_PROPOSAL`)** $\rightarrow$ Giải phóng phòng và rơi về `DRAFT` (`UC-EVT-02.AC.3`). |
| **`305`** | **Seminar Cybersecurity** | `PENDING_FACULTY` | Hội trường E (500 chỗ) | **Luồng chuẩn Đa cấp**: Khoa HTTT duyệt $\rightarrow$ `PENDING_ADMIN` $\rightarrow$ CTSV duyệt $\rightarrow$ `APPROVED` (`TC-EVT-03.01`). |
| **`306`** | **Ngày hội Văn hóa Công nghệ** | `PENDING_FACULTY` | Hội trường A (300 chỗ) | Test **Admin Duyệt thay cấp Khoa (`ADMIN OVERRIDE`)** với lý do bắt buộc $\rightarrow$ Chuyển `PENDING_ADMIN` hoặc `APPROVED` (`UC-EVT-03.AC.1`). |
| **`307`** | **Workshop Mock Interview** | `PENDING_FACULTY` | Phòng C109 (150 chỗ) | Test Khoa/Admin **"Từ chối"** $\rightarrow$ `REJECTED` $\rightarrow$ Host A bấm **"Chỉnh sửa lại" (`reopen`)** về `DRAFT` (`UC-EVT-03.AC.2/3`). |
| **`308`** | **Diễn đàn Cloud Native & K8s** | `APPROVED` | Hội trường A (120 vé) | Test Admin **"Điều chỉnh phòng khẩn cấp" (`CHANGE_ROOM`)** sang Phòng C109 (150 chỗ) & Chặn đổi sang B114 (100 chỗ) (`UC-EVT-03.AC.4`). |
| **`309`** | **Đại nhạc hội Tân sinh viên** | `PUBLISHED` | Hội trường E (Đã có 2 vé đặt) | Test Admin/Host bấm **"Hủy khẩn cấp" (`EMERGENCY_CANCEL`)** $\rightarrow$ Giải phóng phòng & tự động hủy vé, không phạt No-show (`UC-EVT-03.AC.5`). |
| **`310`** | **Tổng kết Cuộc thi UIT DevFest** | `COMPLETED` | Hội trường E (Có Co-host Khoa) | **Dashboard BTC (`UC-REP-01`)**: 80 vé đặt, 60 check-in (75%), 50 check-out, 20 No-show, 30 feedback, phân bổ 4 khoa, test chặn 403. |

---

## 🧭 III. HƯỚNG DẪN KIỂM THỬ CHI TIẾT TỪNG BƯỚC (STEP-BY-STEP UAT)

---

### 📌 LUỒNG 1: SOẠN THẢO, SOFT HOLD 48H, CO-HOST ĐỒNG THUẬN & RÚT ĐỀ XUẤT (`UC-EVT-01`, `UC-EVT-02`)

#### Bước 1.1: Soạn thảo sự kiện & Kiểm tra Boundary/Exception (`UC-EVT-01`)
1. Truy cập `http://localhost:5173/login`.
2. Đăng nhập tài khoản **Host A**: `clb.webdev@uit.edu.vn` / `Club@123`.
3. Vào menu **"Sự kiện của tôi"** $\rightarrow$ Bấm nút **"+ Tạo sự kiện mới"** (`http://localhost:5173/organizer/events/create`).
4. **Test Exception 1 (Sức chứa vượt quá quy định phòng - `UC-EVT-01.EX.1`):**
   - Chọn Hội trường: **Phòng B114** (sức chứa tối đa 100).
   - Chọn loại sự kiện: Giới hạn slot (`khong_gioi_han_slot = 0`).
   - Nhập Số lượng vé phát hành: `150` ($150 > 100$).
   - Nhấn "Lưu bản nháp" $\rightarrow$ **Kỳ vọng:** Form chặn lưu và báo lỗi: *"Số lượng vé tối đa không được vượt quá sức chứa của phòng (100 chỗ)"*.
5. **Test Exception 2 (Thời gian không hợp lệ - `UC-EVT-01.EX.2`):**
   - Đặt thời gian bắt đầu ở một ngày trong quá khứ, hoặc đặt thời gian kết thúc trước thời gian bắt đầu.
   - Nhấn "Lưu bản nháp" $\rightarrow$ **Kỳ vọng:** Form chặn và API trả về `422 Unprocessable Content`.

---

#### Bước 1.2: Soft Hold 48h & Kiểm tra Xung đột Phòng tạm thời (`TC-EVT-02.01`)
1. Ở tài khoản **Host A**, mở sự kiện **ID 301** (đang ở `DRAFT`) hoặc tạo một sự kiện mới:
   - Phòng: **Hội trường E** (hoặc Hội trường A).
   - Khung giờ: Sau 5 ngày (08:00 - 11:30).
   - Danh sách đồng tổ chức: Tích chọn **CLB Trí tuệ Nhân tạo (AI Club)**.
   - Bấm nút **"Gửi phê duyệt"**.
2. **Kỳ vọng 3 tầng:**
   - **UI:** Badge trạng thái chuyển sang màu vàng: `Chờ đồng tổ chức xác nhận` (`WAITING_COHOST_CONFIRM`).
   - **API:** Gọi `POST /api/v1/events/301/submit-approval` $\rightarrow$ Trả về `200 OK`.
   - **Database:** Bảng `dat_phong` tạo bản ghi với `trang_thai = 'PENDING'`, cột `han_giu_cho_tam` có giá trị đúng bằng $\text{NOW()} + 48\text{h}$.
3. **Thử nghiệm Xung đột Giữ chỗ Tạm (Collision Test):**
   - Mở cửa sổ Ẩn danh (Incognito) đăng nhập tài khoản Cán bộ Khoa khác hoặc Admin.
   - Tạo một sự kiện mới chọn đúng **Hội trường E** và đúng khung giờ 08:00 - 11:30 của sự kiện 301.
   - Nhấn "Gửi phê duyệt" $\rightarrow$ **Kỳ vọng:** Hệ thống từ chối với thông báo: *"Phòng hội trường đã có đơn vị khác giữ chỗ tạm thời trong khung giờ này"* (HTTP `409 Conflict`, mã lỗi `ROOM_SLOT_ALREADY_BOOKED`).

---

#### Bước 1.3: Co-host Đồng ý 100% $\rightarrow$ Tự động chuyển Cấp Khoa (`TC-EVT-02.01` & `UC-EVT-02.AC.1`)
1. Đăng nhập tài khoản **Co-host B**: `clb.aiclub@uit.edu.vn` / `Club@123`.
2. Vào mục **"Lời mời Đồng tổ chức"** (`http://localhost:5173/organizer/cohost-invitations`).
3. Mở xem sự kiện **ID 302** (*"E2E-PKG03: Hackathon AI for Smart Campus 2026"*).
4. Bấm nút **"Xác nhận Đồng ý"**.
5. **Kỳ vọng 3 tầng:**
   - **UI:** Toast hiển thị thành công; thẻ lời mời chuyển sang trạng thái "Đã chấp nhận".
   - **API:** Gọi `POST /api/v1/events/302/co-host-respond` với payload `{"trang_thai_xac_nhan": "DONG_Y"}` $\rightarrow$ Trả về `200 OK`.
   - **Database:**
     - Bảng `su_kien_dong_to_chuc` cập nhật `trang_thai_xac_nhan = 'DONG_Y'`, `thoi_gian_phan_hoi = NOW()`.
     - Vì đạt 100% đồng thuận: `dat_phong.han_giu_cho_tam` tự động được xóa về `NULL`.
     - Do Host là CLB trực thuộc Khoa HTTT, sự kiện tự động chuyển trạng thái `su_kien.trang_thai = 'PENDING_FACULTY'` (chờ Cấp Khoa duyệt).

---

#### Bước 1.4: Co-host Từ chối $\rightarrow$ Rơi về COHOST_REJECTED & Giải phóng phòng (`TC-EVT-02.02`)
1. Ở tài khoản **Co-host B** (`clb.aiclub@uit.edu.vn`), mở xem sự kiện **ID 303** (*"E2E-PKG03: Tọa đàm Khởi nghiệp & Gọi vốn"*).
2. Nhấn nút **"Từ chối"** $\rightarrow$ Modal yêu cầu nhập lý do từ chối.
3. Nhập lý do: *"Trùng lịch sinh hoạt định kỳ của CLB"* ($\ge 5$ ký tự) và bấm Xác nhận.
4. **Kỳ vọng 3 tầng:**
   - **UI:** Sự kiện biến đổi sang badge từ chối.
   - **API:** `POST /api/v1/events/303/co-host-respond` với `{"trang_thai_xac_nhan": "TU_CHOI", "ghi_chu_tu_choi": "..."}` $\rightarrow$ Trả về `200 OK`.
   - **Database:** Bản ghi `dat_phong` của sự kiện 303 lập tức đổi thành `trang_thai = 'CANCELLED'` (phòng C109 được trả tự do ngay cho người khác mượn). Sự kiện chuyển sang `COHOST_REJECTED`.

---

#### Bước 1.5: Host Chủ động Rút Đề xuất (`TC-EVT-02.03` / `UC-EVT-02.AC.3`)
1. Quay lại tài khoản **Host A** (`clb.webdev@uit.edu.vn`), chọn sự kiện **ID 304** (*"E2E-PKG03: Hội thảo Tối ưu hóa Database"* - đang ở `PENDING_FACULTY`).
2. Mở chi tiết sự kiện và nhấn nút **"Rút lại đề xuất"**.
3. Nhập lý do rút: *"Cần bổ sung thêm diễn giả khách mời"* $\rightarrow$ Xác nhận.
4. **Kỳ vọng 3 tầng:**
   - **UI:** Sự kiện rơi về badge xám `Bản nháp (DRAFT)`, các nút chỉnh sửa mở khóa trở lại.
   - **API:** Gọi `POST /api/v1/events/304/withdraw` với `{"ly_do_rut": "..."}` $\rightarrow$ Trả về `200 OK`.
   - **Database:** `su_kien.trang_thai = 'DRAFT'`, `dat_phong.trang_thai = 'CANCELLED'` (nhả phòng B114), bảng `nhat_ky_kiem_duyet` lưu dòng log với `hanh_dong = 'WITHDRAW_PROPOSAL'`.

---

### 📌 LUỒNG 2: THẨM ĐỊNH ĐA CẤP, ADMIN DUYỆT THAY & CÁC TRƯỜNG HỢP NGOẠI LỆ (`UC-EVT-03`)

#### Bước 2.1: Phê duyệt Đa cấp Chuẩn (`TC-EVT-03.01`)
Mục tiêu là thẩm định sự kiện **ID 305** (*"Seminar Cybersecurity & Ethical Hacking"*):
1. **Cấp 1 — Khoa HTTT Thẩm định Nội dung:**
   - Đăng nhập tài khoản **Cán bộ Khoa**: `canbo.httt@uit.edu.vn` / `Faculty@123`.
   - Vào trang duyệt của Khoa: `http://localhost:5173/faculty/approvals`.
   - Chọn sự kiện **ID 305**, kiểm tra nội dung và nhấn nút **"Thông qua cấp Khoa"**.
   - **Kỳ vọng:** `POST /api/v1/events/305/review` với payload `{"hanh_dong": "APPROVE_FACULTY"}` $\rightarrow$ Trả về `200 OK`. Sự kiện chuyển sang `PENDING_ADMIN`. Bảng `nhat_ky_kiem_duyet` ghi log `APPROVE_FACULTY`.
2. **Cấp 2 — Admin P.CTSV Phê duyệt Cấp Trường & Chốt Phòng:**
   - Đăng xuất, đăng nhập tài khoản **Admin P.CTSV**: `admin@uit.edu.vn` / `Admin@123`.
   - Vào: `http://localhost:5173/affairs/approvals` (hoặc `/admin/events`).
   - Mở sự kiện **ID 305** (lúc này đang ở danh sách Chờ CTSV duyệt).
   - Nhấn **"Phê duyệt chính thức"**.
   - **Kỳ vọng:** `POST /api/v1/events/305/review` với `{"hanh_dong": "APPROVE_ADMIN"}` $\rightarrow$ Trả về `200 OK`.
   - **Database:** `su_kien.trang_thai = 'APPROVED'`, `dat_phong.trang_thai = 'CONFIRMED'`.

---

#### Bước 2.2: Edge Case — Admin Duyệt Thay Cấp Khoa (`ADMIN OVERRIDE` - `UC-EVT-03.AC.1`)
Mục tiêu là sự kiện **ID 306** (đang ở `PENDING_FACULTY`):
1. Đăng nhập tài khoản **Admin P.CTSV** (`admin@uit.edu.vn`).
2. Vào màn hình phê duyệt, mở sự kiện **ID 306** của CLB WebDev đang chờ Cấp Khoa HTTT duyệt.
3. Admin nhấn nút **"Duyệt thay cấp Khoa"** (Admin Override).
4. Hệ thống yêu cầu bắt buộc nhập lý do (ví dụ: *"Đại diện Khoa đi công tác, Admin duyệt thay theo chỉ đạo P.CTSV"*).
5. Tùy chọn: Admin có thể chọn "Duyệt luôn cấp phòng" để thông qua luôn cấp trường.
6. **Kỳ vọng:**
   - **API:** `POST /api/v1/events/306/review` với `{"hanh_dong": "APPROVE_FACULTY_BY_ADMIN", "ly_do": "..."}` $\rightarrow$ `200 OK`.
   - **Database:** Bảng `nhat_ky_kiem_duyet` lưu rõ `hanh_dong = 'APPROVE_FACULTY_BY_ADMIN'`, `nguoi_thuc_hien` là ID của Admin.

---

#### Bước 2.3: Edge Case — Từ Chối & Tái Mở Soạn Thảo (`REJECTED` $\rightarrow$ `DRAFT` - `UC-EVT-03.AC.2/3`)
Mục tiêu là sự kiện **ID 307** (*"Workshop Mock Interview"* - đang ở `PENDING_FACULTY`):
1. Ở tài khoản Cán bộ Khoa hoặc Admin, mở sự kiện **ID 307**, bấm nút **"Từ chối"**.
2. Nhập lý do từ chối: *"Kế hoạch diễn giả chưa cụ thể, đề nghị bổ sung chi tiết timeline"* ($\ge 10$ ký tự) và bấm Xác nhận.
   - **Kỳ vọng:** `su_kien.trang_thai = 'REJECTED'`, phòng C109 được giải phóng (`CANCELLED`).
3. Đăng nhập lại tài khoản **Host A** (`clb.webdev@uit.edu.vn`), vào xem sự kiện 307.
4. Bấm nút **"Chỉnh sửa lại" (Reopen)**.
   - **Kỳ vọng:** Gọi `POST /api/v1/events/307/reopen` $\rightarrow$ Sự kiện phục hồi về `DRAFT` thành công mà không phải tạo lại mới từ đầu.

---

#### Bước 2.4: Edge Case — Admin Điều Chỉnh Phòng Khẩn Cấp (`CHANGE_ROOM` - `UC-EVT-03.AC.4`)
Mục tiêu là sự kiện **ID 308** (*"Diễn đàn Cloud Native"* - đã `APPROVED` với số lượng vé 120 tại Hội trường A):
1. Đăng nhập tài khoản **Admin P.CTSV** (`admin@uit.edu.vn`).
2. Mở chi tiết sự kiện **ID 308** $\rightarrow$ Bấm nút **"Điều chuyển phòng khẩn cấp"**.
3. **Thử nghiệm vi phạm sức chứa:**
   - Chọn đổi sang **Phòng B114** (sức chứa 100) trong khi sự kiện phát hành 120 vé ($100 < 120$).
   - **Kỳ vọng:** Bị chặn với lỗi: *"Sức chứa của phòng mới (100) nhỏ hơn số lượng vé đã phát hành của sự kiện (120)"*.
4. **Thực hiện điều chuyển hợp lệ:**
   - Chọn chuyển sang **Phòng C109** (sức chứa 150 $\ge 120$).
   - Nhập lý do: *"Hội trường A sửa chữa máy chiếu đột xuất"*.
   - Bấm Xác nhận điều chuyển.
5. **Kỳ vọng 3 tầng:**
   - **UI:** Mã phòng trên sự kiện cập nhật thành Phòng C109 kèm toast thông báo thành công.
   - **API:** Gọi `POST /api/v1/events/308/change-room` với `{"ma_phong_moi": 3, "ly_do": "..."}` $\rightarrow$ Trả về `200 OK`.
   - **Database:** Cột `su_kien.ma_phong` đổi thành `3`, bản ghi `dat_phong` cập nhật `ma_phong = 3`, `nhat_ky_kiem_duyet` ghi log `CHANGE_ROOM`.

---

#### Bước 2.5: Edge Case — Hủy Sự Kiện Khẩn Cấp & Thu Hồi Phòng/Vé (`TC-EVT-03.02` & `UC-EVT-03.AC.5`)
Mục tiêu là sự kiện **ID 309** (*"Đại nhạc hội Tân sinh viên 2026"* - đã `PUBLISHED`, đang giữ Hội trường E và đã có 2 sinh viên đăng ký vé):
1. Đăng nhập tài khoản **Admin** (`admin@uit.edu.vn`) hoặc **Host A** (`clb.webdev@uit.edu.vn`).
2. Mở sự kiện **ID 309** $\rightarrow$ Bấm nút màu đỏ **"Hủy sự kiện khẩn cấp"**.
3. Nhập lý do hủy: *"Sự cố thiên tai bão lũ bất khả kháng, hoãn tổ chức"* $\rightarrow$ Bấm Xác nhận hủy.
4. **Kỳ vọng 3 tầng:**
   - **UI:** Thẻ sự kiện đổi sang badge đỏ `Đã hủy (CANCELLED)`.
   - **API:** Gọi `POST /api/v1/events/309/emergency-cancel` với `{"ly_do_huy": "..."}` $\rightarrow$ Trả về `200 OK`.
   - **Database:**
     - `su_kien.trang_thai = 'CANCELLED'`.
     - `dat_phong.trang_thai = 'CANCELLED'` (Hội trường E lập tức được giải phóng).
     - Toàn bộ vé trong `dang_ky` của sự kiện 309 chuyển thành `trang_thai = 'DaHuy'` kèm `ly_do_huy = 'Sự kiện bị hủy bởi BTC'`, cột `vi_pham_no_show = 0` (tuyệt đối không bị phạt No-show).
     - Bảng `nhat_ky_kiem_duyet` ghi nhận hành động `CANCEL_EVENT`.

---

### 📌 LUỒNG 3: DASHBOARD PHÂN TÍCH CHỈ SỐ SỰ KIỆN BTC & BẢO MẬT (`UC-REP-01`)

Mục tiêu là kiểm tra số liệu sự kiện **ID 310** (*"E2E-PKG03: Tổng kết Cuộc thi UIT DevFest 2026"* - đã `COMPLETED` với 80 vé đăng ký, 60 check-in, 50 check-out, 20 No-show, 30 feedback ẩn danh và phân bổ 4 khoa):

#### Bước 3.1: Kiểm tra Thẻ KPI & Công thức Tính Toán
1. Đăng nhập tài khoản **Host A**: `clb.webdev@uit.edu.vn` / `Club@123`.
2. Vào mục **"Thống kê & Báo cáo"** (`http://localhost:5173/organizer/dashboard`).
3. Đối soát các chỉ số hiển thị trên giao diện so với đặc tả công thức [docs/srs_v3_1_3.md#L1466-L1470](file:///c:/Users/ADMIN/uit/IS207_PTUDW/CEHMainProject/docs/srs_v3_1_3.md#L1466-L1470):
   - **Tổng vé đăng ký hợp lệ (`TotalValid`):** `80` vé.
   - **Tỷ lệ lấp đầy:** $80 / 100 \times 100\% = \mathbf{80.0\%}$.
   - **Lượt tham dự thực tế (`Attended`):** `60` lượt.
   - **Tỷ lệ Show-up:** $60 / 80 \times 100\% = \mathbf{75.0\%}$.
   - **Lượt hoàn thành (`Completed`):** `50` lượt check-out.
   - **Lượt No-show:** `20` lượt.
   - **Tỷ lệ No-show:** $20 / 80 \times 100\% = \mathbf{25.0\%}$.
   - **Điểm hài lòng trung bình:** Hiển thị điểm TB từ 30 đánh giá feedback (Nội dung: ~4.5★, Diễn giả: 5.0★, Tổ chức: ~4.7★).

#### Bước 3.2: Kiểm tra Biểu đồ Phân bổ Khoa & Lưu lượng Khung giờ (Refactored UI)
1. **Biểu đồ tròn (Pie Chart) — Phân bổ theo Khoa:**
   - Hiển thị đúng 4 phần tử tương ứng với 4 khoa trong dữ liệu seeder:
     - Khoa HTTT: $40 / 80 = \mathbf{50\%}$.
     - Khoa KHMT: $20 / 80 = \mathbf{25\%}$.
     - Khoa KTMT: $10 / 80 = \mathbf{12.5\% \approx 13\%}$.
     - Khoa MMT: $10 / 80 = \mathbf{12.5\% \approx 13\%}$.
   - Không còn hiển thị dữ liệu giả của `CHART_PIE_DATA`.
2. **Biểu đồ đường (Line Chart) — Lưu lượng theo Khung giờ:**
   - Trục hoành hiển thị các khung giờ 15 phút thực tế: `07:45 - 08:00`, `08:00 - 08:15`, `08:15 - 08:30`, `11:00 - 11:15`, `11:15 - 11:30`.
   - Hai đường Check-in (màu chàm) và Check-out (màu xanh lá) phản ánh số lượng lượt thực tế theo từng mốc.

#### Bước 3.3: Kiểm tra Quyền Co-host Xem Báo Cáo
1. Đăng xuất, đăng nhập tài khoản **Khoa HTTT (Co-host đã đồng ý của sự kiện 310)**: `canbo.httt@uit.edu.vn` / `Faculty@123`.
2. Truy cập vào Dashboard sự kiện 310 $\rightarrow$ **Kỳ vọng:** Xem được đầy đủ các thẻ KPI và biểu đồ phân tích (theo đúng SRS: Co-host đã xác nhận có quyền xem báo cáo của sự kiện).

#### Bước 3.4: Kiểm tra Bảo mật Chặn Đơn Vị Ngoài Lề (Security Test — 403 Forbidden)
1. Đăng xuất, đăng nhập tài khoản **CLB An toàn Thông tin (Đơn vị lạ)**: `clb.cyber@uit.edu.vn` / `Club@123`.
2. Dán trực tiếp URL xem báo cáo sự kiện 310 hoặc gọi API:
   ```bash
   GET /api/v1/organizer/events/310/analytics
   ```
3. **Kỳ vọng 3 tầng:**
   - **UI:** Chuyển sang màn hình cảnh báo hoặc Toast đỏ: *"Bạn không có quyền truy cập dữ liệu báo cáo của sự kiện này"*.
   - **API:** Trả về mã lỗi HTTP `403 Forbidden`, error code `FORBIDDEN_REPORT_ACCESS`.
   - **An toàn dữ liệu:** Không để lộ bất kỳ số liệu thống kê hay feedback nào cho đơn vị ngoài lề.

---

## 📋 IV. TIÊU CHÍ NGHIỆM THU HOÀN TẤT (DoD CHECKLIST)

- [ ] **TC-EVT-02.01 (Soft Hold 48h & Xung đột phòng tạm):** PASS
- [ ] **TC-EVT-02.02 (Co-host từ chối $\rightarrow$ Rơi về DRAFT & Nhả phòng):** PASS
- [ ] **TC-EVT-02.03 (Rút đề xuất WITHDRAW_PROPOSAL):** PASS
- [ ] **TC-EVT-03.01 (Phê duyệt Đa cấp Host-driven Routing):** PASS
- [ ] **TC-EVT-03.02 (Hủy khẩn cấp & Thu hồi phòng/vé):** PASS
- [ ] **UC-EVT-03.AC.1 (Admin Duyệt thay cấp Khoa - Admin Override):** PASS
- [ ] **UC-EVT-03.AC.4 (Admin Điều chỉnh Phòng khẩn cấp):** PASS
- [ ] **UC-REP-01 (Dashboard Show-up, Feedback & Chặn 403 Đơn vị lạ):** PASS
- [x] **Refactor Mock Data:** Đã xóa hằng số mock biểu đồ trên `Dashboard.tsx`, bind API thật và build thành công.
- [x] **Test Integrity:** Zero diff trên `tests/` (`git diff -- tests/` = 0).
