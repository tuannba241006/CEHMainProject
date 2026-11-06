<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\HangDoiWaitlist;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use App\Services\CryptoService;
use App\Services\WaitlistService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class WaitlistFifoTest extends TestCase
{
    protected DonViToChuc $unit;

    protected ChuyenDe $topic;

    protected PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-11-05 08:00:00'));
        $this->unit = DonViToChuc::query()->firstOrFail();
        $this->topic = ChuyenDe::query()->firstOrFail();
        $this->room = PhongHoiTruong::query()->where('trang_thai', 'KhaDung')->firstOrFail();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /**
     * @test
     * Target: UC-BOOK-02 (FIFO waitlist enrollment)
     * Course: Two students join in order; the released slot is offered to the lowest sequence.
     * Expected: HTTP 201 with positions 1 and 2, then only sequence 1 becomes OFFERED.
     */
    public function test_join_assigns_fifo_sequence_and_offer_goes_to_first_waiter(): void
    {
        $event = $this->createEvent();
        $first = $this->createStudent();
        $second = $this->createStudent();

        $firstResponse = $this->actingAs($first)->postJson("/api/v1/events/{$event->ma_su_kien}/waitlist");
        $firstResponse->assertCreated()->assertJsonPath('success', true)->assertJsonPath('data.so_thu_tu', 1);
        $firstEntryId = $firstResponse->json('data.id');

        $secondResponse = $this->actingAs($second)->postJson("/api/v1/events/{$event->ma_su_kien}/waitlist");
        $secondResponse->assertCreated()->assertJsonPath('data.so_thu_tu', 2);

        DB::transaction(function () use ($event) {
            SuKien::query()->whereKey($event->ma_su_kien)->lockForUpdate()->firstOrFail();
            app(WaitlistService::class)->offerNext((int) $event->ma_su_kien, now());
        });

        $this->assertSame('OFFERED', HangDoiWaitlist::query()->findOrFail($firstEntryId)->trang_thai);
        $this->assertSame('WAITING', HangDoiWaitlist::query()->where('so_thu_tu', 2)->where('ma_su_kien', $event->ma_su_kien)->value('trang_thai'));
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-BOOK-02 (Waitlist join eligibility)
     * Course: Sold out, cutoff reached, active ticket, or existing active queue entry.
     * Expected: 409 with the OpenAPI error code for each rejected join.
     */
    public function test_join_returns_contract_conflicts_for_unavailable_or_duplicate_cases(): void
    {
        $student = $this->createStudent();
        $availableEvent = $this->createEvent(['so_ve_con_lai' => 1]);
        $this->actingAs($student)->postJson("/api/v1/events/{$availableEvent->ma_su_kien}/waitlist")
            ->assertStatus(409)->assertJsonPath('error', 'TICKETS_AVAILABLE');

        $closedEvent = $this->createEvent(['thoi_gian_bat_dau' => now()->addHours(2)]);
        $this->actingAs($student)->postJson("/api/v1/events/{$closedEvent->ma_su_kien}/waitlist")
            ->assertStatus(409)->assertJsonPath('error', 'WAITLIST_CLOSED');

        $registeredEvent = $this->createEvent();
        $this->createTicket($student, $registeredEvent);
        $this->actingAs($student)->postJson("/api/v1/events/{$registeredEvent->ma_su_kien}/waitlist")
            ->assertStatus(409)->assertJsonPath('error', 'ALREADY_REGISTERED');

        $queuedEvent = $this->createEvent();
        HangDoiWaitlist::query()->create([
            'ma_su_kien' => $queuedEvent->ma_su_kien,
            'ma_tai_khoan' => $student->ma_tai_khoan,
            'so_thu_tu' => 1,
            'trang_thai' => 'WAITING',
            'thoi_gian_dang_ky' => now(),
        ]);
        $this->actingAs($student)->postJson("/api/v1/events/{$queuedEvent->ma_su_kien}/waitlist")
            ->assertStatus(409)->assertJsonPath('error', 'ALREADY_IN_WAITLIST');
    }

    /**
     * @test
     * Target: UC-BOOK-02 (Limited-slot waitlist and request rate limit)
     * Course: Unlimited event and more than ten join attempts in one minute.
     * Expected: Unlimited event returns TICKETS_AVAILABLE; the eleventh request returns 429.
     */
    public function test_unlimited_events_are_not_waitlisted_and_join_is_throttled(): void
    {
        $student = $this->createStudent();
        $unlimited = $this->createEvent([
            'khong_gioi_han_slot' => 1,
            'so_luong_toi_da' => null,
            'so_ve_con_lai' => null,
        ]);

        $this->actingAs($student)->postJson("/api/v1/events/{$unlimited->ma_su_kien}/waitlist")
            ->assertStatus(409)->assertJsonPath('error', 'TICKETS_AVAILABLE');

        $throttledStudent = $this->createStudent();
        $available = $this->createEvent(['so_ve_con_lai' => 1]);
        $this->actingAs($throttledStudent);
        for ($attempt = 1; $attempt <= 10; $attempt++) {
            $response = $this->postJson("/api/v1/events/{$available->ma_su_kien}/waitlist");
            $this->assertSame(409, $response->status());
        }

        $this->postJson("/api/v1/events/{$available->ma_su_kien}/waitlist")->assertStatus(429);
    }

    /**
     * @test
     * Target: UC-BOOK-03 / UC-TCK-01 (Student waitlist tabs)
     * Course: Active and historical entries plus status filtering.
     * Expected: active contains WAITING/OFFERED; history contains terminal statuses only.
     */
    public function test_my_entries_filters_active_history_and_status(): void
    {
        $student = $this->createStudent();
        $event = $this->createEvent();
        foreach (['WAITING', 'OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'SKIPPED_CONFLICT', 'CLOSED_WAITLIST', 'CANCELLED'] as $index => $status) {
            $event = $this->createEvent();
            HangDoiWaitlist::query()->create([
                'ma_su_kien' => $event->ma_su_kien,
                'ma_tai_khoan' => $student->ma_tai_khoan,
                'so_thu_tu' => $index + 1,
                'trang_thai' => $status,
                'han_chot_xac_nhan' => $status === 'OFFERED' ? now()->addMinutes(30) : null,
                'thoi_gian_dang_ky' => now()->addSeconds($index),
            ]);
        }

        $this->actingAs($student)->getJson('/api/v1/waitlist/my-entries?tab=active')
            ->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.tong_so_ban_ghi', 2);
        $this->getJson('/api/v1/waitlist/my-entries?tab=history')
            ->assertOk()->assertJsonCount(6, 'data')
            ->assertJsonPath('meta.tong_so_ban_ghi', 6);
        $this->getJson('/api/v1/waitlist/my-entries?trang_thai=OFFERED')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.trang_thai', 'OFFERED');
    }

    /**
     * @test
     * Target: UC-BOOK-03 (Claim offer and issue a signed ticket)
     * Course: Owner claims an active offer before its deadline.
     * Expected: HTTP 200, ACCEPTED, valid DaDangKy HMAC ticket, and unchanged public inventory.
     */
    public function test_claim_accepts_offer_and_issues_valid_ticket_without_changing_remaining_slots(): void
    {
        $student = $this->createStudent();
        $event = $this->createEvent(['so_luong_toi_da' => 2, 'so_ve_con_lai' => 1]);
        $entry = $this->createEntry($student, $event, 'OFFERED', now()->addMinutes(30));

        $this->actingAs($student)->postJson("/api/v1/waitlist/{$entry->id}/claim")
            ->assertOk()->assertJsonPath('success', true)->assertJsonPath('data.trang_thai', 'DaDangKy');

        $this->assertSame('ACCEPTED', $entry->fresh()->trang_thai);
        $this->assertNotNull($entry->fresh()->thoi_gian_phan_hoi);
        $ticket = DangKy::query()->where('ma_su_kien', $event->ma_su_kien)->where('ma_tai_khoan', $student->ma_tai_khoan)->firstOrFail();
        $this->assertSame('DaDangKy', $ticket->trang_thai);
        $this->assertTrue(app(CryptoService::class)->verifyTicket($ticket->chu_ky_hmac, $ticket->ma_ve_uuid, (int) $student->ma_tai_khoan, (int) $event->ma_su_kien));
        $this->assertSame(1, $event->fresh()->so_ve_con_lai);
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-BOOK-03.AC.1 (Expired claim advances the FIFO queue)
     * Course: Owner claims after the offered deadline while another student waits.
     * Expected: 409 OFFER_EXPIRED; expired entry remains terminal and next entry becomes OFFERED.
     */
    public function test_expired_claim_returns_offer_expired_and_offers_next_student(): void
    {
        $first = $this->createStudent();
        $second = $this->createStudent();
        $event = $this->createEvent(['so_luong_toi_da' => 2, 'so_ve_con_lai' => 1]);
        $offered = $this->createEntry($first, $event, 'OFFERED', now()->subSecond());
        $waiting = $this->createEntry($second, $event, 'WAITING', null, 2);

        $this->actingAs($first)->postJson("/api/v1/waitlist/{$offered->id}/claim")
            ->assertStatus(409)->assertJsonPath('error', 'OFFER_EXPIRED');

        $this->assertSame('EXPIRED', $offered->fresh()->trang_thai);
        $this->assertSame('OFFERED', $waiting->fresh()->trang_thai);
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-BOOK-03 (Skip a conflicting student during offer screening)
     * Course: FIFO head already holds a ticket for another overlapping limited-slot event.
     * Expected: first entry SKIPPED_CONFLICT and next FIFO entry OFFERED.
     */
    public function test_conflict_during_offer_skips_first_waiter_and_offers_next(): void
    {
        $first = $this->createStudent();
        $second = $this->createStudent();
        $event = $this->createEvent(['so_luong_toi_da' => 1, 'so_ve_con_lai' => 0]);
        $otherEvent = $this->createEvent([
            'thoi_gian_bat_dau' => $event->thoi_gian_bat_dau,
            'thoi_gian_ket_thuc' => $event->thoi_gian_ket_thuc,
            'so_luong_toi_da' => 1,
            'so_ve_con_lai' => 0,
        ]);
        $this->createTicket($first, $otherEvent);
        $firstEntry = $this->createEntry($first, $event, 'WAITING');
        $secondEntry = $this->createEntry($second, $event, 'WAITING', null, 2);

        DB::transaction(function () use ($event) {
            SuKien::query()->whereKey($event->ma_su_kien)->lockForUpdate()->firstOrFail();
            app(WaitlistService::class)->offerNext((int) $event->ma_su_kien, now());
        });

        $this->assertSame('SKIPPED_CONFLICT', $firstEntry->fresh()->trang_thai);
        $this->assertSame('OFFERED', $secondEntry->fresh()->trang_thai);
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-BOOK-03 (Recheck schedule conflict at claim)
     * Course: Student acquires an overlapping limited-slot ticket after being offered.
     * Expected: 409 OFFER_SKIPPED_CONFLICT; the next waiter receives the offer.
     */
    public function test_conflict_at_claim_skips_offer_and_advances_queue(): void
    {
        $first = $this->createStudent();
        $second = $this->createStudent();
        $event = $this->createEvent(['so_luong_toi_da' => 1, 'so_ve_con_lai' => 0]);
        $otherEvent = $this->createEvent([
            'thoi_gian_bat_dau' => $event->thoi_gian_bat_dau,
            'thoi_gian_ket_thuc' => $event->thoi_gian_ket_thuc,
            'so_luong_toi_da' => 1,
            'so_ve_con_lai' => 0,
        ]);
        $offered = $this->createEntry($first, $event, 'OFFERED', now()->addMinutes(30));
        $waiting = $this->createEntry($second, $event, 'WAITING', null, 2);
        $this->createTicket($first, $otherEvent);

        $this->actingAs($first)->postJson("/api/v1/waitlist/{$offered->id}/claim")
            ->assertStatus(409)->assertJsonPath('error', 'OFFER_SKIPPED_CONFLICT')
            ->assertJsonPath('details.su_kien_trung.ma_su_kien', $otherEvent->ma_su_kien);

        $this->assertSame('SKIPPED_CONFLICT', $offered->fresh()->trang_thai);
        $this->assertSame('OFFERED', $waiting->fresh()->trang_thai);
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-BOOK-03.AC.2 (Decline an active offer)
     * Course: Student declines a live offer while another student is waiting.
     * Expected: HTTP 200 DECLINED; the FIFO successor becomes OFFERED.
     */
    public function test_declining_offer_advances_to_next_waiter(): void
    {
        $first = $this->createStudent();
        $second = $this->createStudent();
        $event = $this->createEvent(['so_luong_toi_da' => 2, 'so_ve_con_lai' => 1]);
        $offered = $this->createEntry($first, $event, 'OFFERED', now()->addMinutes(30));
        $waiting = $this->createEntry($second, $event, 'WAITING', null, 2);

        $this->actingAs($first)->postJson("/api/v1/waitlist/{$offered->id}/decline")
            ->assertOk()->assertJsonPath('data.trang_thai', 'DECLINED');

        $this->assertSame('DECLINED', $offered->fresh()->trang_thai);
        $this->assertSame('OFFERED', $waiting->fresh()->trang_thai);
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-BOOK-03.AC.2 (Decline state transition guard)
     * Course: Student attempts to decline a WAITING entry.
     * Expected: HTTP 409 INVALID_STATE_TRANSITION and no state change.
     */
    public function test_decline_rejects_entry_that_is_not_offered(): void
    {
        $student = $this->createStudent();
        $event = $this->createEvent();
        $entry = $this->createEntry($student, $event, 'WAITING');

        $this->actingAs($student)->postJson("/api/v1/waitlist/{$entry->id}/decline")
            ->assertStatus(409)->assertJsonPath('error', 'INVALID_STATE_TRANSITION');
        $this->assertSame('WAITING', $entry->fresh()->trang_thai);
    }

    /**
     * @test
     * Target: UC-BOOK-03 (Claim state transition guard)
     * Course: Student attempts to claim a WAITING entry.
     * Expected: HTTP 409 INVALID_STATE_TRANSITION and no ticket is issued.
     */
    public function test_claim_rejects_entry_that_is_not_offered(): void
    {
        $student = $this->createStudent();
        $event = $this->createEvent();
        $entry = $this->createEntry($student, $event, 'WAITING');

        $this->actingAs($student)->postJson("/api/v1/waitlist/{$entry->id}/claim")
            ->assertStatus(409)->assertJsonPath('error', 'INVALID_STATE_TRANSITION');

        $this->assertSame('WAITING', $entry->fresh()->trang_thai);
        $this->assertDatabaseMissing('dang_ky', [
            'ma_tai_khoan' => $student->ma_tai_khoan,
            'ma_su_kien' => $event->ma_su_kien,
        ]);
    }

    /**
     * @test
     * Target: UC-SYS-01 Task 1 / UC-BOOK-03.AC.1 (Expire offers)
     * Course: Scheduled command processes an expired offer with no FIFO successor.
     * Expected: OFFERED becomes EXPIRED and the released slot returns to public inventory.
     */
    public function test_expire_offers_command_returns_expired_slot_to_public_inventory(): void
    {
        $student = $this->createStudent();
        $event = $this->createEvent(['so_luong_toi_da' => 1, 'so_ve_con_lai' => 0]);
        $entry = $this->createEntry($student, $event, 'OFFERED', now()->subSecond());

        $this->artisan('ceh:expire-offers')->assertSuccessful();

        $this->assertSame('EXPIRED', $entry->fresh()->trang_thai);
        $this->assertSame(1, $event->fresh()->so_ve_con_lai);
        $this->assertSlotInvariant($event);
    }

    protected function createStudent(): User
    {
        $mssv = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);

        return User::query()->create([
            'mssv' => $mssv,
            'email' => Str::uuid().'@gm.uit.edu.vn',
            'ho_ten' => 'Waitlist Student',
            'lop_sinh_hoat' => 'HTTT2022',
            'mat_khau' => Hash::make('Password123@'),
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => 1,
            'hoat_dong' => 1,
            'buoc_doi_mat_khau' => 0,
        ]);
    }

    protected function createEvent(array $overrides = []): SuKien
    {
        $start = now()->addHours(10);

        return SuKien::query()->create(array_merge([
            'ma_don_vi_to_chuc' => $this->unit->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'Waitlist Event '.Str::random(8),
            'mo_ta' => 'Feature test event for FIFO waitlist',
            'ngay_cong_bo' => now()->subDay(),
            'thoi_gian_bat_dau' => $start,
            'thoi_gian_ket_thuc' => $start->copy()->addHours(2),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 1,
            'so_ve_con_lai' => 0,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'trang_thai' => 'PUBLISHED',
        ], $overrides));
    }

    protected function createEntry(User $student, SuKien $event, string $status, ?Carbon $deadline = null, int $sequence = 1): HangDoiWaitlist
    {
        return HangDoiWaitlist::query()->create([
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan' => $student->ma_tai_khoan,
            'so_thu_tu' => $sequence,
            'trang_thai' => $status,
            'thoi_gian_dang_ky' => now(),
            'han_chot_xac_nhan' => $deadline,
        ]);
    }

    protected function createTicket(User $student, SuKien $event): DangKy
    {
        $uuid = (string) Str::uuid();

        return DangKy::query()->create([
            'ma_tai_khoan' => $student->ma_tai_khoan,
            'ma_su_kien' => $event->ma_su_kien,
            'ma_ve_uuid' => $uuid,
            'chu_ky_hmac' => app(CryptoService::class)->signTicket($uuid, (int) $student->ma_tai_khoan, (int) $event->ma_su_kien),
            'trang_thai' => 'DaDangKy',
            'thoi_gian_dang_ky' => now(),
        ]);
    }

    protected function assertSlotInvariant(SuKien $event): void
    {
        $fresh = $event->fresh();
        $validTickets = DangKy::query()->where('ma_su_kien', $event->ma_su_kien)->where('trang_thai', '!=', 'DaHuy')->count();
        $offered = HangDoiWaitlist::query()->where('ma_su_kien', $event->ma_su_kien)->where('trang_thai', 'OFFERED')->count();

        $this->assertSame(
            (int) $fresh->so_luong_toi_da,
            $validTickets + $offered + (int) $fresh->so_slot_dong_bang + (int) $fresh->so_ve_con_lai
        );
    }
}
