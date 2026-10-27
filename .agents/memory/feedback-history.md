---
type: feedback
created: 2026-07-18
updated: 2026-10-21
---

# Feedback History

## 2026-10-21: Tinh chỉnh Phạm vi AI Agent theo Feedback Giáo viên
- **Cắt bỏ hoàn toàn AI Agent phía Sinh viên (`UC-AI-01`):** Tránh tính năng dư thừa (UI duyệt/đặt vé đã tối ưu hơn chat) và tránh phụ thuộc vào dữ liệu ĐRL không thể đồng bộ từ hệ thống đào tạo của trường.
- **Organizer Agent:** Hỗ trợ tạo nội dung truyền thông (mô tả, agenda, bài đăng mạng xã hội) và phân tích dữ liệu/tóm tắt feedback gói gọn trong phạm vi các sự kiện thuộc đơn vị tổ chức đó.
- **Admin Agent:** Hỗ trợ phân tích dữ liệu vĩ mô (Text-to-Insight) an toàn trên phạm vi toàn trường (toàn bộ sự kiện).
- **Kế hoạch cập nhật tài liệu:** Sẽ cập nhật một lần toàn bộ `SRS.md`, `project_charter.md`, `QUICK_CONTEXT.md` sau khi hoàn tất trao đổi tất cả các feedback.

## 2026-10-21: Quy trình Đa Đơn vị Tổ chức (Co-organizers) & Luồng Phê duyệt Đa cấp
- **Phân cấp Đơn vị Tổ chức (`don_vi_to_chuc`):**
  - Thêm `ma_don_vi_cha` (Self-referencing Foreign Key, nullable).
  - `ma_don_vi_cha IS NULL`: Đơn vị cấp Trường (Khoa, Đoàn - Hội Trường, CLB Cấp Trường).
  - `ma_don_vi_cha = <id_khoa>`: CLB trực thuộc Khoa tương ứng.
- **Quan hệ Đa Đơn vị Tổ chức (`su_kien_dong_to_chuc`):**
  - Host A (Primary/Lead Organizer) tạo đề xuất và mời các đơn vị B, C, D... cùng tham gia.
  - Lưu trạng thái xác nhận của từng đơn vị: `CHO_XAC_NHAN`, `DONG_Y`, `TU_CHOI`.
  - **Quy tắc chuyển trạng thái duyệt:** Sự kiện chỉ được chuyển sang hàng đợi chờ duyệt chính thức khi **100% các đơn vị đồng tổ chức (B, C, D...) bấm Xác nhận Đồng ý**. Nếu có bất kỳ đơn vị nào từ chối, sự kiện trả về cho Host A chỉnh sửa/xóa co-host (`COHOST_REJECTED` / `DRAFT`).
  - Giữ chỗ phòng tạm thời (Soft Hold) trong tối đa 48 giờ để các bên xác nhận.
- **Luồng Phê duyệt Đa cấp (Host-driven Approval Routing):**
  - **Trường hợp Host A là CLB cấp Khoa:** Sau khi đồng tổ chức xác nhận $\rightarrow$ Chuyển sang `PENDING_FACULTY` (Khoa của A duyệt nội dung) $\rightarrow$ Khoa thông qua $\rightarrow$ Chuyển sang `PENDING_ADMIN` (Phòng CTSV duyệt phòng & ĐRL) $\rightarrow$ `APPROVED`.
  - **Trường hợp Host A là CLB cấp Trường hoặc Khoa:** Sau khi đồng tổ chức xác nhận $\rightarrow$ Chuyển thẳng sang `PENDING_ADMIN` (Phòng CTSV duyệt trực tiếp) $\rightarrow$ `APPROVED`.

## 2026-10-21: Giải pháp Toàn diện Chống Gian lận Điểm danh (Anti-Fraud Check-in Framework)
- **Phân tầng Bài toán Gian lận:**
  - *Gian lận từ xa (Remote Fraud):* Triệt tiêu hoàn toàn nhờ Dynamic QR xoay vòng 30s (TOTP) trên màn chiếu hội trường kết hợp kiểm soát thời lượng 2 chiều ($\ge 60\%$). Sinh viên ở nhà không thể quét mã chụp lại gửi qua mạng.
  - *Gian lận tại chỗ (On-site Proxy Check-in):* Xử lý bằng mô hình Hybrid kết hợp giữa giải pháp Công nghệ (Software Controls) và Quy trình Vận hành Thực tế (Operational Controls).
- **Giải pháp Công nghệ — Phát hiện Bất thường & Khóa Thiết bị (Device Binding & Anomaly Detection):**
  - *Định danh thiết bị độc lập (Device Identifier):* Mỗi trình duyệt điện thoại duy trì một mã định danh thiết bị duy nhất, tồn tại độc lập với phiên đăng nhập của người dùng (không bị mất khi người dùng bấm Đăng xuất).
  - *Quy tắc chống quét chéo:* Hệ thống theo dõi lịch sử điểm danh theo từng thiết bị trong mỗi sự kiện. Nếu phát hiện cùng một thiết bị thực hiện điểm danh cho 2 tài khoản sinh viên khác nhau trong cùng một sự kiện, hệ thống lập tức chặn lượt quét thứ hai, gắn cờ nghi vấn gian lận và yêu cầu sinh viên xuất trình thẻ với nhân viên soát vé.
  - *Cơ chế Phiên đăng nhập Đơn nhất (Single Active Session):* Chặn một tài khoản đăng nhập đồng thời trên nhiều thiết bị. Nếu tài khoản được đăng nhập tại hội trường, phiên làm việc trước đó trên máy tính/điện thoại ở nhà sẽ tự động bị chấm dứt ngay lập tức.
