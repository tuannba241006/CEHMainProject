# Phase 2 Core Verification Runbook

## Mục đích

Runbook này hướng dẫn chạy bộ kiểm chứng Core Phase 2 gồm Feature tests của Laravel và Postman collection. Collection cùng environment có tại `docs/postman/`.

## Điều kiện

- Docker Compose và Docker đang hoạt động.
- Đã cấu hình `backend/.env` theo môi trường local.
- Container ứng dụng đã cài dependencies (`backend/vendor`).
- Có Postman hoặc Newman để chạy collection.

## Khởi động môi trường

Từ thư mục gốc repository:

```bash
docker compose up -d --build
```

Kiểm tra trạng thái:

```bash
docker compose ps
```

## Chạy bộ Feature tests

```bash
docker compose exec -T app php artisan test --testsuite=Feature
```

Kết quả nghiệm thu yêu cầu tất cả test pass và không có test bị skip. Có thể chạy riêng kiểm thử đặt vé đồng thời:

```bash
docker compose exec -T app php artisan test tests/Feature/ConcurrencyBookingTest.php
```

## Chạy Postman collection

Import hai file sau vào Postman:

- Collection: `docs/postman/CampusEventHub_Phase2_Collection.json`
- Environment: `docs/postman/CampusEventHub_Phase2_Environment.json`

Chọn environment `Local Laravel Dev (Port 8000)`. Giá trị `baseUrl` mặc định là `http://localhost:8000/api/v1`; cập nhật nếu cổng hoặc hostname khác. Đăng nhập bằng tài khoản seed/admin của môi trường local trước khi chạy các request cần quyền Admin. Collection giữ cookie session và có test script kiểm tra mã HTTP, API envelope JSON hoặc content type file tải xuống.

Chạy toàn bộ collection bằng Collection Runner. Các request ghi dữ liệu nên được chạy trên cơ sở dữ liệu local/dev đã seed, không chạy trên production.

Có thể dùng Newman:

```bash
newman run docs/postman/CampusEventHub_Phase2_Collection.json \
  -e docs/postman/CampusEventHub_Phase2_Environment.json
```

## Kiểm tra style và benchmark

```bash
docker compose exec -T app vendor/bin/pint --test
docker compose exec -T app php scripts/benchmark_availability.php
docker compose exec -T app php scripts/benchmark_discovery.php
```

Benchmark tạo dữ liệu tạm trong database cấu hình của ứng dụng. Chỉ chạy ở môi trường development/test.
