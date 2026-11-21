# BÁO CÁO PHẢN HỒI KIỂM THỬ UAT GÓI SỐ 3 (CEH-UAT-PKG-03)
## BẢNG GHI NHẬN LỖI (DEFECT LOG) — ĐÁNH GIÁ TẠM THỜI: FAIL `UC-EVT-01`

> **Mã tài liệu:** `CEH-UAT-FEEDBACK-PKG03-DEFECTS-v2.0`  
> **Gói kiểm thử:** `CEH-UAT-PKG-03` (Vòng đời sự kiện, Đồng tổ chức, Phê duyệt đa cấp & Báo cáo)  
> **Use Case trọng tâm:** `UC-EVT-01`, `UC-EVT-02`, `UC-EVT-03`, `UC-REP-01`  
> **Trạng thái thẩm định Use Case:** ❌ **FAIL `UC-EVT-01` (Tạm thời không đạt nghiệm thu do tồn tại lỗi P0/P1 chặn luồng tạo và quản lý sự kiện)**  
> **Người thực hiện kiểm thử (Reporter):** Trí Bùi (`clb.webdev@uit.edu.vn` & `canbo.httt@uit.edu.vn`)  
> **Môi trường thử nghiệm:** `Chrome`, `Localhost`, `PC`  
> **Căn cứ kỹ thuật (SSOT):**  
> 1. `docs/srs_v3_1_3.md` (FR-09..FR-32, UC-EVT-01..03, UC-REP-01)  
> 2. `docs/database_v3.1.2_mysql.sql` (Cơ sở dữ liệu 24 bảng chuẩn 3NF)  
> 3. `docs/openapi_v3.2.3.yml` (Đặc tả REST API & Envelopes)  
> 4. `UAT_HANDOVER_SPECIFICATION.md` (`CEH-UAT-PKG-03`)

---

## 📊 I. BẢNG TỔNG HỢP CÁC TRƯỜNG DỮ LIỆU NOTION (NOTION DATABASE COMPATIBLE TABLE)