- **Ràng buộc Thực tế & Quy trình Vận hành (Operational & Policy Controls):**
  - *Giám sát hiện trường từ Staff:* Kiosk quét tự phục vụ luôn có nhân viên soát vé (Staff) trực tiếp quan sát tại cổng/màn chiếu, kịp thời phát hiện sinh viên thao tác trên nhiều thiết bị.
  - *Điều kiện tiên quyết Feedback 48h:* Sinh viên bắt buộc phải hoàn thành khảo sát đánh giá diễn giả và nội dung sự kiện trong 48 giờ để được duyệt ĐRL; người không trực tiếp tham dự sẽ không thể trả lời các câu hỏi đánh giá nội dung này.
  - *Rào cản an toàn tài khoản trường:* Tài khoản định danh gắn liền với danh tính sinh viên trường (SSO/Email trường), tạo ra sự đánh đổi quá lớn về quyền riêng tư và dữ liệu cá nhân nếu chia sẻ mật khẩu cho người khác.

## 2026-10-21: Chuẩn hóa 6 Quy tắc Nghiệp vụ Cốt lõi & Xử lý Edge Cases
1. **Quy tắc Hủy vé & Xử lý No-show:**
   - *Hạn chót Hủy vé:* Khóa nút hủy vé tại mốc $T - 4$h (trước giờ sự kiện 4 tiếng). Sau mốc này sinh viên không được phép tự hủy vé để tránh lãng phí slot sát giờ.
   - *Xử lý No-show:* Cuối ngày, tác vụ nền tự động phát hiện các vé chưa check-in của sự kiện đã kết thúc $\rightarrow$ Gửi email/thông báo cảnh báo vi phạm; ghi nhận cờ dữ liệu vi phạm để Phòng CTSV toàn quyền quyết định chế tài khi xét ĐRL cuối kỳ.
2. **Kiểm soát Trùng lịch Cá nhân & Phân loại Sự kiện:**
   - *Sự kiện có giới hạn slot:* Chặn tuyệt đối hành vi đăng ký 2 sự kiện có giới hạn slot diễn ra trùng khung giờ (yêu cầu hủy vé cũ nếu muốn đăng ký vé mới).
   - *Sự kiện không giới hạn slot (`khong_gioi_han_slot = 1`):* Cho phép đăng ký nhưng hiển thị thông báo cảnh báo (Soft Warning) để sinh viên tự sắp xếp thời gian.
3. **Mở Cổng Check-out Nghiêm ngặt & Công thức Tính Thời lượng Tham gia ($\Delta t$):**
   - *Ràng buộc Kiosk Check-out:* Nút mở Kiosk bị làm mờ cho đến khi $\text{Thời gian hiện tại} \ge \text{Thời gian kết thúc} - 25 \text{ phút}$. Nếu mở sớm hơn giờ kết thúc kế hoạch, Organizer bắt buộc phải gõ xác nhận `CONFIRM` / `XÁC NHẬN` trong modal cảnh báo (hành động không thể hoàn tác). Cổng Check-out duy trì đến $\text{Thời gian kết thúc} + 15 \text{ phút}$.
   - *Công thức tính $\Delta t$ triệt tiêu gian lận:*
     $$\Delta t = \min(\text{Thời điểm quét Check-out}, \text{Thời điểm kết thúc thực tế}) - \max(\text{Thời điểm quét Check-in}, \text{Thời điểm bắt đầu sự kiện})$$
4. **Xử lý Quên Check-out:**
   - Hệ thống giữ nguyên tắc trách nhiệm người dùng: Không có Check-out = Chưa hoàn thành = 0 ĐRL. Mọi khiếu nại do Phòng CTSV xem xét và can thiệp hành chính ngoài hệ thống.
5. **Rút ngắn Claim Window của Waitlist sát mốc $T - 2$h:**
   - Hạn chót nhận vé giữ chỗ tính linh hoạt: $\text{Hạn chót} = \min(\text{NOW()} + 60 \text{ phút}, \text{Mốc } T - 2\text{h})$.
   - Đảm bảo giải phóng hoàn toàn các slot tồn đọng trước khi Waitlist đóng cửa lúc $T - 2$h, tránh hiện tượng "slot treo ma" khi cận giờ diễn ra sự kiện.
6. **Cắt bỏ Tính năng Dời phòng (`RESCHEDULE_PENDING` / `UC-EVT-04`):**
   - Loại bỏ trạng thái dời phòng trên web để tinh gọn State Machine. Đảm bảo bất biến $\text{so\_luong\_toi\_da} \le \text{phong\_hoi\_truong.suc\_chua}$ ngay từ khâu tạo sự kiện. Nếu thực tế có dời phòng, Ban tổ chức tự điều phối thông báo tại chỗ hoặc gửi email khẩn cấp, hệ thống không can thiệp.


