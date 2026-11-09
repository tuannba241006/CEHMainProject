<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\PhienKiosk;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use App\Services\AttendanceOverrideService;
use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SelfAttendanceAndOverrideTest extends TestCase
{
    use DatabaseTransactions {
        beginDatabaseTransaction as private beginFixtureTransaction;
    }

    private const CHECK_IN = '/api/v1/attendance/self-check-in';

    private const CHECK_OUT = '/api/v1/attendance/self-check-out';

    private const OVERRIDE = '/api/v1/attendance/manual-override';

    private const DEVICE = 'pkg09-device-a';

    private const SECRET = '12345678901234567890';

    private User $student;

    private User $host;

    private SuKien $event;

    private DangKy $ticket;

    private PhienKiosk $kiosk;

    private array $fixtureUserIds = [];

    private array $fixtureUnitIds = [];

    private ?PhongHoiTruong $room = null;

    private ?ChuyenDe $topic = null;

    private bool $commitFixtures;

    public function beginDatabaseTransaction(): void
    {
        $this->assertTrue($this->app->environment('testing'));
        $this->assertMatchesRegularExpression('/^ceh_test(?:_[a-z0-9_]+)?$/D', DB::getDatabaseName());
        $this->assertSame(DB::getDatabaseName(), DB::selectOne('SELECT DATABASE() AS name')->name);

        $this->commitFixtures = in_array($this->name(), [
            'test_concurrent_students_cannot_claim_the_same_device',
            'test_manual_override_rolls_back_ticket_when_audit_insert_fails',
            'test_concurrent_manual_override_creates_one_audit_log',
        ], true);
        if (! $this->commitFixtures) {
            $this->beginFixtureTransaction();
        }
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-10-25 10:00:00+07:00')->utc());
        $unit = $this->unit();
        $this->host = $this->user('ToChuc', $unit);
        $this->student = $this->user();
        $this->room = PhongHoiTruong::create(['ten_phong' => 'PKG-09 '.Str::random(8), 'suc_chua_toi_da' => 100, 'co_so' => 'CoSo1', 'trang_thai' => 'KhaDung']);
        $this->topic = ChuyenDe::create(['ten_chuyen_de' => 'PKG-09 '.Str::random(8), 'mo_ta' => 'Kiểm thử điểm danh']);
        $this->event = SuKien::create([
            'ma_don_vi_to_chuc' => $unit->getKey(),
            'ma_phong' => $this->room->getKey(),
            'ma_chuyen_de' => $this->topic->getKey(),
            'ten_su_kien' => 'Kiểm thử PKG-09',
            'mo_ta' => 'Điểm danh TOTP và cứu xét',
            'ngay_cong_bo' => now()->subDay(),
            'thoi_gian_bat_dau' => now(),
            'thoi_gian_ket_thuc' => now()->addMinutes(120),
            'so_luong_toi_da' => 100,
            'so_ve_con_lai' => 99,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'trang_thai' => 'PUBLISHED',
            'cong_check_in_mo' => true,
            'cong_check_out_mo' => true,
        ]);
        $this->ticket = $this->ticketFor($this->student);
        $this->kiosk = PhienKiosk::create([
            'ma_su_kien' => $this->event->getKey(),
            'nguoi_kich_hoat' => $this->host->getKey(),
            'kiosk_token_hash' => hash('sha256', Str::random()),
            'totp_secret' => 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
            'thoi_gian_bat_dau' => now()->subMinutes(30),
            'thoi_gian_het_han' => now()->addMinutes(135),
        ]);
    }

    protected function tearDown(): void
    {
        try {
            if ($this->commitFixtures ?? false) {
                DB::transaction(function (): void {
                    if (isset($this->event)) {
                        $tickets = DangKy::where('ma_su_kien', $this->event->getKey());
                        DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', (clone $tickets)->select('ma_dang_ky'))->delete();
                        $tickets->delete();
                        PhienKiosk::where('ma_su_kien', $this->event->getKey())->delete();
                        $this->event->delete();
                    }
                    DB::table('sessions')->whereIn('user_id', $this->fixtureUserIds)->delete();
                    User::whereKey($this->fixtureUserIds)->delete();
                    DonViToChuc::whereKey($this->fixtureUnitIds)->delete();
                    $this->room?->delete();
                    $this->topic?->delete();
                });
            }
        } finally {
            parent::tearDown();
        }
    }

    /** @test Target: UC-OPS-03 normal course. Current TOTP and header bind the active ticket. */
    public function test_student_can_self_check_in_with_valid_totp_and_device_id(): void
    {
        $this->ticketFor($this->student, ['trang_thai' => 'DaHuy', 'thoi_gian_huy' => now()->subDay()]);
        $this->ticket->update(['vi_pham_no_show' => true]);

        $this->scan($this->student, self::CHECK_IN)->assertOk()->assertExactJson([
            'success' => true,
            'message' => 'Điểm danh Check-in đầu giờ thành công',
            'data' => [
                'ma_dang_ky' => $this->ticket->getKey(),
                'trang_thai' => 'DaCheckIn',
                'thoi_gian_check_in' => '2026-10-25T10:00:00+07:00',
            ],
            'server_time' => '2026-10-25T10:00:00+07:00',
        ]);
        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaCheckIn',
            'da_check_in' => true,
            'ma_thiet_bi_check_in' => self::DEVICE,
            'nghi_van_gian_lan' => false,
            'vi_pham_no_show' => false,
        ]);
    }

    /** @test Target: UC-OPS-03 EX.4. TOTP older than 60 seconds returns 400 TOTP_INVALID. */
    public function test_self_check_in_blocks_expired_totp_over_60_seconds(): void
    {
        $code = $this->totp();
        $this->travel(61)->seconds();

        $this->scan($this->student, self::CHECK_IN, code: $code)->assertBadRequest()->assertJsonPath('error', 'TOTP_INVALID');
        $this->assertTicket($this->ticket, ['trang_thai' => 'DaDangKy', 'ma_thiet_bi_check_in' => null]);
    }

    /** @test Target: UC-OPS-03 step 4. Accept the immediately previous step for network delay. */
    public function test_self_check_in_accepts_previous_totp_window(): void
    {
        $this->scan($this->student, self::CHECK_IN, code: $this->totp(-1))->assertOk();
    }

    /** @test Target: UC-OPS-03 step 4 and EX.4. Reject future codes, malformed codes and inactive sessions. */
    #[DataProvider('invalidKioskCodes')]
    public function test_self_attendance_rejects_invalid_kiosk_codes(string $scenario, int $status, string $error): void
    {
        $code = match ($scenario) {
            'future' => $this->totp(1),
            'format' => '12abc6',
            'invalid' => '000000',
            default => $this->totp(),
        };
        if ($scenario === 'revoked') {
            $this->kiosk->update(['da_thu_hoi' => true, 'thoi_gian_thu_hoi' => now()]);
        }
        if ($scenario === 'expired') {
            $this->kiosk->update(['thoi_gian_het_han' => now()]);
        }

        $this->scan($this->student, self::CHECK_IN, code: $code)->assertStatus($status)->assertJsonPath('error', $error);
        $this->assertTicket($this->ticket, ['trang_thai' => 'DaDangKy', 'da_check_in' => false]);
    }

    public static function invalidKioskCodes(): array
    {
        return [
            'next window' => ['future', 400, 'TOTP_INVALID'],
            'wrong six digits' => ['invalid', 400, 'TOTP_INVALID'],
            'malformed code' => ['format', 422, 'VALIDATION_FAILED'],
            'revoked kiosk' => ['revoked', 400, 'TOTP_INVALID'],
            'expired kiosk at exact boundary' => ['expired', 400, 'TOTP_INVALID'],
        ];
    }

    /** @test Target: UC-OPS-03 EX.1. Reject a reused device and commit evidence on both tickets. */
    public function test_self_check_in_detects_duplicate_device_and_returns_403_device_already_used(): void
    {
        $other = $this->user();
        $secondTicket = $this->ticketFor($other, ['vi_pham_no_show' => true]);
        $this->scan($this->student, self::CHECK_IN)->assertOk();
        $this->scan($other, self::CHECK_IN)->assertForbidden()
            ->assertJsonPath('error', 'DEVICE_ALREADY_USED')
            ->assertJsonPath('message', 'Thiết bị này đã được dùng để điểm danh cho tài khoản khác. Vui lòng gặp nhân viên soát vé để được đối soát thẻ sinh viên.');

        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaCheckIn', 'da_check_in' => true, 'ma_thiet_bi_check_in' => self::DEVICE,
            'nghi_van_gian_lan' => true, 'ma_thiet_bi_nghi_van' => self::DEVICE,
        ]);
        $this->assertTicket($secondTicket, [
            'trang_thai' => 'DaDangKy', 'da_check_in' => false, 'ma_thiet_bi_check_in' => null,
            'nghi_van_gian_lan' => true, 'ma_thiet_bi_nghi_van' => self::DEVICE, 'vi_pham_no_show' => false,
        ]);

        $this->scan($other, self::CHECK_IN, 'unused-device')->assertOk();
        $this->assertTicket($secondTicket, ['nghi_van_gian_lan' => true, 'ma_thiet_bi_nghi_van' => self::DEVICE]);
    }

    /** @test Target: UC-OPS-03 EX.1. Reject a different device when the ticket has a Check-in binding. */
    public function test_self_check_out_rejects_wrong_device_without_writing_attendance(): void
    {
        $this->scan($this->student, self::CHECK_IN)->assertOk();
        $this->scan($this->student, self::CHECK_OUT, 'changed-device')->assertForbidden()->assertJsonPath('error', 'DEVICE_ALREADY_USED');
        $this->scan($this->student, self::CHECK_OUT, 'second-changed-device')->assertForbidden()->assertJsonPath('error', 'DEVICE_ALREADY_USED');

        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaCheckIn', 'da_check_out' => false, 'thoi_gian_check_out' => null, 'ti_le_drl' => 0,
            'ma_thiet_bi_check_out' => null, 'ma_thiet_bi_check_in' => self::DEVICE,
            'nghi_van_gian_lan' => true, 'ma_thiet_bi_nghi_van' => 'changed-device',
        ]);
    }

    /** @test Target: UC-OPS-03 EX.1. Check-out-only devices are reserved for the original account. */
    public function test_cross_account_reuse_checks_both_device_columns(): void
    {
        $other = $this->user();
        $secondTicket = $this->ticketFor($other, [
            'trang_thai' => 'DaCheckIn', 'da_check_in' => true, 'thoi_gian_check_in' => now(),
        ]);
        $this->checkInAt(now(), null);
        $this->scan($this->student, self::CHECK_OUT)->assertOk();

        $this->scan($other, self::CHECK_OUT)->assertForbidden()->assertJsonPath('error', 'DEVICE_ALREADY_USED');
        $this->assertTicket($secondTicket, [
            'trang_thai' => 'DaCheckIn', 'da_check_out' => false, 'ma_thiet_bi_check_out' => null,
            'nghi_van_gian_lan' => true, 'ma_thiet_bi_nghi_van' => self::DEVICE, 'ti_le_drl' => 0,
        ]);
        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaCheckOut', 'ma_thiet_bi_check_in' => null, 'ma_thiet_bi_check_out' => self::DEVICE,
            'nghi_van_gian_lan' => true, 'ma_thiet_bi_nghi_van' => self::DEVICE,
        ]);
        $third = $this->user();
        $this->ticketFor($third);
        $this->scan($third, self::CHECK_IN)->assertForbidden()->assertJsonPath('error', 'DEVICE_ALREADY_USED');
    }

    /** @test Target: UC-OPS-02/03. An HMAC Staff Check-in without a device permits a fresh Check-out device. */
    public function test_staff_check_in_allows_self_check_out_with_an_unclaimed_device(): void
    {
        $ticket = $this->ticket;
        $this->actingAs($this->host)->postJson('/api/v1/attendance/staff-scan', [
            'ma_su_kien' => $this->event->getKey(),
            'che_do_quet' => 'CHECK_IN',
            'chuoi_qr_ve' => "CEH1.{$ticket->ma_ve_uuid}.{$ticket->ma_tai_khoan}.{$ticket->ma_su_kien}.{$ticket->chu_ky_hmac}",
        ])->assertOk();
        $this->assertTicket($ticket, ['trang_thai' => 'DaCheckIn', 'ma_thiet_bi_check_in' => null]);

        $this->travel(108)->minutes();
        $this->scan($this->student, self::CHECK_OUT)->assertOk()->assertJsonPath('data.thoi_luong_tham_du_phut', 108);
        $this->assertTicket($ticket, ['trang_thai' => 'DaCheckOut', 'ma_thiet_bi_check_out' => self::DEVICE]);
    }

    /** @test Target: UC-OPS-03 normal course and EX.2. Verify second-level boundaries and exact response fields. */
    #[DataProvider('attendanceThresholds')]
    public function test_student_can_self_check_out_and_calculates_correct_delta_t_thresholds(int $seconds, float $rate, int $minutes): void
    {
        $this->event->update(['thoi_gian_ket_thuc_thuc_te' => now()->addMinutes(100)]);
        $this->checkInAt(now()->subMinutes(10));
        $this->travel($seconds)->seconds();

        $response = $this->scan($this->student, self::CHECK_OUT)->assertOk()->assertExactJson([
            'success' => true,
            'message' => 'Điểm danh Check-out thành công',
            'data' => [
                'ma_dang_ky' => $this->ticket->getKey(),
                'trang_thai' => 'DaCheckOut',
                'thoi_gian_check_out' => now()->setTimezone('+07:00')->toIso8601String(),
                'thoi_luong_tham_du_phut' => $minutes,
                'ty_le_tham_du_pct' => min($seconds, 6000) / 60,
                'ti_le_drl' => $rate,
            ],
            'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
        ]);
        $this->assertIsInt($response->json('data.thoi_luong_tham_du_phut'));
        $this->assertContains(gettype($response->json('data.ty_le_tham_du_pct')), ['integer', 'double']);
        $this->assertContains(gettype($response->json('data.ti_le_drl')), ['integer', 'double']);
        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaCheckOut', 'da_check_out' => true,
            'ma_thiet_bi_check_out' => self::DEVICE, 'ti_le_drl' => $rate,
            'tham_gia_tron_ven' => $rate === 1.0, 'tham_gia_mot_phan' => $rate === 0.5,
        ]);
    }

    public static function attendanceThresholds(): array
    {
        return [
            'below 30%' => [1799, 0.0, 29],
            'exactly 30%' => [1800, 0.5, 30],
            'below 60%' => [3599, 0.5, 59],
            'exactly 60%' => [3600, 1.0, 60],
            'after effective event end' => [6300, 1.0, 100],
        ];
    }

    /** @test Target: UC-OPS-03 normal course. A different account cannot claim a ticket it does not own. */
    public function test_self_attendance_requires_a_ticket_owned_by_the_student(): void
    {
        $other = $this->user();
        foreach ([self::CHECK_IN, self::CHECK_OUT] as $path) {
            $this->scan($other, $path)->assertNotFound()->assertJsonPath('error', 'NOT_FOUND');
        }
        $this->assertTicket($this->ticket, ['trang_thai' => 'DaDangKy']);
    }

    /** @test Target: UC-OPS-03 EX.3. Reject checkout before check-in and reject replay of both scans. */
    public function test_self_attendance_rejects_invalid_transitions_and_replays(): void
    {
        $this->scan($this->student, self::CHECK_OUT)->assertConflict()->assertJsonPath('error', 'NOT_CHECKED_IN');
        $this->scan($this->student, self::CHECK_IN)->assertOk();
        $this->scan($this->student, self::CHECK_IN)->assertConflict()->assertJsonPath('error', 'ALREADY_CHECKED_IN');
        $this->scan($this->student, self::CHECK_OUT)->assertOk();
        $this->travel(5)->minutes();
        $this->scan($this->student, self::CHECK_OUT, 'retry-device')->assertConflict()->assertJsonPath('error', 'TICKET_ALREADY_USED');
        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaCheckOut', 'thoi_gian_check_out' => now()->subMinutes(5)->toDateTimeString(),
            'ma_thiet_bi_check_out' => self::DEVICE, 'nghi_van_gian_lan' => false,
        ]);
    }

    /** @test Target: UC-OPS-03 EX.4. Both closed gates and ineligible event state return GATE_CLOSED. */
    public function test_self_attendance_checks_the_gate_and_event_state(): void
    {
        $this->event->update(['cong_check_in_mo' => false, 'cong_check_out_mo' => false]);
        $this->scan($this->student, self::CHECK_IN)->assertConflict()->assertJsonPath('error', 'GATE_CLOSED');
        $this->checkInAt(now());
        $this->scan($this->student, self::CHECK_OUT)->assertConflict()->assertJsonPath('error', 'GATE_CLOSED');
        $this->event->update(['trang_thai' => 'COMPLETED', 'cong_check_out_mo' => true]);
        $this->scan($this->student, self::CHECK_OUT)->assertConflict()->assertJsonPath('error', 'GATE_CLOSED');
    }

    /** @test Target: UC-OPS-03 and OpenAPI SinhVien scope. Reject anonymous and non-student requests. */
    public function test_self_attendance_requires_student_authentication(): void
    {
        foreach ([self::CHECK_IN, self::CHECK_OUT] as $path) {
            $this->postJson($path, $this->scanPayload(), ['X-Device-Id' => self::DEVICE])
                ->assertUnauthorized()->assertJsonPath('error', 'UNAUTHENTICATED');
        }
        foreach ([self::CHECK_IN, self::CHECK_OUT] as $path) {
            $this->scan($this->host, $path)->assertForbidden()->assertJsonPath('error', 'FORBIDDEN');
        }
    }

    /** @test Target: UC-OPS-03 EX.1. Distinct concurrent students competing for one device yield one 200 and one 403. */
    public function test_concurrent_students_cannot_claim_the_same_device(): void
    {
        $other = $this->user();
        $secondTicket = $this->ticketFor($other);
        $responses = $this->race([$this->student, $other], self::CHECK_IN, $this->scanPayload(), ['X-Device-Id' => self::DEVICE]);

        $this->assertSame([200, 403], array_column($responses, 'status'));
        $this->assertSame('DEVICE_ALREADY_USED', $responses[1]['error']);
        $tickets = DangKy::whereKey([$this->ticket->getKey(), $secondTicket->getKey()])->get();
        $this->assertCount(1, $tickets->where('trang_thai', 'DaCheckIn')->where('ma_thiet_bi_check_in', self::DEVICE));
        $this->assertCount(1, $tickets->where('trang_thai', 'DaDangKy')->whereNull('ma_thiet_bi_check_in'));
        $this->assertCount(2, $tickets->where('nghi_van_gian_lan', true)->where('ma_thiet_bi_nghi_van', self::DEVICE));
    }

    /** @test Target: UC-OPS-04 step 5. Cancelled tickets cannot be reinstated by attendance override. */
    public function test_manual_override_rejects_cancelled_ticket(): void
    {
        $this->ticket->update(['trang_thai' => 'DaHuy', 'thoi_gian_huy' => now()]);
        $this->override($this->host)->assertConflict()->assertJsonPath('error', 'INVALID_STATE_TRANSITION');
        $this->assertTicket($this->ticket, ['trang_thai' => 'DaHuy', 'da_check_in' => false]);
        $this->assertAuditCount(0);
    }

    /** @test Target: UC-OPS-04 normal course. Clear flags, apply actual end and write the complete audit. */
    public function test_manual_override_clears_no_show_and_fraud_flags_and_writes_audit_log(): void
    {
        $this->event->update(['thoi_gian_ket_thuc_thuc_te' => now()->addMinutes(105)]);
        $this->ticket->update(['nghi_van_gian_lan' => true, 'ma_thiet_bi_nghi_van' => self::DEVICE]);
        $noShow = $this->ticketFor($this->user(), ['vi_pham_no_show' => true]);
        $this->travel(3)->hours();

        $this->override($this->host, ['xoa_no_show' => false])->assertOk()
            ->assertJsonPath('data.trang_thai', 'DaCheckOut')
            ->assertJsonPath('data.da_check_in', true)
            ->assertJsonPath('data.da_check_out', true)
            ->assertJsonPath('data.nghi_van_gian_lan', false)
            ->assertJsonPath('data.vi_pham_no_show', false);
        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaCheckOut', 'da_check_in' => true, 'da_check_out' => true,
            'nghi_van_gian_lan' => false, 'ma_thiet_bi_nghi_van' => null, 'vi_pham_no_show' => false,
            'ti_le_drl' => 0.5, 'tham_gia_tron_ven' => false, 'tham_gia_mot_phan' => true,
            'thoi_gian_check_in' => $this->event->thoi_gian_bat_dau->toDateTimeString(),
            'thoi_gian_check_out' => $this->event->thoi_gian_ket_thuc_thuc_te->toDateTimeString(),
        ]);
        $this->assertAuditCount(1);
        $this->assertDatabaseHas('nhat_ky_diem_danh', [
            ...$this->overridePayload(), 'nguoi_thuc_hien' => $this->host->getKey(),
            'trang_thai_cu' => 'DaDangKy', 'ti_le_drl_cu' => 0,
        ]);
        $this->assertNotNull(DB::table('nhat_ky_diem_danh')->value('thoi_gian_tao'));
        $this->override($this->host, ['xoa_no_show' => true])->assertConflict()->assertJsonPath('error', 'INVALID_STATE_TRANSITION');
        $this->assertAuditCount(1);

        $this->override($this->host, ['ma_dang_ky' => $noShow->getKey(), 'xoa_no_show' => false])->assertOk();
        $this->assertTicket($noShow, ['trang_thai' => 'DaCheckOut', 'vi_pham_no_show' => false]);
    }

    /** @test Target: UC-OPS-04 step 5. Manual Check-in defaults to the earlier of now and event start. */
    #[DataProvider('manualCheckInOffsets')]
    public function test_manual_check_in_uses_the_earlier_timestamp(int $offset): void
    {
        $this->travelTo(now()->addMinutes($offset));
        $this->override($this->host, ['trang_thai_moi' => 'DaCheckIn', 'ti_le_drl_moi' => 0.0])->assertOk();
        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaCheckIn', 'da_check_in' => true, 'da_check_out' => false,
            'thoi_gian_check_in' => $this->event->thoi_gian_bat_dau->copy()->addMinutes(min(0, $offset))->toDateTimeString(),
            'thoi_gian_check_out' => null, 'ti_le_drl' => 0,
            'tham_gia_tron_ven' => false, 'tham_gia_mot_phan' => false,
        ]);
    }

    public static function manualCheckInOffsets(): array
    {
        return ['before start' => [-10], 'after start' => [10]];
    }

    /** @test Target: UC-OPS-04 step 5. Reverting Check-out maintains database attendance and feedback constraints. */
    public function test_manual_check_in_from_check_out_resets_dependent_flags(): void
    {
        $this->ticket->update([
            'trang_thai' => 'DaCheckOut', 'da_check_in' => true, 'da_check_out' => true,
            'thoi_gian_check_in' => now()->subMinute(), 'thoi_gian_check_out' => now(),
            'ti_le_drl' => 1, 'tham_gia_tron_ven' => true, 'da_feedback' => true, 'du_dieu_kien_drl' => true,
        ]);
        $this->override($this->host, ['trang_thai_moi' => 'DaCheckIn', 'ti_le_drl_moi' => 0])->assertOk();
        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaCheckIn', 'da_check_out' => false, 'thoi_gian_check_out' => null,
            'thoi_gian_check_in' => now()->subMinute()->toDateTimeString(),
            'ti_le_drl' => 0, 'tham_gia_tron_ven' => false, 'da_feedback' => false, 'du_dieu_kien_drl' => false,
        ]);
    }

    /** @test Target: UC-OPS-04 and OpenAPI EventHostOrAdmin. Reject students and organizers of other units. */
    public function test_manual_override_requires_event_host_or_admin(): void
    {
        $this->postJson(self::OVERRIDE, $this->overridePayload())->assertUnauthorized()->assertJsonPath('error', 'UNAUTHENTICATED');
        $this->override($this->student)->assertForbidden()->assertJsonPath('error', 'FORBIDDEN');
        $this->override($this->user('ToChuc', $this->unit()))->assertForbidden()->assertJsonPath('error', 'FORBIDDEN');
        $this->assertAuditCount(0);
        $this->override($this->user('Admin'))->assertOk();
    }

    /** @test Target: UC-OPS-04 EX.1. Reject even an admin while the event DRL list is locked. */
    public function test_manual_override_rejects_locked_drl(): void
    {
        $this->event->update(['da_chot_drl' => true, 'thoi_gian_chot_drl' => now()]);
        $this->override($this->user('Admin'))->assertConflict()->assertJsonPath('error', 'DRL_LOCKED');
        $this->assertTicket($this->ticket, ['trang_thai' => 'DaDangKy']);
        $this->assertAuditCount(0);
    }

    /** @test Target: UC-OPS-04 step 3 and OpenAPI oneOf. Reject incompatible DRL or missing/invalid fields. */
    #[DataProvider('invalidOverrides')]
    public function test_manual_override_validation_is_conditional(array $changes, string $field): void
    {
        $this->override($this->host, $changes)->assertUnprocessable()
            ->assertJsonPath('error', 'VALIDATION_FAILED')->assertJsonValidationErrors($field);
        $this->assertTicket($this->ticket, ['trang_thai' => 'DaDangKy']);
        $this->assertAuditCount(0);
    }

    public static function invalidOverrides(): array
    {
        return [
            'Check-in with points' => [['trang_thai_moi' => 'DaCheckIn', 'ti_le_drl_moi' => 0.5], 'ti_le_drl_moi'],
            'Check-out without points' => [['ti_le_drl_moi' => 0], 'ti_le_drl_moi'],
            'non-tier percentage' => [['ti_le_drl_moi' => 0.9], 'ti_le_drl_moi'],
            'no reason' => [['ly_do' => null], 'ly_do'],
            'short reason' => [['ly_do' => 'Lỗi QR'], 'ly_do'],
            'non-boolean legacy flag' => [['xoa_no_show' => 'maybe'], 'xoa_no_show'],
            'invalid ticket id' => [['ma_dang_ky' => 0], 'ma_dang_ky'],
        ];
    }

    /** @test Target: UC-OPS-04 step 5. A real database failure in the audit insert rolls back the ticket. */
    public function test_manual_override_rolls_back_ticket_when_audit_insert_fails(): void
    {
        $actor = $this->host->replicate();
        $actor->ma_tai_khoan = PHP_INT_MAX;
        $this->assertDatabaseMissing('tai_khoan', ['ma_tai_khoan' => $actor->getKey()]);
        try {
            app(AttendanceOverrideService::class)->manualOverride($actor, $this->overridePayload());
            $this->fail('Expected the audit actor foreign key to reject the insert.');
        } catch (QueryException $exception) {
            $this->assertSame('23000', $exception->errorInfo[0]);
            $this->assertSame(1452, $exception->errorInfo[1]);
            $this->assertStringContainsString('fk_diemdanh_nguoi', $exception->getMessage());
        }
        DB::purge();
        $this->assertTicket($this->ticket, [
            'trang_thai' => 'DaDangKy', 'da_check_in' => false, 'da_check_out' => false, 'ti_le_drl' => 0,
        ]);
        $this->assertAuditCount(0);
    }

    /** @test Target: UC-OPS-04 step 5. Concurrent equivalent overrides record only one actual transition. */
    public function test_concurrent_manual_override_creates_one_audit_log(): void
    {
        $responses = $this->race([$this->host, $this->user('Admin')], self::OVERRIDE, $this->overridePayload());
        $this->assertSame([200, 409], array_column($responses, 'status'));
        $this->assertSame('INVALID_STATE_TRANSITION', $responses[1]['error']);
        $this->assertAuditCount(1);
        $this->assertDatabaseHas('nhat_ky_diem_danh', [
            'ma_dang_ky' => $this->ticket->getKey(), 'nguoi_thuc_hien' => $responses[0]['user'],
        ]);
    }

    private function unit(): DonViToChuc
    {
        $unit = DonViToChuc::create(['ten_don_vi' => 'PKG-09 '.Str::random(8), 'ma_dinh_danh' => 'PKG09_'.Str::upper(Str::random(8)), 'loai_don_vi' => 'Khoa']);
        $this->fixtureUnitIds[] = $unit->getKey();

        return $unit;
    }

    private function user(string $role = 'SinhVien', ?DonViToChuc $unit = null): User
    {
        $mssv = null;
        if ($role === 'SinhVien') {
            do {
                $mssv = (string) random_int(22529000, 22529999);
            } while (User::where('mssv', $mssv)->exists());
        }

        $user = User::create([
            'email' => $mssv ? "{$mssv}@gm.uit.edu.vn" : Str::random(12).'@uit.edu.vn',
            'mssv' => $mssv,
            'ho_ten' => 'PKG-09 '.$role,
            'mat_khau' => bcrypt('Test-Only-Password!'),
            'loai_tai_khoan' => $role,
            'ma_don_vi_to_chuc' => $unit?->getKey(),
            'dong_y_nghi_dinh_13' => true,
            'hoat_dong' => true,
            'buoc_doi_mat_khau' => false,
        ]);
        $this->fixtureUserIds[] = $user->getKey();

        return $user;
    }

    private function ticketFor(User $user, array $attributes = []): DangKy
    {
        $uuid = (string) Str::uuid();

        return DangKy::create($attributes + [
            'ma_tai_khoan' => $user->getKey(),
            'ma_su_kien' => $this->event->getKey(),
            'ma_ve_uuid' => $uuid,
            'chu_ky_hmac' => app(CryptoService::class)->signTicket($uuid, $user->getKey(), $this->event->getKey()),
        ]);
    }

    private function checkInAt(Carbon $at, ?string $device = self::DEVICE): void
    {
        $this->ticket->update([
            'trang_thai' => 'DaCheckIn', 'da_check_in' => true,
            'thoi_gian_check_in' => $at, 'ma_thiet_bi_check_in' => $device,
        ]);
    }

    private function totp(int $steps = 0): string
    {
        // RFC 6238 test secret in ASCII, independent of application code.
        $counter = intdiv(now()->timestamp, 30) + $steps;
        $mac = hash_hmac('sha1', pack('J', $counter), self::SECRET, true);
        $offset = ord($mac[19]) & 15;
        $number = unpack('N', substr($mac, $offset, 4))[1] & 0x7FFFFFFF;

        return sprintf('%06d', $number % 1000000);
    }

    private function scanPayload(?string $code = null): array
    {
        return ['ma_su_kien' => $this->event->getKey(), 'totp_code' => $code ?? $this->totp()];
    }

    private function scan(User $user, string $path, string $device = self::DEVICE, ?string $code = null): TestResponse
    {
        return $this->actingAs($user)->postJson($path, $this->scanPayload($code), ['X-Device-Id' => $device]);
    }

    private function overridePayload(): array
    {
        return [
            'ma_dang_ky' => $this->ticket->getKey(), 'trang_thai_moi' => 'DaCheckOut',
            'ti_le_drl_moi' => 0.5, 'ly_do' => 'Đã đối soát thẻ sinh viên tại bàn BTC.',
        ];
    }

    private function override(User $user, array $changes = []): TestResponse
    {
        return $this->actingAs($user)->postJson(self::OVERRIDE, $changes + $this->overridePayload());
    }

    private function assertTicket(DangKy $ticket, array $attributes): void
    {
        $this->assertDatabaseHas('dang_ky', ['ma_dang_ky' => $ticket->getKey(), ...$attributes]);
    }

    private function assertAuditCount(int $expected): void
    {
        $tickets = DangKy::where('ma_su_kien', $this->event->getKey())->select('ma_dang_ky');
        $this->assertSame($expected, DB::table('nhat_ky_diem_danh')->whereIn('ma_dang_ky', $tickets)->count());
    }

    private function race(array $users, string $path, array $payload, array $headers = []): array
    {
        // Fixtures for this test are committed so both workers can read them.
        DB::purge();
        $workers = [];
        foreach ($users as $user) {
            [$parent, $child] = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
            $pid = pcntl_fork();
            $this->assertNotSame(-1, $pid);
            if ($pid === 0) {
                fclose($parent);
                foreach ($workers as [$inherited]) {
                    fclose($inherited);
                }
                fwrite($child, "ready\n");
                fgets($child);
                try {
                    $response = $this->actingAs($user)->postJson($path, $payload, $headers);
                    fwrite($child, json_encode([
                        'user' => $user->getKey(), 'status' => $response->status(), 'error' => $response->json('error'),
                    ], JSON_THROW_ON_ERROR)."\n");
                    exit(0);
                } catch (\Throwable $exception) {
                    fwrite($child, get_class($exception)."\n");
                    exit(1);
                }
            }
            fclose($child);
            stream_set_timeout($parent, 15);
            $workers[] = [$parent, $pid];
        }

        foreach ($workers as [$socket]) {
            $this->assertSame("ready\n", fgets($socket));
        }
        foreach ($workers as [$socket]) {
            fwrite($socket, "go\n");
        }

        $responses = [];
        foreach ($workers as [$socket, $pid]) {
            $line = fgets($socket);
            fclose($socket);
            pcntl_waitpid($pid, $exitStatus);
            $this->assertTrue(pcntl_wifexited($exitStatus));
            $this->assertSame(0, pcntl_wexitstatus($exitStatus), (string) $line);
            $responses[] = json_decode($line, true, flags: JSON_THROW_ON_ERROR);
        }
        usort($responses, fn (array $a, array $b) => $a['status'] <=> $b['status']);
        fwrite(STDERR, "\n".$path.' concurrency '.json_encode($responses, JSON_THROW_ON_ERROR)."\n");

        return $responses;
    }
}
