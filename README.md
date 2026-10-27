# Campus Event Hub (CEH Main Project)

Nền tảng Quản lý, Đăng ký Sự kiện Sinh viên & Điểm danh Thông minh (Đồ án IS207 - UIT).

---

## 📑 Mục Lục
1. [Kiến trúc & Tổng quan Dịch vụ (Ports & Services)](#-kiến-trúc--tổng-quan-dịch-vụ-ports--services)
2. [Thiết lập Môi trường Bằng Docker Compose (Khuyến nghị cho cả đội)](#-phương-pháp-1-khởi-chạy-bằng-docker-compose-khuyến-nghị)
3. [Thiết lập Môi trường Local Native (Không qua Docker)](#-phương-pháp-2-cài-đặt-local-native-php--composer--mysql)
4. [Dữ liệu Hạt giống & Tài khoản Kiểm thử Mặc định (WP1.1)](#-dữ-liệu-hạt-giống--tài-khoản-kiểm-thử-mặc-định-wp11)
5. [Nền tảng Kiến trúc & Tính năng Sẵn sàng (WP1.2)](#-nền-tảng-kiến-trúc--tính-năng-sẵn-sàng-wp12)
6. [Lệnh Kiểm thử & Xác minh Toàn vẹn (Test & Verification)](#-lệnh-kiểm-thử--xác-minh-toàn-vẹn-test--verification)
7. [Hướng dẫn Luồng Kiểm thử Mẫu (Testing Workflow)](#-hướng-dẫn-luồng-kiểm-thử-mẫu-testing-workflow)
8. [Xử lý Sự cố Thường gặp (Troubleshooting)](#-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 🌐 Kiến trúc & Tổng quan Dịch vụ (Ports & Services)

Hạ tầng dự án được chuẩn hóa từ **Phase 0** và **Phase 1 (WP1.1, WP1.2)** bao gồm 5 dịch vụ hoạt động độc lập:

| Dịch vụ | Công nghệ | Cổng Host | Cổng Nội bộ | Mục đích & Mô tả |
| :--- | :--- | :---: | :---: | :--- |
| **Backend API** | PHP 8.2+ / Laravel 12 | [`8000`](http://localhost:8000) | `8000` | Cung cấp RESTful API, Service Layer, Sanctum Auth, Single Session |
| **Frontend SPA** | React 19 (Vite) / Nginx | [`5173`](http://localhost:5173) | `80` | Giao diện người dùng Web App |
| **MySQL Database** | MySQL 8.4 InnoDB | `3307` | `3306` | CSDL 24 bảng chuẩn 3NF, 3 Views, Virtual Columns |
| **Mailpit Dashboard** | Mailpit SMTP Server | [`8025`](http://localhost:8025) | `8025` (Web)<br>`1025` (SMTP) | Hộp thư thử nghiệm cục bộ, xem Email OTP kích hoạt & vé QR |
| **OpenAPI Mock Server**| Stoplight Prism v5 | [`4010`](http://localhost:4010) | `4010` | Server giả lập API Contract theo [`docs/openapi_v3.2.3.yml`](docs/openapi_v3.2.3.yml) |

---

## 🚀 Phương pháp 1: Khởi chạy bằng Docker Compose (Khuyến nghị)

Toàn bộ Backend, Database, Mailpit và Mock Server đã được container hóa tối ưu trong [`compose.yaml`](compose.yaml). Đồng đội chỉ cần thực hiện các bước sau:

### 1. Yêu cầu tiên quyết
- Cài đặt và bật **Docker Desktop** (trên Windows / macOS / Linux).
- Cài đặt **Node.js** (v20+ hoặc v24) và **npm** (để chạy linter / dev frontend).

### 2. Khởi chạy toàn bộ hệ thống
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
docker compose up -d
```
*(Nếu dùng Docker Compose v1 cũ: `docker-compose up -d`).*

> [!NOTE]
> **Cơ chế tự động khi container `app` khởi động lần đầu**:
> 1. Tự sao chép `backend/.env.example` thành `backend/.env` nếu chưa có.
> 2. Tự động chạy `composer install` cài đặt thư viện PHP.
> 3. Tự động sinh `APP_KEY` an toàn.
> 4. Cấp quyền ghi thư mục `storage` và `bootstrap/cache`.
> 5. Tự động chạy `php artisan migrate --force` tạo toàn bộ 24 bảng và 3 views CSDL.

### 3. Nạp dữ liệu mẫu ban đầu (Seed Data WP1.1)
Sau khi container chạy ổn định (khoảng 15-30 giây), chạy lệnh sau để nạp dữ liệu danh mục Khoa, CLB, Phòng hội trường và các tài khoản mẫu:
```bash
docker compose exec -T app php artisan db:seed
```

### 4. Cài đặt thư viện Frontend
Mở một terminal mới:
```bash
cd frontend
npm ci
```

### 5. Dừng các container khi không sử dụng
```bash
docker compose down
```

### 6. Kiểm tra trạng thái hoạt động
- Kiểm tra Backend Healthcheck: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Kiểm tra Mailpit Web UI: [http://localhost:8025](http://localhost:8025)
- Kiểm tra Mock Server Prism: [http://localhost:4010](http://localhost:4010)

---

## 💻 Phương pháp 2: Cài đặt Local Native (PHP + Composer + MySQL)

Dành cho thành viên muốn chạy trực tiếp trên máy host không qua Docker:

### 1. Yêu cầu môi trường
- **PHP >= 8.2** với các extension: `pdo_mysql`, `mbstring`, `bcmath`, `gd`, `zip`, `opcache`, `pcntl`.
- **Composer >= 2.x**.
- **MySQL >= 8.0** hoặc **8.4** (đang chạy cổng `3306` hoặc cổng Docker `3307`).

### 2. Cấu hình Backend
```bash
cd backend

# 1. Sao chép file môi trường
cp .env.example .env

# 2. Cài đặt thư viện Composer
composer install

# 3. Tạo Application Key
php artisan key:generate

# 4. Cấu hình kết nối CSDL trong file .env:
# Nếu dùng MySQL cài trực tiếp trên máy host:
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=ceh
# DB_USERNAME=root
# DB_PASSWORD=your_password
#
# Nếu dùng MySQL từ container Docker db (port 3307):
# DB_HOST=127.0.0.1
# DB_PORT=3307
# DB_DATABASE=ceh
# DB_USERNAME=ceh_user
# DB_PASSWORD=ceh_local_password

# 5. Chạy Migrations và Seeders
php artisan migrate
php artisan db:seed

# 6. Khởi động server phát triển
php artisan serve
```
Backend API sẽ lắng nghe tại [http://localhost:8000](http://localhost:8000).

---

## 👥 Dữ liệu Hạt giống & Tài khoản Kiểm thử Mặc định (WP1.1)

Sau khi chạy `php artisan db:seed`, hệ thống đã nạp sẵn các dữ liệu chuẩn UIT:
- **6 Khoa & Phòng ban**: Khoa HTTT, KHMT, KTMT, MMT&TT, KTPM, TTĐPT, P.CTSV, Đoàn - Hội.
- **CLB trực thuộc**: WebDev Club, AI Club, CyberSecurity Club...
- **5 Chuyên đề**: Công nghệ, Học thuật, Kỹ năng mềm, Khởi nghiệp, Tình nguyện.
- **Hội trường**: Hội trường E (Sức chứa 400), Hội trường A (Sức chứa 300), C109, B114.

### Danh sách Tài khoản Kiểm thử Mặc định:

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Ghi chú tài khoản |
| :--- | :--- | :---: | :--- |
| **Quản trị viên (Admin)** | `admin@uit.edu.vn` | `Password123@` | Admin hệ thống gốc, `buoc_doi_mat_khau = 0` |
| **Cán bộ P.CTSV (Admin)** | `pctsv@uit.edu.vn` | `Password123@` | Quyền Admin, duyệt sự kiện cấp trường & ĐRL |
| **Đại diện Khoa HTTT (ToChuc)** | `httt@uit.edu.vn` | `Password123@` | BTC cấp Khoa (`ma_don_vi_to_chuc = 1`) |
| **Sinh viên Mẫu (SinhVien)** | `22520001@gm.uit.edu.vn` | `Password123@` | MSSV: `22520001`, đã đồng ý NĐ 13 |

---

## 🛡️ Nền tảng Kiến trúc & Tính năng Sẵn sàng (WP1.2)

Hệ thống Backend đã được thiết lập sẵn các cơ chế chuẩn mực:

1. **Chuẩn hóa API Response Envelope**: Mọi API trả về đúng cấu trúc thống nhất:
   ```json
   // Thành công:
   { "success": true, "data": { ... }, "message": "Thông báo tiếng Việt", "server_time": "2026-10-28T00:00:00Z" }

   // Thất bại:
   { "success": false, "error": { "code": "ERROR_CODE", "details": { ... } }, "message": "Mô tả lỗi chi tiết" }
   ```
2. **Cơ chế Single Active Session (Sinh viên)**:
   - Sinh viên đăng nhập ở thiết bị mới sẽ tự động hủy phiên làm việc ở thiết bị cũ nhằm chống gian lận điểm danh.
   - Tài khoản Admin / ToChuc cho phép đăng nhập đa thiết bị.
3. **Mật mã học & Toàn vẹn vé (`CryptoService`)**:
   - Tích hợp HMAC-SHA256 ký số mã vé và giấy chứng nhận số.
   - Hàm so sánh an toàn thời gian hằng số `hash_equals()` chống tấn công Timing Attack.
4. **Nhật ký Kiểm duyệt Bất biến (`AuditLogService`)**:
   - Tự động ghi vết các thao tác duyệt/từ chối/hủy sự kiện vào bảng `nhat_ky_kiem_duyet`.
5. **Bảo mật Tầng Middleware**:
   - `EnsureUserRole`: Phân quyền RBAC 4 vai trò.
   - `EnsurePasswordChanged`: Buộc tài khoản nội bộ đổi mật khẩu lần đầu (`buoc_doi_mat_khau`).

---

## 🧪 Lệnh Kiểm thử & Xác minh Toàn vẹn (Test & Verification)

Dự án tuân thủ quy chuẩn nghiêm ngặt **`rules/test-integrity-harness.md`**. Trước khi commit code, đồng đội hãy chạy các lệnh kiểm tra:

### 1. Chạy Toàn Bộ Test Suite Backend
```bash
# Qua Docker:
docker compose exec -T app php artisan test

# Hoặc Local Native:
cd backend && php artisan test
```

### 2. Kiểm tra Trạng thái Migrations & Views
```bash
docker compose exec -T app php artisan migrate:status
```
*(Yêu cầu 100% migrations và views hiển thị trạng thái `Ran`).*

### 3. Kiểm tra Chuẩn Code (Linter & Formatter)
```bash
# Backend (Laravel Pint):
docker compose exec -T app ./vendor/bin/pint --test

# Tự động format code Backend:
docker compose exec -T app ./vendor/bin/pint

# Frontend (ESLint):
cd frontend && npm run lint
```

---

## 🔄 Hướng dẫn Luồng Kiểm thử Mẫu (Testing Workflow)

### 1. Kiểm thử Luồng Đăng ký & Kích hoạt Tài khoản Sinh viên (OTP Email)
1. Gửi request `POST http://localhost:8000/api/auth/register` với body:
   ```json
   {
     "ho_ten": "Nguyễn Văn A",
     "mssv": "22529999",
     "email": "22529999@gm.uit.edu.vn",
     "mat_khau": "Password123@",
     "mat_khau_confirmation": "Password123@",
     "dong_y_nghi_dinh_13": true
   }
   ```
2. Mở trình duyệt truy cập **Mailpit** tại: [http://localhost:8025](http://localhost:8025).
3. Mở email kích hoạt vừa nhận, copy mã OTP 6 chữ số.
4. Gửi request `POST http://localhost:8000/api/auth/verify-registration-otp` kèm email và mã OTP để hoàn tất kích hoạt.

### 2. Kiểm thử Frontend với Mock Server (Dành cho thành viên làm UI)
- Đội Frontend có thể trỏ `baseURL` sang `http://localhost:4010` để mock toàn bộ dữ liệu sự kiện, đặt vé, điểm danh Kiosk theo đúng chuẩn hợp đồng mà không cần chờ Backend hoàn thành code.

---

## 🛠️ Xử lý Sự cố Thường gặp (Troubleshooting)

| Tình trạng lỗi | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **`SQLSTATE[HY000] [2002] Connection refused`** | MySQL chưa sẵn sàng hoặc sai cổng | Chờ 15s cho container MySQL hoàn tất Healthcheck. Nếu kết nối từ máy Host bằng DBeaver/Navicat, dùng cổng **`3307`** (User: `ceh_user`, Pass: `ceh_local_password`). |
| **Lỗi quyền ghi thư mục `storage`** (Linux/WSL) | Quyền sở hữu file thuộc root | Chạy: `docker compose exec -T app chmod -R 777 storage bootstrap/cache` |
| **Container `app` bị Restart Loop** | Chưa cài đặt dependencies hoặc lỗi `.env` | Chạy `docker compose logs -f app` để xem log chi tiết. |
| **Không nhận được Email OTP** | Sai cấu hình Mailpit trong `.env` | Kiểm tra `.env` có `MAIL_HOST=mailpit` và `MAIL_PORT=1025` chưa. Truy cập [http://localhost:8025](http://localhost:8025) để kiểm tra. |

---

## 📚 Tài liệu Tham khảo Kỹ thuật (SSOT)
- **Kế hoạch Phase 1**: [`docs/plans/02_phase_1_backend_foundation.md`](docs/plans/02_phase_1_backend_foundation.md)
- **Kế hoạch Phase 2**: [`docs/plans/03_phase_2_domain_features_and_business_logic.md`](docs/plans/03_phase_2_domain_features_and_business_logic.md)
- **Đặc tả Nghiệp vụ SRS**: [`docs/srs_v3_1_3.md`](docs/srs_v3_1_3.md)
- **Hợp đồng API OpenAPI**: [`docs/openapi_v3.2.3.yml`](docs/openapi_v3.2.3.yml)
- **Thiết kế CSDL DDL**: [`docs/database_v3.1.2_mysql.sql`](docs/database_v3.1.2_mysql.sql)
