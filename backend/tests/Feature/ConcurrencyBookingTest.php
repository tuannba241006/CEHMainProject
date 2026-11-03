<?php

namespace Tests\Feature;

use App\Exceptions\BusinessException;
use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * CEH-P2-TST-02: Kịch bản Kiểm thử Tương tranh Độc lập: 50 Sinh viên Tranh chấp 1 Vé Cuối.
 *
 * Tuân thủ nghiêm ngặt Anti-Trivialization Principle & Test Integrity Harness:
 * - 50 tài khoản sinh viên hoàn toàn riêng biệt.
 * - 50 Process workers chạy song song tranh chấp tại cùng một thời điểm.
 * - Khóa dòng bi quan lockForUpdate() bảo vệ quỹ vé.
 */
class ConcurrencyBookingTest extends TestCase
{
    protected array $studentIds = [];

    protected int $eventId;

    protected int $roomId;

    protected int $chuyenDeId;

    protected int $clubId;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Chuẩn bị dữ liệu cơ sở
        $club = DonViToChuc::where('loai_don_vi', 'CLB')->first()
            ?? DonViToChuc::first();
        $this->clubId = $club->ma_don_vi_to_chuc;

        $room = PhongHoiTruong::where('trang_thai', 'KhaDung')->where('suc_chua_toi_da', '>=', 50)->first()
            ?? PhongHoiTruong::first();
        $this->roomId = $room->ma_phong;

        $chuyenDe = ChuyenDe::first() ?? ChuyenDe::create([
            'ten_chuyen_de' => 'Chuyên đề Concurrency 50U',
            'mo_ta' => 'Chuyên đề phục vụ kiểm thử chịu tải tương tranh',
            'da_xoa' => 0,
        ]);
        $this->chuyenDeId = $chuyenDe->ma_chuyen_de;

        // 2. Tạo 1 sự kiện giới hạn slot với DUY NHẤT 1 vé còn lại (so_ve_con_lai = 1)
        $event = SuKien::create([
            'ma_don_vi_to_chuc' => $this->clubId,
            'ma_chuyen_de' => $this->chuyenDeId,
            'ma_phong' => $this->roomId,
            'ten_su_kien' => 'Sự kiện Tranh chấp 1 Vé Cuối (50 Sinh viên)',
            'mo_ta' => 'Kiểm thử Concurrency 50 Users tranh chấp 1 vé duy nhất',
            'ngay_cong_bo' => Carbon::now()->subDays(1),
            'thoi_gian_bat_dau' => Carbon::now()->addDays(5)->setTime(14, 0, 0),
            'thoi_gian_ket_thuc' => Carbon::now()->addDays(5)->setTime(17, 0, 0),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 100,
            'so_ve_con_lai' => 1, // CHỈ DUY NHẤT 1 VÉ CÒN LẠI
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'gio_tinh_nguyen' => 0.0,
            'trang_thai' => 'PUBLISHED',
        ]);
        $this->eventId = $event->ma_su_kien;

