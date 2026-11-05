Dựa trên tài liệu User Stories, Yêu cầu chức năng và Yêu cầu phi chức năng, hệ thống được bóc tách thành 3 phân hệ (Role-based) với tổng cộng 14 màn hình chính và cấu trúc chi tiết từng màn hình như sau:

Danh sách màn hình tổng thể (Screen List)
Phân hệ
ID Màn hình
Tên màn hình
Mục đích & Loại giao diện
Dùng chung
COM-01
Đăng nhập / Đăng ký
Phân quyền truy cập theo Role (Web/Mobile)
Sinh viên
STU-01
Khám phá sự kiện (Trang chủ)
Tìm kiếm, lọc theo chủ đề & trạng thái vé


STU-02
Chi tiết sự kiện & Đăng ký
Xem nội dung, số slot còn lại, form đăng ký


STU-03
Xác nhận đăng ký & Vé QR
Modal/Màn hiển thị mã QR ngay sau khi đặt slot


STU-04
Vé của tôi (My Tickets)
Quản lý vé đã đặt, trạng thái check-in, hủy vé


STU-05
Hồ sơ cá nhân (Profile)
Quản lý thông tin MSSV, Khoa, Email (Auto-fill)
Ban tổ chức
ORG-01
Tổng quan & Báo cáo (Dashboard)
Biểu đồ tỷ lệ đăng ký vs check-in thực tế


ORG-02
Quản lý sự kiện (Danh sách)
Xem danh sách sự kiện, trạng thái lấp đầy slot


ORG-03
Tạo mới / Chỉnh sửa sự kiện
Form cấu hình thông tin, thời gian, capacity


ORG-04
Danh sách người tham gia
Quản lý sinh viên đăng ký, đổi trạng thái, Export CSV


ORG-05
Quản lý & Phân quyền Staff
Cấp tài khoản/mã kích hoạt cho nhân viên check-in
Check-in Staff
STF-01
Quét mã QR Check-in
Giao diện Camera toàn màn hình + ô nhập tay mã


STF-02
Kết quả Check-in (Feedback Pop-up)
Phản hồi trạng thái vé tức thì (< 2s)


STF-03
Lịch sử quét gần đây
Danh sách vé vừa check-in để đối soát nhanh

Cấu trúc chi tiết từng màn hình (Wireframe Specifications)
1. Phân hệ Sinh viên (Tối ưu hóa Mobile Web / Responsive)
STU-01: Khám phá sự kiện



Thanh tìm kiếm & Bộ lọc (Top Bar): Ô input tìm theo tên/diễn giả; bộ lọc thả xuống theo Chủ đề (Học thuật, Kỹ năng, Văn nghệ); bộ lọc Trạng thái (Còn chỗ, Sắp hết, Hết vé).


Danh sách thẻ sự kiện (Event Cards): Ảnh banner, Tên sự kiện, Thời gian - Địa điểm, Thanh tiến trình lấp đầy (ví dụ: Đã đăng ký 180/200 chỗ), Tag trạng thái.


Bottom Navigation Bar: Trang chủ, Vé của tôi, Hồ sơ cá nhân.


STU-02: Chi tiết sự kiện & Đăng ký



Hero Section: Tên sự kiện, diễn giả, thời gian, địa điểm, số slot còn trống hiển thị theo thời gian thực.


Nội dung chi tiết: Mô tả chương trình, quyền lợi (cộng điểm rèn luyện, chứng chỉ...).


Form đăng ký (Sticky Bottom Bar): Thông tin MSSV, Họ tên, Email, Khoa (tự động điền từ Profile); Nút CTA chính:



Nếu còn chỗ: Nút "Đăng ký ngay" (Nổi bật).


Nếu hết chỗ: Nút bị vô hiệu hóa (Disabled) hiển thị "Hết chỗ".


STU-03: Xác nhận đăng ký & Vé QR (Pop-up hoặc Màn hoàn tất)



Icon thành công: Thông báo "Đăng ký giữ chỗ thành công!".


Mã vé định danh: Hiển thị Mã QR Code kích thước lớn ở trung tâm kèm mã chuỗi ký tự dự phòng bên dưới.


Thông tin tóm tắt: Tên sự kiện, thời gian, vị trí ghế/khu vực.


Nút thao tác: "Lưu ảnh mã QR về máy", "Xem trong Vé của tôi".


STU-04: Vé của tôi (My Tickets)



Tab chuyển đổi: "Sắp diễn ra" và "Lịch sử tham gia".


Thẻ vé (Ticket Card): Tên sự kiện, ngày giờ, Badge trạng thái (Chưa check-in, Đã tham dự, Đã hủy).


Hành động:



Nút bấm mở nhanh mã QR để đưa nhân viên quét.


Nút "Hủy vé": Chỉ hiển thị trước giờ G; khi bấm hiện Modal cảnh báo "Bạn có chắc chắn muốn hủy? Slot này sẽ được nhường cho sinh viên khác" để thu hồi vé.


