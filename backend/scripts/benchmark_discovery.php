<?php

/**
 * Script benchmark hiệu năng PKG-04 Discovery Engine (EventSearchService & SmartActionService).
 * Kiểm chứng NFR-PERF-03: Tìm kiếm Fulltext < 150ms, Tải chi tiết < 1.5s.
 * Cách chạy: php scripts/benchmark_discovery.php --iterations=100
 */

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\ChuyenDe;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use App\Services\EventSearchService;
use App\Services\EventSmartActionService;
use Illuminate\Contracts\Console\Kernel;

$options = getopt('', ['iterations::']);
$iterations = isset($options['iterations']) ? (int) $options['iterations'] : 100;

echo "========================================================\n";
echo " Campus Event Hub — PKG-04 Benchmark Discovery Engine\n";
echo "========================================================\n";
echo "Config: Iterations = {$iterations}\n";
echo "Preparing benchmark dataset...\n";

// Seed temporary test events if none exist
$host = DonViToChuc::firstOrCreate(
    ['ma_dinh_danh' => 'BENCH_PKG04_HOST'],
    ['ten_don_vi' => 'Benchmark Host PKG-04', 'loai_don_vi' => 'CLB', 'hoat_dong' => 1]
);

$topic = ChuyenDe::firstOrCreate(
    ['ten_chuyen_de' => 'Benchmark Topic PKG-04'],
    ['mo_ta' => 'Chuyên đề benchmark', 'da_xoa' => 0]
);

$room = PhongHoiTruong::firstOrCreate(
    ['ten_phong' => 'Benchmark Hall PKG-04'],
    ['co_so' => 'CoSo1', 'suc_chua_toi_da' => 200, 'trang_thai' => 'KhaDung']
);

$student = User::firstOrCreate(
    ['mssv' => '22990099'],
    [
        'email' => 'bench_student@gm.uit.edu.vn',
        'ho_ten' => 'Benchmark Student',
        'mat_khau' => bcrypt('Pass@12345'),
        'khoa' => 'Khoa He thong Thong tin',
        'loai_tai_khoan' => 'SinhVien',
        'dong_y_nghi_dinh_13' => 1,
        'hoat_dong' => 1,
        'buoc_doi_mat_khau' => 0,
    ]
);

$existingCount = SuKien::where('trang_thai', 'PUBLISHED')->count();
if ($existingCount < 10) {
    echo "Seeding additional published events for realistic query load...\n";
    for ($i = 1; $i <= 20; $i++) {
        $isFree = ($i % 2 === 0);
        SuKien::create([
            'ma_don_vi_to_chuc' => $host->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $topic->ma_chuyen_de,
            'ma_phong' => $room->ma_phong,
            'ten_su_kien' => "Hội thảo Công nghệ và Cloud Native số {$i}",
            'mo_ta' => "Khám phá các kỹ thuật vi dịch vụ hiện đại và triển khai container trên nền tảng đám mây {$i}",
            'dien_gia' => "Chuyên gia Kỹ thuật số {$i}",
            'ngay_cong_bo' => now()->subDays(2),
            'thoi_gian_bat_dau' => now()->addDays(3 + $i),
            'thoi_gian_ket_thuc' => now()->addDays(3 + $i)->addHours(2),
            'khong_gioi_han_slot' => $isFree,
            'so_luong_toi_da' => $isFree ? null : 100,
            'so_ve_con_lai' => $isFree ? null : 50,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'gio_tinh_nguyen' => 0,
            'trang_thai' => 'PUBLISHED',
        ]);
    }
}

$sampleEvent = SuKien::where('trang_thai', 'PUBLISHED')->first();
$searchService = app(EventSearchService::class);
$smartActionService = app(EventSmartActionService::class);

echo "Dataset ready. Executing {$iterations} benchmark iterations...\n";

// Warm up
$searchService->search(['q' => 'Cloud']);
$smartActionService->forEvent($sampleEvent, $student);

$searchTimes = [];
$multiFilterTimes = [];
$smartActionTimes = [];

for ($i = 0; $i < $iterations; $i++) {
    // 1. Full-text search
    $t0 = microtime(true);
    $searchService->search(['q' => 'Cloud Native']);
    $searchTimes[] = (microtime(true) - $t0) * 1000;

    // 2. Multi-criteria filter
    $t1 = microtime(true);
    $searchService->search([
        'con_cho' => true,
        'dieu_khoan_drl' => 'Dieu3',
        'sort' => 'bat_dau_asc',
    ]);
    $multiFilterTimes[] = (microtime(true) - $t1) * 1000;

    // 3. Smart Action resolution
    $t2 = microtime(true);
    $smartActionService->forEvent($sampleEvent, $student);
    $smartActionTimes[] = (microtime(true) - $t2) * 1000;
}

function calcMetrics(array $times): array
{
    sort($times);
    $count = count($times);

    return [
        'min' => round($times[0], 2),
        'avg' => round(array_sum($times) / $count, 2),
        'p50' => round($times[(int) ($count * 0.50)], 2),
        'p90' => round($times[(int) ($count * 0.90)], 2),
        'p95' => round($times[(int) ($count * 0.95)], 2),
        'p99' => round($times[(int) ($count * 0.99)], 2),
        'max' => round($times[$count - 1], 2),
    ];
}

$m1 = calcMetrics($searchTimes);
$m2 = calcMetrics($multiFilterTimes);
$m3 = calcMetrics($smartActionTimes);

echo "\n--------------------------------------------------------\n";
echo " RESULTS SUMMARY (Target: Search < 150ms, Detail < 1500ms)\n";
echo "--------------------------------------------------------\n";
printf("1. Fulltext Search ('Cloud Native'):\n");
printf("   Min: %.2fms | Avg: %.2fms | p50: %.2fms | p90: %.2fms | p95: %.2fms | p99: %.2fms | Max: %.2fms\n",
    $m1['min'], $m1['avg'], $m1['p50'], $m1['p90'], $m1['p95'], $m1['p99'], $m1['max']);
printf("   Status: %s (SLA <= 150ms)\n\n", $m1['p95'] <= 150 ? 'PASS' : 'FAIL');

printf("2. Multi-criteria Filter (con_cho=true, dieu3, sort):\n");
printf("   Min: %.2fms | Avg: %.2fms | p50: %.2fms | p90: %.2fms | p95: %.2fms | p99: %.2fms | Max: %.2fms\n",
    $m2['min'], $m2['avg'], $m2['p50'], $m2['p90'], $m2['p95'], $m2['p99'], $m2['max']);
printf("   Status: %s (SLA <= 150ms)\n\n", $m2['p95'] <= 150 ? 'PASS' : 'FAIL');

printf("3. Smart Action Resolution:\n");
printf("   Min: %.2fms | Avg: %.2fms | p50: %.2fms | p90: %.2fms | p95: %.2fms | p99: %.2fms | Max: %.2fms\n",
    $m3['min'], $m3['avg'], $m3['p50'], $m3['p90'], $m3['p95'], $m3['p99'], $m3['max']);
printf("   Status: %s (SLA <= 50ms)\n", $m3['p95'] <= 50 ? 'PASS' : 'FAIL');
echo "========================================================\n";