        // 3. Khởi tạo 50 tài khoản sinh viên hoàn toàn riêng biệt (User IDs độc lập)
        $this->studentIds = [];
        for ($i = 1; $i <= 50; $i++) {
            $mssv = sprintf('2352%04d', $i + 100);
            $email = sprintf('student_cc_%03d@gm.uit.edu.vn', $i);

            $user = User::updateOrCreate(
                ['mssv' => $mssv],
                [
                    'email' => $email,
                    'ho_ten' => sprintf('Sinh Viên Concurrency %02d', $i),
                    'lop_sinh_hoat' => 'KTPM2023',
                    'khoa' => 'Kỹ thuật Phần mềm',
                    'mat_khau' => Hash::make('Password@123'),
                    'loai_tai_khoan' => 'SinhVien',
                    'dong_y_nghi_dinh_13' => 1,
                    'hoat_dong' => 1,
                    'buoc_doi_mat_khau' => 0,
                ]
            );
            $this->studentIds[] = $user->ma_tai_khoan;
        }
    }

    protected function tearDown(): void
    {
        // Dọn dẹp dữ liệu kiểm thử
        if (! empty($this->studentIds) && ! empty($this->eventId)) {
            DangKy::where('ma_su_kien', $this->eventId)->delete();
            SuKien::where('ma_su_kien', $this->eventId)->delete();
            User::whereIn('ma_tai_khoan', $this->studentIds)->delete();
        }

        parent::tearDown();
    }

    public function test_50_students_competing_for_1_final_ticket_concurrency(): void
    {
        $this->assertCount(50, $this->studentIds);
        $eventId = $this->eventId;

        $resultsDir = sys_get_temp_dir().'/ceh_concurrency_'.uniqid();
        if (! is_dir($resultsDir)) {
            mkdir($resultsDir, 0777, true);
        }

        // Tạo pipe điều phối để đồng bộ thời điểm xuất phát của 50 tiến trình (Barrier)
        $barrierPipe = $resultsDir.'/barrier.fifo';
        if (! file_exists($barrierPipe)) {
            posix_mkfifo($barrierPipe, 0666);
        }

        // Ngắt kết nối DB ở tiến trình cha trước khi rẽ nhánh (fork)
        DB::disconnect();

        $children = [];

        foreach ($this->studentIds as $index => $userId) {
            $pid = pcntl_fork();

            if ($pid === -1) {
                $this->fail("Không thể rẽ nhánh tiến trình (fork failed) tại worker {$index}");
            } elseif ($pid === 0) {
                // TIẾN TRÌNH CON (WORKER): Đại diện cho 1 sinh viên độc lập
                // 1. Chờ tín hiệu từ tiến trình cha qua barrier để xuất phát đồng thời
                $fifo = fopen($barrierPipe, 'r');
                if ($fifo) {
                    fread($fifo, 1);
                    fclose($fifo);
                }

                $workerResult = [
                    'worker_index' => $index + 1,
                    'user_id' => $userId,
                    'status_code' => 500,
                    'error_code' => null,
                    'ticket_uuid' => null,
                ];

                try {
                    // Purge and reconnect DB riêng cho worker này
                    DB::purge();
                    DB::reconnect();

                    /** @var BookingService $service */
                    $service = app(BookingService::class);
                    $ticket = $service->bookTicket($userId, $eventId);

                    $workerResult['status_code'] = 201;
                    $workerResult['ticket_uuid'] = $ticket->ma_ve_uuid;
                } catch (BusinessException $e) {
                    $workerResult['status_code'] = $e->getStatusCode();
                    $workerResult['error_code'] = $e->getErrorCode();
                } catch (\Throwable $t) {
                    $workerResult['status_code'] = 500;
                    $workerResult['error_code'] = $t->getMessage();
                }

                // Ghi kết quả của worker ra file tạm
                $outFile = sprintf('%s/result_%d.json', $resultsDir, $userId);
                file_put_contents($outFile, json_encode($workerResult));

                exit(0);
            } else {
                $children[] = $pid;
            }
        }

        // TIẾN TRÌNH CHA: Mở barrier phát lệnh bắn đồng loạt cho 50 workers
        usleep(100000); // 100ms chờ tất cả 50 tiến trình con sẵn sàng ở cổng barrier
        $fifoWrite = fopen($barrierPipe, 'w');
        fwrite($fifoWrite, str_repeat('X', 50));
        fclose($fifoWrite);

        // Chờ tất cả 50 workers hoàn tất
        foreach ($children as $pid) {
            pcntl_waitpid($pid, $status);
        }

        // Đọc kết quả từ 50 workers
        $results = [];
        $successCount = 0;
        $conflictCount = 0;
        $otherCount = 0;
        $winnerUserId = null;
        $winnerTicketUuid = null;

        foreach ($this->studentIds as $userId) {
            $outFile = sprintf('%s/result_%d.json', $resultsDir, $userId);
            if (file_exists($outFile)) {
                $data = json_decode(file_get_contents($outFile), true);
                $results[] = $data;

                if ($data['status_code'] === 201) {
                    $successCount++;
                    $winnerUserId = $data['user_id'];
                    $winnerTicketUuid = $data['ticket_uuid'];
                } elseif ($data['status_code'] === 409 && $data['error_code'] === 'SLOT_SOLD_OUT') {
                    $conflictCount++;
                } else {
                    $otherCount++;
                }

                @unlink($outFile);
            }
        }

        @unlink($barrierPipe);
        @rmdir($resultsDir);

        // Purge and reconnect DB ở tiến trình cha để kiểm tra cơ sở dữ liệu
        DB::purge();
        DB::reconnect();

        $event = SuKien::find($eventId);
        $totalTicketsInDb = DangKy::where('ma_su_kien', $eventId)->count();

        // ═══════════════════════════════════════════════════════════════════════════
        // LOG TERMINAL BẰNG CHỨNG THỰC THI THỰC TẾ (EMPIRICAL EVIDENCE - HARNESS LAYER 2)
        // ═══════════════════════════════════════════════════════════════════════════
        echo "\n".str_repeat('=', 80)."\n";
        echo " [EMPIRICAL EVIDENCE] CEH-P2-TST-02: 50 USERS CONCURRENCY BOOKING TEST\n";
        echo str_repeat('=', 80)."\n";
        echo sprintf(" Event ID: %d | Starting Available Slots: 1\n", $eventId);
        echo sprintf(" Number of Distinct Competing Students: %d\n", count($this->studentIds));
        echo str_repeat('-', 80)."\n";
        echo " SAMPLE WORKER EXECUTION TRACE (First 10 + Winner):\n";

        foreach (array_slice($results, 0, 10) as $res) {
            echo sprintf(
                "  - Worker User ID: %-5d | HTTP Status: %d | Code: %s\n",
                $res['user_id'],
                $res['status_code'],
                $res['error_code'] ?? 'SUCCESS (Ticket Issued)'
            );
        }

        echo sprintf(
            "  ... [and %d other concurrent workers]\n",
            count($results) - 10
        );

        echo str_repeat('-', 80)."\n";
        echo " CONCURRENCY ARBITRATION SUMMARY:\n";
        echo sprintf("  ✔ Success Requests (HTTP 201 Created):     %d\n", $successCount);
        echo sprintf("  ✔ Conflict Requests (HTTP 409 Sold Out):    %d\n", $conflictCount);
        echo sprintf("  ✔ Unexpected Errors:                        %d\n", $otherCount);
        echo sprintf("  ✔ Winner Student User ID:                   %s\n", $winnerUserId ?? 'NONE');
        echo sprintf("  ✔ Winning Ticket UUID:                      %s\n", $winnerTicketUuid ?? 'NONE');
        echo sprintf("  ✔ Database Final Remaining Tickets:         %d\n", $event->so_ve_con_lai);
        echo sprintf("  ✔ Database Actual Issued Tickets Count:     %d\n", $totalTicketsInDb);
        echo str_repeat('=', 80)."\n\n";

        // ═══════════════════════════════════════════════════════════════════════════
        // ASSERTIONS NGHIỆM THU NGHIÊM NGẶT
        // ═══════════════════════════════════════════════════════════════════════════
        $this->assertEquals(50, count($results), 'Phải đủ 50 phản hồi từ 50 sinh viên');
        $this->assertEquals(1, $successCount, 'CHÍNH XÁC 1 sinh viên giành được vé thành công (HTTP 201)');
        $this->assertEquals(49, $conflictCount, 'CHÍNH XÁC 49 sinh viên còn lại nhận HTTP 409 SLOT_SOLD_OUT');
        $this->assertEquals(0, $otherCount, 'Không được phát sinh lỗi bất thường 500');

        $this->assertNotNull($winnerUserId, 'Phải có người chiến thắng nhận được vé');
        $this->assertNotNull($winnerTicketUuid, 'Vé phát hành phải có mã UUID');

        // Bất biến CSDL: Tuyệt đối không xảy ra Overbooking (không âm vé)
        $this->assertEquals(0, $event->so_ve_con_lai, 'Quỹ vé còn lại của sự kiện phải về đúng 0');
        $this->assertNotNull($event->thoi_diem_het_ve, 'Sự kiện phải ghi nhận thoi_diem_het_ve');
        $this->assertEquals(1, $totalTicketsInDb, 'Bảng dang_ky trong CSDL chỉ có duy nhất 1 bản ghi mới');
    }
}