STU-05: Hồ sơ cá nhân (Profile)



Avatar & Tên hiển thị.


Form thông tin cố định: MSSV, Khoa/Viện, Email sinh viên, Số điện thoại.


Nút "Cập nhật thông tin" và "Đăng xuất".


2. Phân hệ Quản lý / Ban tổ chức (Web Desktop)
ORG-01: Tổng quan & Báo cáo (Dashboard)



Chỉ số nhanh (KPI Cards): Tổng số sự kiện đang mở, Tổng lượt đăng ký, Tỷ lệ check-in trung bình toàn khóa.


Khung biểu đồ phân tích (Story 6):



Biểu đồ cột so sánh: Số lượng đăng ký vs Số lượng check-in thực tế theo từng sự kiện.


Biểu đồ tròn: Tỷ lệ phân bổ sinh viên theo các khoa/viện hoặc chủ đề quan tâm.


Bộ lọc thời gian: Lọc báo cáo theo Tháng, Học kỳ, Năm học.


ORG-02: Quản lý sự kiện (Data Grid)



Thanh công cụ: Nút "+ Tạo sự kiện mới", ô tìm kiếm, lọc theo ngày/trạng thái.


Bảng dữ liệu (Table Columns): Tên sự kiện, Ngày tổ chức, Địa điểm, Sức chứa (Capacity), Số lượng đã đăng ký (Registered), Trạng thái (Bản nháp, Đang mở, Đã đóng, Đã kết thúc), Cột thao tác (Xem danh sách SV, Chỉnh sửa, Hủy sự kiện).


ORG-03: Tạo mới / Chỉnh sửa sự kiện



Phần thông tin chung: Tiêu đề, Phân loại chủ đề (Dropdown), Mô tả rich-text, Banner sự kiện.


Phần thiết lập thời gian & sức chứa (Business Rule):



Thời gian mở/đóng link đăng ký, Thời gian diễn ra sự kiện.


Capacity (Giới hạn tối đa): Ô nhập số nguyên dương bắt buộc.


Nút CTA: "Lưu bản nháp", "Công bố sự kiện".


ORG-04: Danh sách người tham gia & Điểm danh



Thanh điều hướng trên: Tên sự kiện đang xem, Breadcrumb quay lại danh sách.


Chức năng thao tác: Nút "Xuất danh sách (Excel/CSV)", Nút "Cập nhật trạng thái thủ công".


Bảng dữ liệu chi tiết: MSSV, Họ tên, Lớp, Thời gian đăng ký, Trạng thái vé (Chờ tham gia / Đã tham dự), Thời gian check-in thực tế.


ORG-05: Phân quyền & Quản lý Staff



Bảng danh sách Staff: Họ tên, Email, Sự kiện được phân công phụ trách check-in, Trạng thái tài khoản.


Nút "+ Thêm nhân viên / Tạo mã kích hoạt": Modal nhập email hoặc tạo mã token cấp quyền cho nhân viên đăng nhập app quét mã.


3. Phân hệ Nhân viên Check-in (Thiết kế ưu tiên Mobile View)
STF-01: Quét mã QR Check-in



Khung quét (Viewport Camera): Chiếm 60% diện tích phía trên màn hình kèm khung viền ngắm (Target Frame) hỗ trợ nhận diện tự động.


Bộ công cụ hỗ trợ: Nút bật/tắt Đèn Flash (hỗ trợ điều kiện thiếu sáng), Nút đổi Camera trước/sau.


Vùng nhập thủ công (Dự phòng mã mờ/lỗi camera): Ô text box "Nhập mã vé" + Nút "Xác nhận".


Bộ chọn sự kiện: Dropdown chọn đúng sự kiện mình đang đứng gác cổng điểm danh.


STF-02: Kết quả phản hồi Check-in (Modal/Toast phản hồi < 2s)



Trường hợp Hợp lệ (Xanh lá):



Biểu tượng Checkmark lớn, âm thanh "Beep" thành công.


Thông tin hiển thị: Tên sinh viên, MSSV, Khoa.


Trạng thái: "Check-in thành công". Tự động biến mất sau 1.5 giây để tiếp tục quét người tiếp theo.


Trường hợp Không hợp lệ (Đỏ):



Biểu tượng Cảnh báo, âm thanh "Buzzer" báo lỗi.


Thông báo lỗi cụ thể: "Vé đã được sử dụng lúc 08:15" hoặc "Vé không thuộc sự kiện này" hoặc "Vé đã bị hủy".


Nút bấm: "Quét lại".


STF-03: Lịch sử quét gần nhất



Danh sách rút gọn cuối màn hình: Hiển thị 5 sinh viên check-in thành công gần nhất kèm mốc thời gian (ví dụ: Nguyễn Văn A - 2452xxxx - 08:29:12), giúp nhân viên tra soát nhanh khi có tranh chấp tại cửa ra vào.

