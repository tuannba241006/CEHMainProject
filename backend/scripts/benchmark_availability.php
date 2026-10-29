<?php

/**
 * Script benchmark hiệu năng checkAvailability() với 1,000 bookings.
 * Cách chạy: php scripts/benchmark_availability.php --records=1000 --iterations=100
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Enums\BookingStatus;
use App\Enums\Campus;
use App\Enums\RoomStatus;
use App\Models\ChuyenDe;
use App\Models\DatPhong;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use App\Services\RoomScheduleService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

// Đọc arguments CLI
$options = getopt('', ['records::', 'iterations::']);
$numRecords = isset($options['records']) ? (int) $options['records'] : 1000;
$iterations = isset($options['iterations']) ? (int) $options['iterations'] : 100;

echo "========================================================\n";
echo " Campus Event Hub — PKG-01 Benchmark Availability Engine\n";
echo "========================================================\n";
echo "Config: Records = {$numRecords}, Iterations = {$iterations}\n";
echo "Preparing benchmark dataset...\n";

// Tạo đơn vị tổ chức và chuyên đề tạm
$donVi = DonViToChuc::firstOrCreate(
    ['ma_dinh_danh' => 'BENCHMARK_UNIT'],
    ['ten_don_vi' => 'Đơn vị Benchmark', 'loai_don_vi' => 'Khoa', 'hoat_dong' => 1]
);

$chuyenDe = ChuyenDe::firstOrCreate(
    ['ten_chuyen_de' => 'Chuyên đề Benchmark'],
    ['mo_ta' => 'Chuyên đề test hiệu năng']
);

$admin = User::firstOrCreate(
    ['email' => 'admin_bench@uit.edu.vn'],
    ['ho_ten' => 'Admin Bench', 'mat_khau' => bcrypt('Pass@123'), 'loai_tai_khoan' => 'Admin']
);

$room = PhongHoiTruong::create([
    'ten_phong' => 'Hội trường Benchmark ' . uniqid(),
    'co_so' => Campus::CoSo1->value,
    'suc_chua_toi_da' => 500,
    'trang_thiet_bi' => ['loa' => true],
    'trang_thai' => RoomStatus::KhaDung->value,
    'da_xoa' => 0,
]);

// Tạo 1 sự kiện chung cho 1,000 bookings để tối ưu tốc độ seed
$baseEventStart = Carbon::now()->addDays(1)->setTime(8, 0, 0);
$event = SuKien::create([
    'ma_don_vi_to_chuc' => $donVi->ma_don_vi_to_chuc,
    'ma_chuyen_de' => $chuyenDe->ma_chuyen_de,
    'ma_phong' => $room->ma_phong,
    'ten_su_kien' => 'Sự kiện Benchmark',
    'mo_ta' => 'Sự kiện dùng để benchmark dat_phong',
    'ngay_cong_bo' => Carbon::now(),
    'thoi_gian_bat_dau' => $baseEventStart,
    'thoi_gian_ket_thuc' => $baseEventStart->copy()->addMonths(6),
    'khong_gioi_han_slot' => 1,
    'trang_thai' => 'APPROVED',
]);

// Batch insert 1,000 DatPhong
$batchSize = 250;
$now = Carbon::now();
$recordsInserted = 0;

for ($i = 0; $i < $numRecords; $i += $batchSize) {
    $rows = [];
    $currentChunk = min($batchSize, $numRecords - $i);
    for ($j = 0; $j < $currentChunk; $j++) {
        $idx = $i + $j;
        // Rải rác booking cách nhau 3 giờ qua các ngày
        $bStart = $baseEventStart->copy()->addHours($idx * 3);
        $bEnd = $bStart->copy()->addHours(2);

        $rows[] = [
            'ma_phong' => $room->ma_phong,
            'ma_su_kien' => $event->ma_su_kien,
            'thoi_gian_bat_dau' => $bStart->format('Y-m-d H:i:s'),
            'thoi_gian_ket_thuc' => $bEnd->format('Y-m-d H:i:s'),
            'trang_thai' => BookingStatus::Confirmed->value,
            'han_giu_cho_tam' => null,
            'thoi_gian_tao' => $now->format('Y-m-d H:i:s'),
            'thoi_gian_cap_nhat' => $now->format('Y-m-d H:i:s'),
        ];
    }
    DB::table('dat_phong')->insert($rows);
    $recordsInserted += $currentChunk;
}

echo "Successfully seeded {$recordsInserted} bookings for room {$room->ma_phong}.\n";
echo "Running {$iterations} benchmark queries...\n";

$service = app(RoomScheduleService::class);
$times = [];

// Khung giờ kiểm tra (chọn ngẫu nhiên một khoảng để test)
$queryStart = $baseEventStart->copy()->addHours(150 * 3);
$queryEnd = $queryStart->copy()->addHours(2);

// Warmup 5 queries
for ($w = 0; $w < 5; $w++) {
    $service->checkAvailability($room->ma_phong, $queryStart, $queryEnd, null, $admin);
}

// Measured iterations
for ($it = 0; $it < $iterations; $it++) {
    $t0 = microtime(true);
    $service->checkAvailability($room->ma_phong, $queryStart, $queryEnd, null, $admin);
    $t1 = microtime(true);
    $times[] = ($t1 - $t0) * 1000.0; // milliseconds
}

// Tính toán các chỉ số thống kê
sort($times);
$count = count($times);
$p50 = $times[(int) ($count * 0.50)];
$p90 = $times[(int) ($count * 0.90)];
$p95 = $times[(int) ($count * 0.95)];
$p99 = $times[(int) ($count * 0.99)];
$avg = array_sum($times) / $count;
$min = $times[0];
$max = $times[$count - 1];

echo "\n--- BENCHMARK RESULTS ---\n";
printf("Min: %.2f ms\n", $min);
printf("Avg: %.2f ms\n", $avg);
printf("p50: %.2f ms\n", $p50);
printf("p90: %.2f ms\n", $p90);
printf("p95: %.2f ms\n", $p95);
printf("p99: %.2f ms\n", $max);
printf("Max: %.2f ms\n", $max);
echo "-------------------------\n";

// Dọn dẹp dữ liệu benchmark
echo "Cleaning up benchmark records...\n";
DB::table('dat_phong')->where('ma_phong', $room->ma_phong)->delete();
$event->delete();
$room->delete();
echo "Cleanup finished.\n";

if ($p95 < 50.0) {
    echo " RESULT: PASS (p95 = " . number_format($p95, 2) . " ms < 50 ms)\n";
    exit(0);
} else {
    echo " RESULT: FAIL (p95 = " . number_format($p95, 2) . " ms >= 50 ms)\n";
    exit(1);
}
