# Campus Event Hub (CEH Main Project)

Dự án hệ thống quản lý sự kiện trong trường học (Campus Event Hub).

## 🚀 Hướng dẫn khởi chạy môi trường Local (Quickstart)

### Yêu cầu tiên quyết
- **Docker Desktop** (Đang chạy)
- **Node.js** (Khuyên dùng v20+ hoặc v24) & **npm**

---

### Khởi động dự án bằng Docker

1. **Khởi chạy toàn bộ hệ thống** (Backend Laravel, Frontend Nginx, MySQL 8.4):
   ```bash
   docker-compose up -d
   ```
   *(Lần đầu tiên khởi chạy, container sẽ tự động cài đặt composer dependencies, khởi tạo `APP_KEY` và migrate database).*

2. **Cài đặt thư viện Frontend** (cho linter & phát triển):
   ```bash
   cd frontend
   npm ci
   ```

3. **Truy cập ứng dụng**:
   - **Frontend UI**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)
   - **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health) hoặc qua Frontend [http://localhost:5173/api/health](http://localhost:5173/api/health)
   - **MySQL Database**: `localhost:3307` (User: `ceh_user`, Password: `ceh_local_password`, Database: `ceh`)

---

### Các lệnh quản trị & kiểm thử thường dùng

- **Xem log hệ thống**:
  ```bash
  docker-compose logs -f app
  ```

- **Seed dữ liệu mẫu (Sample Events & Users)**:
  ```bash
  docker-compose exec -T app php artisan db:seed
  ```

- **Chạy Migration database**:
  ```bash
  docker-compose exec -T app php artisan migrate
  ```

- **Chạy Test Backend**:
  ```bash
  docker-compose exec -T app php artisan test
  ```

- **Chạy Lint Frontend**:
  ```bash
  cd frontend && npm run lint
  ```

- **Dừng các container**:
  ```bash
  docker-compose down
  ```

## DevOps CI Audit

This section verifies the GitHub Actions CI workflow.