| Defect ID (Issue Name) | Traceability | Severity / Priority | Defect Status | Reproduction Steps | Expected Outcome | Actual Outcome | Reporter | Environment | Evidence & Logs | Assignee |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **`[BUG-PKG03-01] Không thể tạo sự kiện, lỗi validation bị che giấu`** | `PKG-03 / TC-EVT-01.01` | **Critical (P0)** | **To-do** | 1. Đăng nhập `clb.webdev@uit.edu.vn`<br>2. Vào `/organizer/events/create`<br>3. Nhập mô tả < 10 ký tự hoặc chọn điều khoản `KhongCo` (điểm vẫn để 5)<br>4. Nhấn "Lưu bản nháp" | • **UI:** Đánh dấu viền đỏ trường sai & hiển thị thông báo lỗi chi tiết dưới ô.<br>• **API:** Trả HTTP 422 `VALIDATION_FAILED` có mảng `errors`.<br>• **DB:** Không lưu dữ liệu lỗi. | • **UI:** Chỉ hiển thị toast đỏ chung chung: *"Dữ liệu cung cấp không hợp lệ."*, không viền đỏ trường nào, không cho biết lỗi gì, chặn đứng hoàn toàn luồng tạo sự kiện. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventForm.tsx#L411`: `showToast(getApiErrorMessage(error), "error")`<br>`errors.ts#L106-L110`: Hàm nuốt sạch `validationErrors`. | *Chờ gán* |
| **`[BUG-PKG03-02] Không tải được ảnh banner khi tạo sự kiện`** | `PKG-03 / TC-EVT-01.01` | **Major (P1)** | **To-do** | 1. Vào `/organizer/events/create`<br>2. Nhấn nút "Tải lên banner"<br>3. Chọn file ảnh từ máy | • **UI:** Hiển thị preview banner và lưu đường dẫn/URL ảnh.<br>• **API:** Payload gửi kèm trường `anh_bia`.<br>• **DB:** Lưu URL ảnh vào cột `su_kien.anh_bia`. | • **UI:** Chọn ảnh xong không có phản hồi, không có preview.<br>• **Code:** Thẻ input file không có `onChange`, form state không có `anh_bia`, payload không gửi lên API. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventForm.tsx#L506-L533`: Thẻ input file thiếu handler, payload không có `anh_bia`. | *Chờ gán* |
| **`[BUG-PKG03-03] Biểu mẫu thiếu trường thông tin Diễn giả (dien_gia)`** | `PKG-03 / TC-EVT-01.01` | **Major (P1)** | **To-do** | 1. Vào `/organizer/events/create`<br>2. Tìm ô nhập Diễn giả (`dien_gia`) | • **UI:** Có trường nhập Diễn giả theo SRS v3.1.3 dòng 640.<br>• **API:** Gửi `dien_gia` lên backend.<br>• **DB:** Lưu vào cột `su_kien.dien_gia`. | • **UI:** Hoàn toàn không có ô nhập nào cho Diễn giả. BTC không có cách nào điền thông tin diễn giả dù API backend đã hỗ trợ. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | File `EventForm.tsx` không tồn tại bất kỳ input nào liên kết với `dien_gia`. | *Chờ gán* |
| **`[BUG-PKG03-04] Lộ trình chương trình (lo_trinh) không lưu được dữ liệu`** | `PKG-03 / TC-EVT-01.01` | **Major (P1)** | **To-do** | 1. Vào `/organizer/events/create`<br>2. Cuộn đến Section "Nội dung chương trình"<br>3. Nhập lịch trình vào ô textarea<br>4. Bấm Lưu bản nháp | • **UI:** Cho phép nhập lộ trình theo mốc giờ hoặc nhập text tự parse.<br>• **API:** Gửi `lo_trinh` dạng JSON Array lên backend.<br>• **DB:** Lưu vào cột `su_kien.lo_trinh`. | • **UI:** Thẻ textarea không có `value` và `onChange`, dữ liệu nhập vào bị mất trắng.<br>• **API:** Payload không gửi trường `lo_trinh`, cột DB luôn nhận `NULL`. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventForm.tsx#L716-L724`: Textarea uncontrolled, không liên kết form state. | *Chờ gán* |
| **`[BUG-PKG03-05] Giao diện chứa nhiều trường rác prototype và sai mốc thời gian đăng ký`** | `PKG-03 / TC-EVT-01.01` | **Major (P1)** | **To-do** | 1. Xem các section thời gian đăng ký và đề xuất điểm trên form | • **UI:** Bám sát SRS v3.1.3: chỉ có Ngày công bố (`ngay_cong_bo`), ĐRL (`dieu_khoan_drl`), Giờ tình nguyện (`gio_tinh_nguyen`). | • **UI:** Xuất hiện nhiều trường rác không tồn tại trong DB 24 bảng: "Thời gian đóng đăng ký" (`regEnd`), "Thời lượng hợp lệ", "Căn cứ đề xuất", "Điều kiện chứng nhận tự do". | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventForm.tsx#L185-L189` lưu các giá trị này vào context giả lập `saveApprovalDraft` thay vì API. | *Chờ gán* |
| **`[BUG-PKG03-06] Thiếu ràng buộc datepicker ngày quá khứ và không giới hạn max sức chứa`** | `PKG-03 / TC-EVT-01.EX.1/2` | **Minor (P2/P3)** | **To-do** | 1. Mở datepicker chọn ngày quá khứ<br>2. Chọn phòng 100 chỗ nhưng nhập sức chứa 200 | • **UI:** Datepicker chặn chọn ngày quá khứ (`min={today}`). Input sức chứa tối đa bị giới hạn $\le$ sức chứa phòng (`max={room.suc_chua}`). | • **UI:** Không có thuộc tính `min` trên thẻ date, không có `max` trên ô sức chứa, không tự set `capacity = null` khi tick Mở tự do. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventForm.tsx#L619-L626`, `L701-L708`. | *Chờ gán* |
| **`[BUG-PKG03-07] Báo lỗi sai thời gian kết thúc do so sánh chuỗi JavaScript`** | `PKG-03 / TC-EVT-01.01` | **Major (P1)** | **To-do** | 1. Nhập giờ bắt đầu là `9:00`<br>2. Nhập giờ kết thúc là `10:00`<br>3. Bấm Lưu bản nháp | • **UI:** Chấp nhận khung giờ hợp lệ, không báo lỗi. | • **UI:** Báo lỗi sai: *"Thời gian kết thúc phải sau thời gian bắt đầu."* do so sánh chuỗi ASCII (`"9:00" >= "10:00"` trả về `true`). | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventForm.tsx#L311-L313`: So sánh `form.startTime >= form.endTime` theo chuỗi trực tiếp. | *Chờ gán* |
| **`[BUG-PKG03-08] Biểu mẫu thiếu trường thông tin Đối tượng tham gia (doi_tuong_tham_gia)`** | `PKG-03 / TC-EVT-01.01` | **Major (P1)** | **To-do** | 1. Truy cập `/organizer/events/create`<br>2. Tìm ô nhập Đối tượng tham gia | • **UI:** Có trường nhập Đối tượng tham gia theo đặc tả CSDL và API backend.<br>• **DB:** Lưu vào cột `su_kien.doi_tuong_tham_gia`. | • **UI:** Hoàn toàn thiếu ô nhập `doi_tuong_tham_gia`, khiến dữ liệu luôn bị null hoặc mặc định. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `StoreEventDraftRequest.php#L26` có quy tắc nhưng `EventForm.tsx` không có input. | *Chờ gán* |
| **`[BUG-PKG03-09] Tự ý gán ngày công bố là ngày hiện tại khiến sự kiện bị xuất bản ngay khi duyệt`** | `PKG-03 / TC-EVT-01.01` | **Major (P1)** | **To-do** | 1. Tạo sự kiện nháp nhưng để trống trường ngày công bố<br>2. Lưu bản nháp và gửi duyệt | • **UI/API:** Ngày công bố phải được xác định rõ ràng, không được tự động gán ngày quá khứ/hiện tại khi chưa chỉ định. | • **UI:** Frontend tự gán `new Date().toISOString().slice(0, 10)` làm `ngay_cong_bo`, khiến sự kiện bị chuyển `PUBLISHED` ngay khi Admin vừa duyệt. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventForm.tsx#L346`: `ngay_cong_bo: form.regStart \|\| new Date().toISOString().slice(0, 10)` | *Chờ gán* |
| **`[BUG-PKG03-10] Màn hình Quản lý sự kiện gọi nhầm API catalog công khai, biến mất sự kiện DRAFT`** | `PKG-03 / TC-EVT-01.02` | **Critical (P0)** | **To-do** | 1. Đăng nhập `clb.webdev@uit.edu.vn`<br>2. Tạo bản nháp sự kiện<br>3. Truy cập `/organizer/events` | • **UI:** Hiển thị đầy đủ tất cả các sự kiện do đơn vị quản lý ở 11 trạng thái (gồm `DRAFT`, `WAITING_COHOST`, `PENDING_FACULTY`,...). | • **UI:** Sự kiện `DRAFT` và các trạng thái chờ duyệt biến mất hoàn toàn do Frontend gọi nhầm API public `/api/v1/events` của Sinh viên. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventDataContext.tsx#L272-L275`: Gọi `eventsService.listPublic` thay vì `eventsService.organizerList`. | *Chờ gán* |
| **`[BUG-PKG03-11] Nút Chỉnh sửa điều hướng sai về trang tạo mới thay vì trang sửa bản nháp`** | `PKG-03 / TC-EVT-01.02` | **Major (P1)** | **To-do** | 1. Tại danh sách sự kiện `/organizer/events`<br>2. Bấm nút biểu tượng "Chỉnh sửa" trên một dòng sự kiện | • **UI:** Điều hướng đến `/organizer/events/{id}/edit` và load lại toàn bộ dữ liệu cũ của sự kiện vào form. | • **UI:** Điều hướng về `/organizer/events/create` (trang tạo mới trắng tinh), không load lại bất kỳ dữ liệu nào. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventsManage.tsx#L547`: `onClick={() => onNavigate("org-event-form")}` không truyền `eventId`. | *Chờ gán* |
| **`[BUG-PKG03-12] Các hành động trên dòng sự kiện bị cào bằng giống nhau cho mọi trạng thái`** | `PKG-03 / TC-EVT-01.02` | **Major (P1)** | **To-do** | 1. Quan sát cột Hành động của các sự kiện ở các trạng thái khác nhau (`DRAFT`, `COMPLETED`, `CANCELLED`) | • **UI:** Hiển thị hành động tương ứng theo State Machine (Nháp: Sửa/Gửi duyệt; Happening: Kiosk/Soát vé; Completed: Báo cáo). | • **UI:** Mọi dòng sự kiện đều hiển thị cùng 4 nút: Chỉnh sửa, Người tham gia, Kiosk, Soát vé Camera, bất kể sự kiện đã kết thúc hay bị hủy. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventsManage.tsx#L544-L590`: Render cố định 4 nút hành động không có điều kiện trạng thái. | *Chờ gán* |
| **`[BUG-PKG03-13] Danh sách quản lý sự kiện thiếu bộ lọc trạng thái HAPPENING (Đang diễn ra)`** | `PKG-03 / TC-EVT-01.02` | **Minor (P2/P3)** | **To-do** | 1. Truy cập `/organizer/events`<br>2. Xem danh sách tab trạng thái | • **UI:** Có tab lọc sự kiện đang diễn ra (`HAPPENING`) theo SRS. | • **UI:** `statusTabs` chỉ có: Tất cả, Bản nháp, Đang mở, Sắp hết, Đã đóng, Đã kết thúc. Hoàn toàn thiếu tab `HAPPENING`. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventsManage.tsx#L187-L194`: Thiếu tab `happening` trong khai báo `statusTabs`. | *Chờ gán* |
| **`[BUG-PKG03-14] Nút Người tham gia điều hướng chung chung, làm mất ngữ cảnh sự kiện`** | `PKG-03 / TC-EVT-01.02` | **Major (P1)** | **To-do** | 1. Tại dòng sự kiện 310, bấm nút "Người tham gia" | • **UI:** Điều hướng thẳng vào tab Người tham gia của đúng sự kiện 310. | • **UI:** Điều hướng về trang `/organizer/participants` chung chung, người dùng phải tự tìm lại sự kiện trong danh sách. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventsManage.tsx#L556-L557`: `onClick={() => onNavigate("org-participants")}` không truyền `eventId`. | *Chờ gán* |
| **`[BUG-PKG03-15] Dữ liệu số người đăng ký và tỷ lệ tham gia trên bảng sự kiện bị mock giả lập`** | `PKG-03 / TC-EVT-01.02` | **Major (P1)** | **To-do** | 1. Xem cột Số lượng đăng ký và Tỷ lệ lấp đầy trên bảng `/organizer/events` | • **UI:** Hiển thị số lượng vé đăng ký thật được tổng hợp từ bảng `dang_ky`. | • **UI:** Số liệu bị tính toán bằng phép trừ giả lập `capacity - remaining` hoặc lấy mặc định từ `data/mock.ts`, không khớp CSDL. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventDataContext.tsx#L164-L172`: Tính toán `registered` giả định thay vì lấy từ CSDL. | *Chờ gán* |
| **`[BUG-PKG03-16] Lời mời đồng tổ chức không hiển thị ở tab Đã đồng ý / Đã từ chối và thống kê sai`** | `PKG-03 / TC-EVT-02.01` | **Major (P1)** | **To-do** | 1. Đăng nhập tài khoản đơn vị được mời co-host<br>2. Vào `/organizer/cohost-invitations`<br>3. Chọn tab "Đã đồng ý" hoặc "Đã từ chối" | • **UI:** Hiển thị danh sách các lời mời tương ứng và thẻ thống kê đếm chính xác. | • **UI:** Danh sách rỗng hoàn toàn, thẻ thống kê báo sai do Backend mặc định lọc `CHO_XAC_NHAN` khi Frontend không truyền tham số. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `EventProposalService.php#L461-L463` mặc định `CHO_XAC_NHAN`, `CohostInvitations.tsx#L101` không truyền status. | *Chờ gán* |
| **`[BUG-PKG03-17] Đơn vị đồng tổ chức không có nút xem chi tiết kế hoạch sự kiện (Read-only)`** | `PKG-03 / TC-EVT-02.01` | **Minor (P2/P3)** | **To-do** | 1. Vào `/organizer/cohost-invitations`<br>2. Xem thông tin thẻ lời mời | • **UI:** Có nút "Xem chi tiết kế hoạch" (Read-only) để xem nội dung, lộ trình trước khi quyết định Đồng ý/Từ chối. | • **UI:** Chỉ có nút Đồng ý và Từ chối, không có liên kết nào để xem chi tiết sự kiện được mời. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `CohostInvitations.tsx`: Thiếu liên kết hoặc modal xem chi tiết sự kiện theo `eventId`. | *Chờ gán* |
| **`[BUG-PKG03-18] Xung đột hai nguồn dữ liệu người tham gia giữa thẻ tóm tắt và bảng chi tiết`** | `PKG-03 / TC-OPS-03.01` | **Major (P1)** | **To-do** | 1. Vào `/organizer/participants`<br>2. So sánh số lượng đăng ký/điểm danh ở thẻ ngoài với bảng chi tiết bên trong | • **UI:** Số lượng đăng ký và điểm danh ở thẻ tóm tắt phải khớp chính xác 100% với bảng chi tiết. | • **UI:** Thẻ bên ngoài tính từ mảng `tickets` mock cục bộ, trong khi bảng chi tiết gọi API thật từ CSDL, dẫn đến số liệu mâu thuẫn. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `Participants.tsx#L393-L399` (dùng mock `tickets`) vs `Participants.tsx#L147-L153` (gọi API thật). | *Chờ gán* |
| **`[BUG-PKG03-19] Chọn xem sự kiện trong Participants không đổi URL, nút Back bị quay về Sự kiện`** | `PKG-03 / TC-OPS-03.01` | **Minor (P2/P3)** | **To-do** | 1. Vào `/organizer/participants`<br>2. Bấm "Xem người tham gia" một sự kiện<br>3. Bấm nút Back của trình duyệt | • **UI:** URL cập nhật query param `?eventId=...`, bấm Back quay về danh sách sự kiện của trang Participants. | • **UI:** URL không đổi, bấm Back bị thoát hoàn toàn sang trang `/organizer/events`. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `Participants.tsx#L480-L485`: Chỉ cập nhật local state `setSelectedEventId`, không push URL. | *Chờ gán* |
| **`[BUG-PKG03-20] Hiện 4 sự kiện mock mẫu trong lúc tải rồi mới đổi sang sự kiện thật (Layout Flash)`** | `PKG-03 / TC-OPS-03.01` | **Minor (P2/P3)** | **To-do** | 1. Truy cập `/organizer/participants` với kết nối mạng bình thường | • **UI:** Hiển thị Skeleton Loading trong lúc chờ API trả dữ liệu. | • **UI:** Chớp nháy hiển thị 4 sự kiện mock mẫu trong 300ms rồi giật sang danh sách sự kiện thật. | Trí Bùi (`clb.webdev@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `Participants.tsx#L249-L309`: Fallback render `demoEvents` khi `remote.events.length === 0`. | *Chờ gán* |
| **`[BUG-PKG03-21] Màn hình Thẩm định cấp Khoa bị vòng lặp vô tận (Infinite Loop), nhấp nháy liên tục`** | `PKG-03 / TC-EVT-03.01` | **Critical (P0)** | **To-do** | 1. Đăng nhập tài khoản Khoa: `canbo.httt@uit.edu.vn`<br>2. Truy cập `/faculty/approvals` | • **UI:** Tải danh sách hồ sơ một lần, hiển thị ổn định, không giật lag. | • **UI:** Màn hình nhấp nháy loading liên tục, CPU trình duyệt tăng vọt do `useEffect` kích hoạt re-render vô tận. | Trí Bùi (`canbo.httt@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `ApprovalWorkspace.tsx#L63-L89`: `useEffect` có dependency `[refreshReviewQueue, approvalCases]` gây loop. | *Chờ gán* |
| **`[BUG-PKG03-22] Tab Sự kiện trực thuộc Khoa điều hướng sai sang trang Ban Tổ Chức (/organizer)`** | `PKG-03 / TC-EVT-03.01` | **Major (P1)** | **To-do** | 1. Tại giao diện Khoa `/faculty/approvals`<br>2. Bấm vào tab "Sự kiện trực thuộc Khoa" trên thanh điều hướng | • **UI:** Giữ nguyên giao diện quản lý cấp Khoa (`ManagementLayout`) và URL `/faculty/...`. | • **UI:** Bị nhảy sang route `/organizer/events` và chuyển thành layout Ban Tổ Chức CLB (`OrgLayout`). | Trí Bùi (`canbo.httt@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `ManagementLayout.tsx#L97-L100`: Tab gắn `id: "org-events"`, routes ánh xạ sang `/organizer/events`. | *Chờ gán* |
| **`[BUG-PKG03-23] Dashboard thống kê hardcode sự kiện 101, nuốt lỗi 403 khiến Khoa không xem được 310`** | `PKG-03 / TC-REP-01.01` | **Major (P1)** | **To-do** | 1. Đăng nhập `canbo.httt@uit.edu.vn`<br>2. Vào xem Dashboard báo cáo sự kiện co-host 310 | • **UI:** Cho phép chọn sự kiện 310 và hiển thị đầy đủ các chỉ số check-in/out, DRL. | • **UI:** Dashboard hardcode tải sự kiện 101 hoặc `events[0]`, Backend trả lỗi 403 bị khối `catch` nuốt sạch, màn hình hiện số liệu rỗng. | Trí Bùi (`canbo.httt@uit.edu.vn`) | `Chrome`, `Localhost`, `PC` | `Dashboard.tsx#L66`: `currentEventId = events[0]?.ma_su_kien \|\| 101`<br>`Dashboard.tsx#L84`: Nuốt lỗi silent. | *Chờ gán* |

---

## 📝 II. CHI TIẾT TỪNG PHIẾU BÁO LỖI (DEFECT CARDS CHUẨN NOTION)

---

### 🔴 Phiếu lỗi 1: `[BUG-PKG03-01]` Không thể tạo sự kiện, lỗi validation bị che giấu

* **Defect ID (Issue Name):** `[BUG-PKG03-01] Không thể tạo sự kiện, lỗi validation bị che giấu`
* **Traceability:** `PKG-03 / TC-EVT-01.01`
* **Severity / Priority:** `Critical (P0)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Đăng nhập hệ thống với vai trò BTC: `clb.webdev@uit.edu.vn` / `Club@123`.
  2. Truy cập trang tạo sự kiện: `http://localhost:5173/organizer/events/create`.
  3. Nhập Tên sự kiện: *"Hội thảo Công nghệ 2026"*, chọn Chủ đề: *"Công nghệ"*.
  4. Để ô Mô tả trống hoặc nhập ngắn dưới 10 ký tự (ví dụ: *"Hội thảo"*).
  5. Chọn ngày tổ chức, giờ bắt đầu, giờ kết thúc, chọn phòng và sức chứa hợp lệ.
  6. Nhấn nút **"Lưu bản nháp"** hoặc **"Gửi khoa duyệt"**.
* **Expected Outcome:**
  - **UI:** Hệ thống đánh dấu viền đỏ vào ô Mô tả và hiển thị thông báo lỗi chi tiết bên dưới: *"Mô tả sự kiện phải có ít nhất 10 ký tự"*.
  - **API:** Backend trả về HTTP `422 Unprocessable Content` kèm mảng `errors.mo_ta`.
  - **Database:** Không lưu bản ghi không hợp lệ.
* **Actual Outcome:**
  - **UI:** Hệ thống chỉ bật một Toast thông báo màu đỏ: **"Dữ liệu cung cấp không hợp lệ."**.
  - Không có ô input nào bị đánh dấu đỏ, không giải thích vi phạm trường nào, chặn đứng hoàn toàn luồng tạo sự kiện.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - Response HTTP 422 từ API:
    ```json
    HTTP/1.1 422 Unprocessable Content
    {
      "success": false,
      "error": "VALIDATION_FAILED",
      "message": "Dữ liệu cung cấp không hợp lệ.",
      "errors": { "mo_ta": ["Mô tả sự kiện phải có ít nhất 10 ký tự."] }
    }
    ```
  - Code vi phạm:
    - `frontend/src/screens/organizer/EventForm.tsx#L411`: `showToast(getApiErrorMessage(error), "error")`
    - `frontend/src/api/errors.ts#L106-L110`: Hàm `getApiErrorMessage` bỏ qua đối tượng `error.validationErrors`.
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 2: `[BUG-PKG03-02]` Không tải được ảnh banner khi tạo sự kiện

* **Defect ID (Issue Name):** `[BUG-PKG03-02] Không tải được ảnh banner khi tạo sự kiện`
* **Traceability:** `PKG-03 / TC-EVT-01.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `http://localhost:5173/organizer/events/create`.
  2. Bấm vào nút **"Tải lên banner"**.
  3. Chọn một file ảnh từ máy tính (`.jpg` hoặc `.png`).
* **Expected Outcome:**
  - **UI:** Ảnh được tải lên, hiển thị khung preview của banner và lưu URL ảnh vào form.
  - **API:** Request payload gửi lên chứa trường `anh_bia: "https://..."`.
  - **Database:** Bảng `su_kien` lưu đường dẫn URL vào cột `anh_bia`.
* **Actual Outcome:**
  - **UI:** Sau khi chọn file, giao diện không có phản hồi, không có ảnh preview, nút vẫn ở trạng thái ban đầu.
  - **Code:** Thẻ `<input type="file" id="banner-upload">` không có thuộc tính `onChange`. State `form` không có biến lưu banner và `handleSubmit` không truyền `anh_bia` lên API.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/EventForm.tsx#L506-L533`:
    ```tsx
    <input type="file" accept="image/*" className="hidden" id="banner-upload" />
    <label htmlFor="banner-upload" ...>Tải lên banner</label>
    ```
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 3: `[BUG-PKG03-03]` Biểu mẫu thiếu trường thông tin Diễn giả (dien_gia)

* **Defect ID (Issue Name):** `[BUG-PKG03-03] Biểu mẫu thiếu trường thông tin Diễn giả (dien_gia)`
* **Traceability:** `PKG-03 / TC-EVT-01.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `http://localhost:5173/organizer/events/create`.
  2. Quan sát toàn bộ giao diện từ trên xuống dưới.
* **Expected Outcome:**
  - Biểu mẫu có trường "Diễn giả / Khách mời" (`dien_gia`) theo quy định của SRS v3.1.3 dòng 640 và Database `su_kien.dien_gia VARCHAR(200)`.
* **Actual Outcome:**
  - Hoàn toàn không có ô input hay text field nào để nhập Diễn giả. BTC không có cách nào cung cấp thông tin diễn giả dù API backend `StoreEventDraftRequest.php` đã hỗ trợ `'dien_gia' => ['nullable', 'string', 'max:200']`.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - Tìm kiếm chuỗi `dien_gia` trong toàn bộ `frontend/src/screens/organizer/EventForm.tsx` cho kết quả rỗng (0 match).
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 4: `[BUG-PKG03-04]` Lộ trình chương trình (lo_trinh) không lưu được dữ liệu

* **Defect ID (Issue Name):** `[BUG-PKG03-04] Lộ trình chương trình (lo_trinh) không lưu được dữ liệu`
* **Traceability:** `PKG-03 / TC-EVT-01.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `http://localhost:5173/organizer/events/create`.
  2. Cuộn xuống Section "Nội dung chương trình".
  3. Nhập lịch trình sự kiện: *"08:00 - Khai mạc, 10:00 - Bế mạc"*.
  4. Điền các trường còn lại và bấm "Lưu bản nháp".
* **Expected Outcome:**
  - Lộ trình chương trình được lưu dưới dạng JSON array `[{"time": "...", "title": "..."}]` vào cột `su_kien.lo_trinh`.
* **Actual Outcome:**
  - Thẻ `<textarea>` là thẻ rác (uncontrolled, không có `value` và `onChange`). Khi bấm Lưu, dữ liệu nhập trong ô bị mất trắng hoàn toàn, request payload không gửi `lo_trinh`, cột `su_kien.lo_trinh` trong cơ sở dữ liệu luôn bị gán `NULL`.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/EventForm.tsx#L716-L724`:
    ```tsx
    <Section title="Nội dung chương trình">
      <textarea rows={5} placeholder="Mô tả lịch trình..." className={inputClass(false)} />
    </Section>
    ```
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 5: `[BUG-PKG03-05]` Giao diện chứa nhiều trường rác prototype và sai mốc thời gian đăng ký

* **Defect ID (Issue Name):** `[BUG-PKG03-05] Giao diện chứa nhiều trường rác prototype và sai mốc thời gian đăng ký`
* **Traceability:** `PKG-03 / TC-EVT-01.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `http://localhost:5173/organizer/events/create`.
  2. Quan sát Section "Thời gian đăng ký" và Section "Đề xuất điểm & chứng nhận".
* **Expected Outcome:**
  - Biểu mẫu phải bám sát 100% Cơ sở dữ liệu và SRS v3.1.3:
    - Thời gian mở đăng ký là **Ngày công bố (`ngay_cong_bo`)**.
    - Thời gian đóng đăng ký cố định tại **$T - 2\text{h}$** do cron tự động thực hiện, không có trong DB.
    - Điểm ĐRL bám sát `dieu_khoan_drl` (`KhongCo`, `Dieu3`, `Dieu4`), `diem_drl_du_kien` và `gio_tinh_nguyen`.
* **Actual Outcome:**
  - Form hiển thị trường "Thời gian đóng đăng ký" (`regEnd`) là trường thừa, bấm lưu không gửi lên DB.
  - Form xuất hiện hàng loạt trường tàn dư của mockup cũ: *"Thời lượng hợp lệ (phút)"*, *"Điều kiện chứng nhận"*, *"Căn cứ đề xuất"*. Các trường này không tồn tại trong bảng `su_kien` và Backend API không nhận.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `EventForm.tsx#L185-L189` lưu các giá trị này vào context giả lập `saveApprovalDraft` thay vì đồng bộ với Backend API.
* **Assignee:** *Chờ gán*

---

### 🟡 Phiếu lỗi 6: `[BUG-PKG03-06]` Thiếu ràng buộc datepicker ngày quá khứ và không giới hạn max sức chứa

* **Defect ID (Issue Name):** `[BUG-PKG03-06] Thiếu ràng buộc datepicker ngày quá khứ và không giới hạn max sức chứa`
* **Traceability:** `PKG-03 / TC-EVT-01.EX.1`, `TC-EVT-01.EX.2`
* **Severity / Priority:** `Minor (P2/P3)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Chọn phòng Hội trường B114 (sức chứa 100).
  2. Tại ô "Số lượng tham gia tối đa", nhập 200.
  3. Tại ô "Ngày tổ chức", mở lịch chọn một ngày trong quá khứ.
* **Expected Outcome:**
  - Thẻ ngày tổ chức tự động vô hiệu hóa các ngày trong quá khứ (`min={today}`).
  - Khi chọn phòng B114 (100 chỗ), ô số lượng tối đa tự động ràng buộc `max={100}` và hiển thị placeholder gợi ý.
  - Khi tick chọn "Sự kiện mở tự do, không giới hạn slot", ô số lượng tối đa ẩn đi và tự động gán `capacity = null`.
* **Actual Outcome:**
  - Người dùng vẫn chọn được ngày quá khứ trên datepicker.
  - Ô số lượng tham gia tối đa không có giới hạn `max`, dẫn đến người dùng dễ nhập sai và bị backend từ chối.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/EventForm.tsx#L619-L626`, `L701-L708`.
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 7: `[BUG-PKG03-07]` Báo lỗi sai thời gian kết thúc do so sánh chuỗi JavaScript

* **Defect ID (Issue Name):** `[BUG-PKG03-07] Báo lỗi sai thời gian kết thúc do so sánh chuỗi JavaScript`
* **Traceability:** `PKG-03 / TC-EVT-01.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `http://localhost:5173/organizer/events/create`.
  2. Chọn Giờ bắt đầu là `9:00` (hoặc chọn 08:00 tối).
  3. Chọn Giờ kết thúc là `10:00` (hoặc chọn 00:00 ngày hôm sau).
  4. Bấm "Lưu bản nháp".
* **Expected Outcome:**
  - Hệ thống chấp nhận khung giờ hợp lệ, không chặn người dùng.
* **Actual Outcome:**
  - Giao diện báo lỗi sai: *"Thời gian kết thúc phải sau thời gian bắt đầu."* do sử dụng toán tử so sánh chuỗi ASCII `form.startTime >= form.endTime` (`"9:00" >= "10:00"` cho kết quả `true`).
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/EventForm.tsx#L311-L313`:
    ```ts
    } else if (form.startTime >= form.endTime) {
      e.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu."
    }
    ```
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 8: `[BUG-PKG03-08]` Biểu mẫu thiếu trường thông tin Đối tượng tham gia (doi_tuong_tham_gia)

* **Defect ID (Issue Name):** `[BUG-PKG03-08] Biểu mẫu thiếu trường thông tin Đối tượng tham gia (doi_tuong_tham_gia)`
* **Traceability:** `PKG-03 / TC-EVT-01.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `http://localhost:5173/organizer/events/create`.
  2. Tìm kiếm trường thông tin Đối tượng tham gia.
* **Expected Outcome:**
  - Biểu mẫu có trường "Đối tượng tham gia" theo quy định của CSDL `su_kien.doi_tuong_tham_gia VARCHAR(255)` và Backend `StoreEventDraftRequest.php#L26`.
* **Actual Outcome:**
  - Hoàn toàn thiếu ô nhập `doi_tuong_tham_gia`, khiến dữ liệu luôn bị null hoặc nhận giá trị mặc định.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `StoreEventDraftRequest.php#L26` khai báo `'doi_tuong_tham_gia' => ['nullable', 'string', 'max:255']`, nhưng `EventForm.tsx` không có ô input nào liên kết.
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 9: `[BUG-PKG03-09]` Tự ý gán ngày công bố là ngày hiện tại khiến sự kiện bị xuất bản ngay khi duyệt

* **Defect ID (Issue Name):** `[BUG-PKG03-09] Tự ý gán ngày công bố là ngày hiện tại khiến sự kiện bị xuất bản ngay khi duyệt`
* **Traceability:** `PKG-03 / TC-EVT-01.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Tạo sự kiện nháp nhưng để trống trường ngày công bố.
  2. Bấm Lưu bản nháp và nộp hồ sơ phê duyệt.
  3. Admin bấm Phê duyệt (`APPROVED`).
* **Expected Outcome:**
  - Sự kiện duy trì trạng thái `APPROVED` chờ đến thời điểm công bố đã được hoạch định.
* **Actual Outcome:**
  - Frontend tự ý gán ngày công bố là ngày hiện tại (`today`), khiến daemon scheduler tự động chuyển ngay lập tức sang trạng thái `PUBLISHED` khi Admin vừa duyệt.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/EventForm.tsx#L346`:
    `ngay_cong_bo: form.regStart || new Date().toISOString().slice(0, 10)`
* **Assignee:** *Chờ gán*

---

### 🔴 Phiếu lỗi 10: `[BUG-PKG03-10]` Màn hình Quản lý sự kiện gọi nhầm API catalog công khai, biến mất sự kiện DRAFT

* **Defect ID (Issue Name):** `[BUG-PKG03-10] Màn hình Quản lý sự kiện gọi nhầm API catalog công khai, biến mất sự kiện DRAFT`
* **Traceability:** `PKG-03 / TC-EVT-01.02`
* **Severity / Priority:** `Critical (P0)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Đăng nhập với vai trò BTC: `clb.webdev@uit.edu.vn` / `Club@123`.
  2. Tạo một bản nháp sự kiện mới.
  3. Truy cập màn hình danh sách sự kiện: `http://localhost:5173/organizer/events`.
* **Expected Outcome:**
  - Bảng danh sách hiển thị đầy đủ các sự kiện của đơn vị ở cả 11 trạng thái, bao gồm cả các bản nháp `DRAFT` và sự kiện chờ duyệt.
* **Actual Outcome:**
  - Bản nháp `DRAFT` và các sự kiện chờ duyệt biến mất hoàn toàn. Bảng chỉ hiển thị các sự kiện `PUBLISHED` và `COMPLETED` do Frontend gọi nhầm API public catalog của sinh viên.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/context/EventDataContext.tsx#L272-L275`:
    ```ts
    const [pubRes, compRes] = await Promise.allSettled([
      eventsService.listPublic({ limit: 50 }),
      eventsService.listPublic({ limit: 50, trang_thai: "COMPLETED" }),
    ])
    ```
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 11: `[BUG-PKG03-11]` Nút Chỉnh sửa điều hướng sai về trang tạo mới thay vì trang sửa bản nháp

* **Defect ID (Issue Name):** `[BUG-PKG03-11] Nút Chỉnh sửa điều hướng sai về trang tạo mới thay vì trang sửa bản nháp`
* **Traceability:** `PKG-03 / TC-EVT-01.02`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `http://localhost:5173/organizer/events`.
  2. Bấm nút biểu tượng "Chỉnh sửa" (cây bút) trên một dòng sự kiện.
* **Expected Outcome:**
  - Hệ thống điều hướng đến route `/organizer/events/{id}/edit` và tải lại toàn bộ thông tin cũ của sự kiện lên biểu mẫu.
* **Actual Outcome:**
  - Hệ thống điều hướng về `/organizer/events/create` (trang tạo mới trắng tinh), hoàn toàn không tải lại dữ liệu cũ của sự kiện.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/EventsManage.tsx#L547`:
    `onClick={() => onNavigate("org-event-form")}`
  - Trong khi `routes.tsx#L654` khai báo route chỉnh sửa là:
    `{ path: "organizer/events/:id/edit", element: <OrganizerRoute page="form" /> }`
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 12: `[BUG-PKG03-12]` Các hành động trên dòng sự kiện bị cào bằng giống nhau cho mọi trạng thái

* **Defect ID (Issue Name):** `[BUG-PKG03-12] Các hành động trên dòng sự kiện bị cào bằng giống nhau cho mọi trạng thái`
* **Traceability:** `PKG-03 / TC-EVT-01.02`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `http://localhost:5173/organizer/events`.
  2. Quan sát cột Hành động trên từng dòng sự kiện ở các trạng thái khác nhau (`DRAFT`, `COMPLETED`, `CANCELLED`).
* **Expected Outcome:**
  - Các nút hành động phải hiển thị theo đúng vòng đời sự kiện (State Machine) của SRS v3.1.3 (DRAFT: Sửa/Gửi duyệt; HAPPENING: Kiosk/Soát vé; COMPLETED: Báo cáo/DRL).
* **Actual Outcome:**
  - Mọi dòng sự kiện đều hiển thị cố định đúng 4 nút: Chỉnh sửa, Người tham gia, Mở Kiosk, Soát vé Camera, bất kể sự kiện đã kết thúc hay bị hủy.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/EventsManage.tsx#L544-L590`: Render cố định 4 nút hành động không có điều kiện kiểm tra `trang_thai`.
* **Assignee:** *Chờ gán*

---

### 🟡 Phiếu lỗi 13: `[BUG-PKG03-13]` Danh sách quản lý sự kiện thiếu bộ lọc trạng thái HAPPENING (Đang diễn ra)

* **Defect ID (Issue Name):** `[BUG-PKG03-13] Danh sách quản lý sự kiện thiếu bộ lọc trạng thái HAPPENING (Đang diễn ra)`
* **Traceability:** `PKG-03 / TC-EVT-01.02`
* **Severity / Priority:** `Minor (P2/P3)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `http://localhost:5173/organizer/events`.
  2. Quan sát thanh tab bộ lọc trạng thái.
* **Expected Outcome:**
  - Có tab lọc sự kiện đang diễn ra (`HAPPENING`) theo đặc tả 11 trạng thái của SRS v3.1.3.
* **Actual Outcome:**
  - Thanh tab chỉ có: Tất cả, Bản nháp, Đang mở, Sắp hết, Đã đóng, Đã kết thúc. Hoàn toàn thiếu tab `HAPPENING`.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/EventsManage.tsx#L187-L194`:
    `const statusTabs = [{ id: "all" }, { id: "draft" }, { id: "open" }, { id: "nearly_full" }, { id: "closed" }, { id: "ended" }]`
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 14: `[BUG-PKG03-14]` Nút Người tham gia điều hướng chung chung, làm mất ngữ cảnh sự kiện

* **Defect ID (Issue Name):** `[BUG-PKG03-14] Nút Người tham gia điều hướng chung chung, làm mất ngữ cảnh sự kiện`
* **Traceability:** `PKG-03 / TC-EVT-01.02`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Tại dòng sự kiện 310 trên trang `/organizer/events`.
  2. Bấm nút biểu tượng "Người tham gia".
* **Expected Outcome:**
  - Điều hướng thẳng vào tab Người tham gia của đúng sự kiện 310 (`/organizer/participants?eventId=310`).
* **Actual Outcome:**
  - Điều hướng về trang `/organizer/participants` chung chung, người dùng phải tự tìm kiếm và bấm lại sự kiện trong danh sách.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/EventsManage.tsx#L556-L557`:
    `onClick={() => onNavigate("org-participants")}`
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 15: `[BUG-PKG03-15]` Dữ liệu số người đăng ký và tỷ lệ tham gia trên bảng sự kiện bị mock giả lập

* **Defect ID (Issue Name):** `[BUG-PKG03-15] Dữ liệu số người đăng ký và tỷ lệ tham gia trên bảng sự kiện bị mock giả lập`
* **Traceability:** `PKG-03 / TC-EVT-01.02`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Xem cột Số lượng đăng ký và Tỷ lệ lấp đầy trên bảng `/organizer/events`.
* **Expected Outcome:**
  - Hiển thị số lượng vé đăng ký thật được tổng hợp từ bảng `dang_ky` trong CSDL.
* **Actual Outcome:**
  - Số liệu bị tính toán bằng phép trừ giả lập `capacity - remaining` hoặc lấy mặc định từ `data/mock.ts`, không phản ánh đúng CSDL.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/context/EventDataContext.tsx#L164-L172`.
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 16: `[BUG-PKG03-16]` Lời mời đồng tổ chức không hiển thị ở tab Đã đồng ý / Đã từ chối và thống kê sai

* **Defect ID (Issue Name):** `[BUG-PKG03-16] Lời mời đồng tổ chức không hiển thị ở tab Đã đồng ý / Đã từ chối và thống kê sai`
* **Traceability:** `PKG-03 / TC-EVT-02.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Đăng nhập tài khoản đơn vị được mời co-host: `clb.aiclub@uit.edu.vn` hoặc `canbo.httt@uit.edu.vn`.
  2. Truy cập `/organizer/cohost-invitations`.
  3. Chọn tab "Đã đồng ý" hoặc "Đã từ chối".
* **Expected Outcome:**
  - Hiển thị danh sách các lời mời tương ứng và thẻ thống kê đếm chính xác số lượng.
* **Actual Outcome:**
  - Danh sách rỗng hoàn toàn, thẻ thống kê báo sai do Backend mặc định chỉ lọc `CHO_XAC_NHAN` khi Frontend không truyền tham số `trang_thai_xac_nhan`.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `backend/app/Services/EventProposalService.php#L461-L463`:
    `$status = $filters['trang_thai_xac_nhan'] ?? 'CHO_XAC_NHAN';`
  - `frontend/src/screens/organizer/CohostInvitations.tsx#L101`:
    Gọi `eventsService.getCohostInvitations()` không truyền tham số.
* **Assignee:** *Chờ gán*

---

### 🟡 Phiếu lỗi 17: `[BUG-PKG03-17]` Đơn vị đồng tổ chức không có nút xem chi tiết kế hoạch sự kiện (Read-only)

* **Defect ID (Issue Name):** `[BUG-PKG03-17] Đơn vị đồng tổ chức không có nút xem chi tiết kế hoạch sự kiện (Read-only)`
* **Traceability:** `PKG-03 / TC-EVT-02.01`
* **Severity / Priority:** `Minor (P2/P3)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `/organizer/cohost-invitations`.
  2. Quan sát thẻ lời mời đồng tổ chức.
* **Expected Outcome:**
  - Có nút "Xem chi tiết kế hoạch" (Read-only) để xem nội dung, lộ trình trước khi quyết định Đồng ý/Từ chối.
* **Actual Outcome:**
  - Chỉ có nút Đồng ý và Từ chối, không có liên kết nào để xem chi tiết sự kiện được mời.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/CohostInvitations.tsx`: Thiếu liên kết hoặc modal xem chi tiết sự kiện theo `eventId`.
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 18: `[BUG-PKG03-18]` Xung đột hai nguồn dữ liệu người tham gia giữa thẻ tóm tắt và bảng chi tiết

* **Defect ID (Issue Name):** `[BUG-PKG03-18] Xung đột hai nguồn dữ liệu người tham gia giữa thẻ tóm tắt và bảng chi tiết`
* **Traceability:** `PKG-03 / TC-OPS-03.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `/organizer/participants`.
  2. So sánh số lượng đăng ký/điểm danh ở thẻ bên ngoài với bảng chi tiết bên trong của cùng một sự kiện.
* **Expected Outcome:**
  - Số lượng đăng ký và điểm danh ở thẻ tóm tắt phải khớp chính xác 100% với bảng chi tiết bên trong.
* **Actual Outcome:**
  - Thẻ bên ngoài tính từ mảng `tickets` mock cục bộ, trong khi bảng chi tiết gọi API thật từ CSDL, dẫn đến số liệu mâu thuẫn hoàn toàn.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `Participants.tsx#L393-L399` (dùng mock `tickets`) vs `Participants.tsx#L147-L153` (gọi API thật).
* **Assignee:** *Chờ gán*

---

### 🟡 Phiếu lỗi 19: `[BUG-PKG03-19]` Chọn xem sự kiện trong Participants không đổi URL, nút Back bị quay về Sự kiện

* **Defect ID (Issue Name):** `[BUG-PKG03-19] Chọn xem sự kiện trong Participants không đổi URL, nút Back bị quay về Sự kiện`
* **Traceability:** `PKG-03 / TC-OPS-03.01`
* **Severity / Priority:** `Minor (P2/P3)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `/organizer/participants`.
  2. Bấm "Xem người tham gia" một sự kiện.
  3. Bấm nút Back của trình duyệt.
* **Expected Outcome:**
  - URL cập nhật query param `?eventId=...`, bấm Back quay về danh sách sự kiện của trang Participants.
* **Actual Outcome:**
  - URL không đổi, bấm Back bị thoát hoàn toàn sang trang `/organizer/events`.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/Participants.tsx#L480-L485`: Chỉ cập nhật local state `setSelectedEventId`, không push URL.
* **Assignee:** *Chờ gán*

---

### 🟡 Phiếu lỗi 20: `[BUG-PKG03-20]` Hiện 4 sự kiện mock mẫu trong lúc tải rồi mới đổi sang sự kiện thật (Layout Flash)

* **Defect ID (Issue Name):** `[BUG-PKG03-20] Hiện 4 sự kiện mock mẫu trong lúc tải rồi mới đổi sang sự kiện thật (Layout Flash)`
* **Traceability:** `PKG-03 / TC-OPS-03.01`
* **Severity / Priority:** `Minor (P2/P3)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Truy cập `/organizer/participants` với kết nối mạng bình thường.
* **Expected Outcome:**
  - Hiển thị Skeleton Loading trong lúc chờ API trả dữ liệu.
* **Actual Outcome:**
  - Chớp nháy hiển thị 4 sự kiện mock mẫu trong 300ms rồi giật sang danh sách sự kiện thật.
* **Reporter:** Trí Bùi (`clb.webdev@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/Participants.tsx#L249-L309`: Fallback render `demoEvents` khi `remote.events.length === 0`.
* **Assignee:** *Chờ gán*

---

### 🔴 Phiếu lỗi 21: `[BUG-PKG03-21]` Màn hình Thẩm định cấp Khoa bị vòng lặp vô tận (Infinite Loop), nhấp nháy liên tục

* **Defect ID (Issue Name):** `[BUG-PKG03-21] Màn hình Thẩm định cấp Khoa bị vòng lặp vô tận (Infinite Loop), nhấp nháy liên tục`
* **Traceability:** `PKG-03 / TC-EVT-03.01`
* **Severity / Priority:** `Critical (P0)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Đăng nhập tài khoản Khoa: `canbo.httt@uit.edu.vn` / `Faculty@123`.
  2. Truy cập `/faculty/approvals`.
* **Expected Outcome:**
  - Tải danh sách hồ sơ một lần, hiển thị ổn định, không giật lag.
* **Actual Outcome:**
  - Màn hình nhấp nháy loading liên tục, CPU trình duyệt tăng vọt do `useEffect` kích hoạt re-render vô tận.
* **Reporter:** Trí Bùi (`canbo.httt@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/management/ApprovalWorkspace.tsx#L63-L89`:
    `useEffect` có dependency `[refreshReviewQueue, approvalCases]` gây loop vô tận.
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 22: `[BUG-PKG03-22]` Tab Sự kiện trực thuộc Khoa điều hướng sai sang trang Ban Tổ Chức (/organizer)

* **Defect ID (Issue Name):** `[BUG-PKG03-22] Tab Sự kiện trực thuộc Khoa điều hướng sai sang trang Ban Tổ Chức (/organizer)`
* **Traceability:** `PKG-03 / TC-EVT-03.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Tại giao diện Khoa `/faculty/approvals`.
  2. Bấm vào tab "Sự kiện trực thuộc Khoa" trên thanh điều hướng.
* **Expected Outcome:**
  - Giữ nguyên giao diện quản lý cấp Khoa (`ManagementLayout`) và URL `/faculty/...`.
* **Actual Outcome:**
  - Bị nhảy sang route `/organizer/events` và chuyển thành layout Ban Tổ Chức CLB (`OrgLayout`).
* **Reporter:** Trí Bùi (`canbo.httt@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/management/ManagementLayout.tsx#L97-L100`:
    Tab gắn `id: "org-events"`, routes ánh xạ sang `/organizer/events`.
* **Assignee:** *Chờ gán*

---

### 🟠 Phiếu lỗi 23: `[BUG-PKG03-23]` Dashboard thống kê hardcode sự kiện 101, nuốt lỗi 403 khiến Khoa không xem được 310

* **Defect ID (Issue Name):** `[BUG-PKG03-23] Dashboard thống kê hardcode sự kiện 101, nuốt lỗi 403 khiến Khoa không xem được 310`
* **Traceability:** `PKG-03 / TC-REP-01.01`
* **Severity / Priority:** `Major (P1)`
* **Defect Status:** `To-do`
* **Reproduction Steps:**
  1. Đăng nhập `canbo.httt@uit.edu.vn`.
  2. Vào xem Dashboard báo cáo sự kiện co-host 310.
* **Expected Outcome:**
  - Cho phép chọn sự kiện 310 và hiển thị đầy đủ các chỉ số check-in/out, DRL.
* **Actual Outcome:**
  - Dashboard hardcode tải sự kiện 101 hoặc `events[0]`, Backend trả lỗi 403 bị khối `catch` nuốt sạch, màn hình hiện số liệu rỗng.
* **Reporter:** Trí Bùi (`canbo.httt@uit.edu.vn`)
* **Environment:** `Chrome`, `Localhost`, `PC`
* **Evidence & Logs:**
  - `frontend/src/screens/organizer/Dashboard.tsx#L66`:
    `currentEventId = events[0]?.ma_su_kien || 101`
  - `frontend/src/screens/organizer/Dashboard.tsx#L84`:
    Nuốt lỗi silent.
* **Assignee:** *Chờ gán*

---

## 📌 III. KẾT LUẬN THẨM ĐỊNH USE CASE

1. **Đánh giá thẩm định Use Case:** ❌ **FAIL `UC-EVT-01`**. Biểu mẫu tạo sự kiện và trang quản trị sự kiện chưa đạt tiêu chuẩn nghiệm thu UAT để đưa vào vận hành thực tế.
2. **Cảnh báo tiến độ:** Các Use Case `UC-EVT-03` và `UC-REP-01` hiện đang ở trạng thái **Blocked** do lỗi vòng lặp vô tận (P0) tại `/faculty/approvals` và thiếu bộ chọn sự kiện tại Dashboard.
3. Toàn bộ 23 phiếu lỗi đã được định dạng chuẩn xác theo mẫu Notion để bàn giao cho đội ngũ phát triển.
