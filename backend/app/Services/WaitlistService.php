<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Mail\TicketBookedMailable;
use App\Mail\WaitlistOfferMailable;
use App\Models\DangKy;
use App\Models\HangDoiWaitlist;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class WaitlistService
{
    public function __construct(
        protected CryptoService $cryptoService,
        protected NotificationService $notificationService
    ) {}

    /**
     * Add a student to the FIFO queue (UC-BOOK-02).
     * Lock order: tai_khoan -> su_kien -> hang_doi_waitlist.
     */
    public function joinWaitlist(int $eventId, User $student): HangDoiWaitlist
    {
        return DB::transaction(function () use ($eventId, $student) {
            $lockedStudent = User::query()
                ->where('ma_tai_khoan', $student->ma_tai_khoan)
                ->lockForUpdate()
                ->first();

            if (! $lockedStudent) {
                throw new BusinessException(
                    'NOT_FOUND',
                    'Không tìm thấy tài khoản sinh viên.',
                    null,
                    404
                );
            }

            if (! $lockedStudent->isSinhVien()) {
                throw new BusinessException(
                    'FORBIDDEN',
                    'Chỉ tài khoản sinh viên mới được quyền tham gia danh sách chờ.',
                    null,
                    403
                );
            }

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            if (! $event || ! in_array($event->trang_thai, ['PUBLISHED', 'HAPPENING', 'COMPLETED', 'CANCELLED'], true)) {
                throw new BusinessException(
                    'NOT_FOUND',
                    'Không tìm thấy sự kiện.',
                    null,
                    404
                );
            }

            $now = now();
            if ($event->ngay_cong_bo && $now->lt($event->ngay_cong_bo)) {
                throw new BusinessException(
                    'WAITLIST_CLOSED',
                    'Chưa đến thời gian mở đăng ký sự kiện.',
                    null,
                    409
                );
            }

            if ($event->trang_thai === 'CANCELLED') {
                throw new BusinessException(
                    'WAITLIST_CLOSED',
                    'Sự kiện đã bị hủy, hàng đợi danh sách chờ đã đóng.',
                    null,
                    409
                );
            }

            if ($event->trang_thai === 'COMPLETED' || ($event->thoi_gian_ket_thuc && $now->gte($event->thoi_gian_ket_thuc))) {
                throw new BusinessException(
                    'WAITLIST_CLOSED',
                    'Sự kiện đã kết thúc, hàng đợi danh sách chờ đã đóng.',
                    null,
                    409
                );
            }

            if ($event->khong_gioi_han_slot) {
                throw new BusinessException(
                    'TICKETS_AVAILABLE',
                    'Sự kiện mở tự do không sử dụng danh sách chờ. Vui lòng đặt vé trực tiếp.',
                    null,
                    409
                );
            }

            $cutoff = $event->thoi_gian_bat_dau->copy()->subHours(2);
            if ($event->trang_thai !== 'PUBLISHED' || $now->gte($cutoff)) {
                throw new BusinessException(
                    'WAITLIST_CLOSED',
                    'Hàng đợi danh sách chờ đã đóng (dưới 2 giờ trước khi sự kiện diễn ra).',
                    null,
                    409
                );
            }

            if ((int) $event->so_ve_con_lai > 0) {
                throw new BusinessException(
                    'TICKETS_AVAILABLE',
                    'Sự kiện vừa có vé trống! Vui lòng đặt vé ngay.',
                    null,
                    409
                );
            }

            $hasTicket = DangKy::query()
                ->where('ma_tai_khoan', $lockedStudent->ma_tai_khoan)
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', '!=', 'DaHuy')
                ->exists();

            if ($hasTicket) {
                throw new BusinessException(
                    'ALREADY_REGISTERED',
                    'Bạn đã đăng ký vé tham dự sự kiện này trước đó.',
                    null,
                    409
                );
            }

            $alreadyWaiting = HangDoiWaitlist::query()
                ->where('ma_su_kien', $eventId)
                ->where('ma_tai_khoan', $lockedStudent->ma_tai_khoan)
                ->whereIn('trang_thai', ['WAITING', 'OFFERED'])
                ->exists();

            if ($alreadyWaiting) {
                throw new BusinessException(
                    'ALREADY_IN_WAITLIST',
                    'Bạn đã có tên trong danh sách chờ của sự kiện này.',
                    null,
                    409
                );
            }

            $nextSequence = ((int) HangDoiWaitlist::query()
                ->where('ma_su_kien', $eventId)
                ->max('so_thu_tu')) + 1;

            return HangDoiWaitlist::create([
                'ma_su_kien' => $eventId,
                'ma_tai_khoan' => $lockedStudent->ma_tai_khoan,
                'so_thu_tu' => $nextSequence,
                'trang_thai' => 'WAITING',
                'thoi_gian_dang_ky' => now(),
            ]);
        });
    }

    /**
     * Allocate a released slot to the next FIFO student (UC-BOOK-03).
     * The caller must already hold the su_kien row lock and a transaction.
     */
    public function offerNext(int $eventId, Carbon $now): ?HangDoiWaitlist
    {
        $event = SuKien::query()->where('ma_su_kien', $eventId)->firstOrFail();
        if ($event->khong_gioi_han_slot) {
            return null;
        }

        $cutoff = $event->thoi_gian_bat_dau->copy()->subHours(2);
        if ($now->gte($cutoff)) {
            return null;
        }

        if (! $this->hasMinimumOfferWindow($event, $now)) {
            if (HangDoiWaitlist::query()
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', 'WAITING')
                ->exists()) {
                $event->so_slot_dong_bang++;
            } else {
                $event->so_ve_con_lai++;
            }
            $event->save();

            return null;
        }

        while (true) {
            $entry = HangDoiWaitlist::query()
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', 'WAITING')
                ->orderBy('so_thu_tu')
                ->lockForUpdate()
                ->first();

            if (! $entry) {
                $event->so_ve_con_lai++;
                $event->save();

                return null;
            }

            $conflict = $this->findScheduleConflict((int) $entry->ma_tai_khoan, $event);
            if ($conflict !== null) {
                $entry->trang_thai = 'SKIPPED_CONFLICT';
                $entry->thoi_gian_phan_hoi = $now;
                $entry->save();
                $this->notifyConflict($entry, $event, $conflict);

                continue;
            }

            $deadline = $now->copy()->addMinutes(60);
            if ($deadline->gt($cutoff)) {
                $deadline = $cutoff->copy();
            }

            $entry->trang_thai = 'OFFERED';
            $entry->han_chot_xac_nhan = $deadline;
            $entry->save();
            $this->notifyOffer($entry, $event, $deadline);

            return $entry;
        }
    }

    /**
     * Expire offers whose deadline passed before the T-2h cutoff.
     * Offers at or beyond cutoff remain OFFERED for reconcileCutoff to account atomically.
     */
    public function expireOffer(?Carbon $now = null): int
    {
        $now ??= now();
        $candidateIds = HangDoiWaitlist::query()
            ->where('trang_thai', 'OFFERED')
            ->where('han_chot_xac_nhan', '<', $now)
            ->orderBy('ma_su_kien')
            ->orderBy('id')
            ->pluck('id');

        $expired = 0;
        foreach ($candidateIds as $entryId) {
            $didExpire = DB::transaction(function () use ($entryId, $now) {
                $snapshot = HangDoiWaitlist::query()->find($entryId);
                if (! $snapshot) {
                    return false;
                }

                $event = SuKien::query()
                    ->where('ma_su_kien', $snapshot->ma_su_kien)
                    ->lockForUpdate()
                    ->first();
                if (! $event) {
                    return false;
                }

                $entry = HangDoiWaitlist::query()->whereKey($entryId)->lockForUpdate()->first();
                if (! $entry || $entry->trang_thai !== 'OFFERED' || ! $entry->han_chot_xac_nhan || ! $entry->han_chot_xac_nhan->lt($now)) {
                    return false;
                }

                if ($now->gte($event->thoi_gian_bat_dau->copy()->subHours(2))) {
                    return false;
                }

                $entry->trang_thai = 'EXPIRED';
                $entry->save();
                $this->offerNext((int) $event->ma_su_kien, $now);

                return true;
            });

            $expired += (int) $didExpire;
        }

        return $expired;
    }

    /**
     * Refuse an active offer and immediately advance the FIFO queue (UC-BOOK-03.AC.2).
     */
    public function declineOffer(int $entryId, User $student): HangDoiWaitlist
    {
        $snapshot = HangDoiWaitlist::query()->findOrFail($entryId);
        if ((int) $snapshot->ma_tai_khoan !== (int) $student->ma_tai_khoan) {
            throw new AuthorizationException('Bạn không có quyền thao tác trên bản ghi danh sách chờ này.');
        }

        return DB::transaction(function () use ($entryId, $student, $snapshot) {
            User::query()->where('ma_tai_khoan', $student->ma_tai_khoan)->lockForUpdate()->firstOrFail();
            $event = SuKien::query()->where('ma_su_kien', $snapshot->ma_su_kien)->lockForUpdate()->firstOrFail();
            $entry = HangDoiWaitlist::query()->whereKey($entryId)->lockForUpdate()->firstOrFail();

            if ((int) $entry->ma_tai_khoan !== (int) $student->ma_tai_khoan) {
                throw new AuthorizationException('Bạn không có quyền thao tác trên bản ghi danh sách chờ này.');
            }
            if ($entry->trang_thai !== 'OFFERED') {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Bản ghi danh sách chờ không ở trạng thái đang được mời nhận vé (OFFERED).',
                    null,
                    409
                );
            }

            $now = now();
            $cutoff = $event->thoi_gian_bat_dau->copy()->subHours(2);
            $entry->trang_thai = 'DECLINED';
            $entry->thoi_gian_phan_hoi = $now;
            $entry->save();

            $this->releaseSlotAfterOfferExit($event, $now, $cutoff);

            return $entry->fresh(['suKien.phongHoiTruong']);
        });
    }

    /**
     * Accept a held slot and issue a signed ticket in the same transaction.
     * Lock order: tai_khoan -> su_kien -> dang_ky -> hang_doi_waitlist.
     * Returns an error result for post-transition 409s so state changes commit.
     *
     * @return array{ticket: ?DangKy, entry: ?HangDoiWaitlist, error: ?array}
     */
    public function claimOffer(int $entryId, User $student): array
    {
        $snapshot = HangDoiWaitlist::query()->findOrFail($entryId);
        if ((int) $snapshot->ma_tai_khoan !== (int) $student->ma_tai_khoan) {
            throw new AuthorizationException('Bạn không có quyền thao tác trên bản ghi danh sách chờ này.');
        }

        return DB::transaction(function () use ($entryId, $student, $snapshot) {
            User::query()->where('ma_tai_khoan', $student->ma_tai_khoan)->lockForUpdate()->firstOrFail();
            $event = SuKien::query()->where('ma_su_kien', $snapshot->ma_su_kien)->lockForUpdate()->firstOrFail();

            // Lock existing registrations before the waitlist row to preserve the global ordering.
            $activeTickets = DangKy::query()
                ->where('ma_tai_khoan', $student->ma_tai_khoan)
                ->where('trang_thai', '!=', 'DaHuy')
                ->lockForUpdate()
                ->with(['suKien.phongHoiTruong'])
                ->get();

            $entry = HangDoiWaitlist::query()->whereKey($entryId)->lockForUpdate()->firstOrFail();
            if ((int) $entry->ma_tai_khoan !== (int) $student->ma_tai_khoan) {
                throw new AuthorizationException('Bạn không có quyền thao tác trên bản ghi danh sách chờ này.');
            }

            if ($entry->trang_thai !== 'OFFERED') {
                return ['ticket' => null, 'entry' => $entry, 'error' => [
                    'code' => 'INVALID_STATE_TRANSITION',
                    'message' => 'Bản ghi danh sách chờ không ở trạng thái đang được mời nhận vé (OFFERED).',
                ]];
            }

            $now = now();
            $cutoff = $event->thoi_gian_bat_dau->copy()->subHours(2);
            if ($entry->han_chot_xac_nhan && $now->gt($entry->han_chot_xac_nhan)) {
                if ($now->lt($cutoff)) {
                    $entry->trang_thai = 'EXPIRED';
                    $entry->save();
                    $this->offerNext((int) $event->ma_su_kien, $now);

                    return ['ticket' => null, 'entry' => $entry, 'error' => [
                        'code' => 'OFFER_EXPIRED',
                        'message' => 'Suất vé giữ chỗ đã hết thời hạn xác nhận và được chuyển cho người kế tiếp.',
                    ]];
                }

                return ['ticket' => null, 'entry' => $entry, 'error' => [
                    'code' => 'OFFER_EXPIRED',
                    'message' => 'Suất vé giữ chỗ đã hết thời hạn xác nhận (đã chạm mốc đóng đăng ký trước 2 giờ).',
                ]];
            }

            $alreadyRegistered = $activeTickets->contains(
                fn (DangKy $t) => (int) $t->ma_su_kien === (int) $event->ma_su_kien
            );
            if ($alreadyRegistered) {
                $entry->trang_thai = 'CANCELLED';
                $entry->thoi_gian_phan_hoi = $now;
                $entry->save();
                $this->releaseSlotAfterOfferExit($event, $now, $cutoff);

                return ['ticket' => null, 'entry' => $entry, 'error' => [
                    'code' => 'ALREADY_REGISTERED',
                    'message' => 'Bạn đã đăng ký vé tham dự sự kiện này trước đó.',
                ]];
            }

            $conflict = $this->findScheduleConflictInTickets($activeTickets, $event);
            if ($conflict !== null) {
                $entry->trang_thai = 'SKIPPED_CONFLICT';
                $entry->thoi_gian_phan_hoi = $now;
                $entry->save();
                $this->notifyConflict($entry, $event, $conflict);
                $this->releaseSlotAfterOfferExit($event, $now, $cutoff);

                return ['ticket' => null, 'entry' => $entry, 'error' => [
                    'code' => 'OFFER_SKIPPED_CONFLICT',
                    'message' => 'Không thể nhận vé vì bạn đang giữ vé của một sự kiện giới hạn slot khác trùng khung giờ.',
                    'details' => ['su_kien_trung' => $this->conflictDetails($conflict)],
                ]];
            }

            $entry->trang_thai = 'ACCEPTED';
            $entry->thoi_gian_phan_hoi = $now;
            $entry->save();

            $uuid = (string) Str::uuid();
            $ticket = DangKy::create([
                'ma_tai_khoan' => $student->ma_tai_khoan,
                'ma_su_kien' => $event->ma_su_kien,
                'ma_ve_uuid' => $uuid,
                'chu_ky_hmac' => $this->cryptoService->signTicket($uuid, (int) $student->ma_tai_khoan, (int) $event->ma_su_kien),
                'trang_thai' => 'DaDangKy',
                'thoi_gian_dang_ky' => $now,
                'da_check_in' => 0,
                'da_check_out' => 0,
                'nghi_van_gian_lan' => 0,
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 0,
                'da_feedback' => 0,
                'du_dieu_kien_drl' => 0,
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 0,
            ]);

            $this->notificationService->sendNotification(
                (int) $student->ma_tai_khoan,
                'Nhận vé tham dự thành công',
                "Bạn đã xác nhận suất tham dự sự kiện '{$event->ten_su_kien}'.",
                'VE_MOI',
                '/student/tickets'
            );

            $ticket->load(['suKien.phongHoiTruong', 'chungNhan']);

            if (! empty($student->email)) {
                DB::afterCommit(function () use ($ticket, $student) {
                    try {
                        Mail::to($student->email)->queue(new TicketBookedMailable($ticket, $student));
                    } catch (\Throwable $e) {
                        Log::warning('Failed to queue waitlist claimed ticket email', [
                            'ma_dang_ky' => $ticket->ma_dang_ky,
                            'ma_tai_khoan' => $student->ma_tai_khoan,
                            'error' => $e->getMessage(),
                        ]);
                    }
                });
            }

            return ['ticket' => $ticket, 'entry' => $entry, 'error' => null];
        });
    }

    /**
     * Close all published limited-slot waitlists at T-2h exactly once.
     */
    public function reconcileCutoff(?Carbon $now = null): int
    {
        $now ??= now();
        $eventIds = SuKien::query()
            ->where('trang_thai', 'PUBLISHED')
            ->where('khong_gioi_han_slot', false)
            ->whereRaw('thoi_gian_bat_dau <= ?', [$now->copy()->addHours(2)->format('Y-m-d H:i:s')])
            ->orderBy('ma_su_kien')
            ->pluck('ma_su_kien');

        $closedEvents = 0;
        foreach ($eventIds as $eventId) {
            $closed = DB::transaction(function () use ($eventId, $now) {
                $event = SuKien::query()->where('ma_su_kien', $eventId)->lockForUpdate()->first();
                if (! $event || $event->trang_thai !== 'PUBLISHED' || $event->khong_gioi_han_slot || $now->lt($event->thoi_gian_bat_dau->copy()->subHours(2))) {
                    return false;
                }

                $entries = HangDoiWaitlist::query()
                    ->where('ma_su_kien', $eventId)
                    ->whereIn('trang_thai', ['WAITING', 'OFFERED'])
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                if ($entries->isEmpty() && (int) $event->so_slot_dong_bang === 0) {
                    return false;
                }

                $expiredOffers = 0;
                $recipientIds = [];
                foreach ($entries as $entry) {
                    $recipientIds[] = (int) $entry->ma_tai_khoan;
                    if ($entry->trang_thai === 'OFFERED') {
                        $expiredOffers++;
                        $entry->trang_thai = 'EXPIRED';
                    } else {
                        $entry->trang_thai = 'CLOSED_WAITLIST';
                    }
                    $entry->save();
                }

                $event->so_ve_con_lai = (int) $event->so_ve_con_lai + (int) $event->so_slot_dong_bang + $expiredOffers;
                $event->so_slot_dong_bang = 0;
                $event->save();

                foreach (array_unique($recipientIds) as $userId) {
                    $this->notificationService->sendNotification(
                        $userId,
                        'Danh sách chờ đã đóng',
                        "Danh sách chờ sự kiện '{$event->ten_su_kien}' đã được chốt.",
                        'WAITLIST_DONG',
                        '/student/tickets'
                    );
                }

                return true;
            });

            $closedEvents += (int) $closed;
        }

        return $closedEvents;
    }

    /**
     * Release an offered slot back to the next FIFO waiter before cutoff,
     * or directly to public inventory once the T-2h cutoff has been reached.
     */
    protected function releaseSlotAfterOfferExit(SuKien $event, Carbon $now, Carbon $cutoff): void
    {
        if ($now->gte($cutoff)) {
            if (! $event->khong_gioi_han_slot) {
                $event->so_ve_con_lai = (int) $event->so_ve_con_lai + 1;
                $event->save();
            }

            return;
        }

        $this->offerNext((int) $event->ma_su_kien, $now);
    }

    /** Window is sufficient when the cutoff is exactly 15 minutes away or later. */
    public function hasMinimumOfferWindow(SuKien $event, Carbon $now): bool
    {
        return $event->thoi_gian_bat_dau->copy()->subHours(2)->diffInSeconds($now, false) <= -900;
    }

    /**
     * Read a student's active or historical waitlist entries with contract filters.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listMyEntries(User $student, array $filters = [])
    {
        $query = HangDoiWaitlist::query()
            ->with(['suKien.phongHoiTruong'])
            ->where('ma_tai_khoan', $student->ma_tai_khoan);

        if (! empty($filters['trang_thai'])) {
            $query->where('trang_thai', $filters['trang_thai']);
        } elseif (($filters['tab'] ?? null) === 'active') {
            $query->whereIn('trang_thai', ['WAITING', 'OFFERED']);
        } elseif (($filters['tab'] ?? null) === 'history') {
            $query->whereIn('trang_thai', ['ACCEPTED', 'DECLINED', 'EXPIRED', 'SKIPPED_CONFLICT', 'CLOSED_WAITLIST', 'CANCELLED']);
        }

        return $query->orderByDesc('thoi_gian_dang_ky')
            ->orderByDesc('id')
            ->paginate(min(max((int) ($filters['limit'] ?? 20), 1), 100), ['*'], 'page', max((int) ($filters['page'] ?? 1), 1));
    }

    /**
     * Non-locking schedule screening used while the event row lock is already held.
     * The student's account is locked during a claim, so their booking operations serialize.
     */
    protected function findScheduleConflict(int $userId, SuKien $event): ?DangKy
    {
        return $this->findScheduleConflictInTickets(
            DangKy::query()
                ->where('ma_tai_khoan', $userId)
                ->where('trang_thai', '!=', 'DaHuy')
                ->with(['suKien.phongHoiTruong'])
                ->get(),
            $event
        );
    }

    /** @param  iterable<DangKy>  $tickets */
    protected function findScheduleConflictInTickets(iterable $tickets, SuKien $event): ?DangKy
    {
        foreach ($tickets as $ticket) {
            $otherEvent = $ticket->suKien;
            if (! $otherEvent || $otherEvent->trang_thai === 'CANCELLED' || $otherEvent->khong_gioi_han_slot || $otherEvent->ma_su_kien === $event->ma_su_kien) {
                continue;
            }

            if ($event->thoi_gian_bat_dau->lt($otherEvent->thoi_gian_ket_thuc)
                && $event->thoi_gian_ket_thuc->gt($otherEvent->thoi_gian_bat_dau)) {
                return $ticket;
            }
        }

        return null;
    }

    protected function notifyOffer(HangDoiWaitlist $entry, SuKien $event, Carbon $deadline): void
    {
        $formattedDeadline = $deadline->copy()->setTimezone('+07:00')->format('H:i d/m/Y');
        $minutesLeft = max(1, (int) ceil(now()->diffInSeconds($deadline, false) / 60));

        $this->notificationService->sendNotification(
            (int) $entry->ma_tai_khoan,
            'Bạn nhận được suất tham dự sự kiện',
            "Suất tham dự sự kiện '{$event->ten_su_kien}' đã sẵn sàng cho bạn (còn {$minutesLeft} phút). Vui lòng xác nhận trước {$formattedDeadline} (+07:00).",
            'CLAIM_SLOT',
            '/student/tickets'
        );

        $student = User::query()->find($entry->ma_tai_khoan);
        if ($student && ! empty($student->email)) {
            DB::afterCommit(function () use ($entry, $event, $student, $deadline, $minutesLeft) {
                try {
                    Mail::to($student->email)->queue(
                        new WaitlistOfferMailable($entry, $event, $student, $deadline, $minutesLeft)
                    );
                } catch (\Throwable $e) {
                    Log::warning('Failed to queue waitlist offer email', [
                        'waitlist_id' => $entry->id,
                        'ma_tai_khoan' => $student->ma_tai_khoan,
                        'error' => $e->getMessage(),
                    ]);
                }
            });
        }
    }

    protected function notifyConflict(HangDoiWaitlist $entry, SuKien $event, DangKy $conflict): void
    {
        $this->notificationService->sendNotification(
            (int) $entry->ma_tai_khoan,
            'Không thể nhận suất tham dự',
            "Bạn đã bị bỏ qua trong hàng chờ sự kiện '{$event->ten_su_kien}' vì lịch trùng với sự kiện '{$conflict->suKien?->ten_su_kien}'.",
            'HE_THONG',
            '/student/tickets'
        );
    }

    /** @return array<string, mixed> */
    protected function conflictDetails(DangKy $conflict): array
    {
        $otherEvent = $conflict->suKien;

        return [
            'ma_su_kien' => (int) $otherEvent->ma_su_kien,
            'ten_su_kien' => (string) $otherEvent->ten_su_kien,
            'thoi_gian_bat_dau' => $otherEvent->thoi_gian_bat_dau->copy()->setTimezone('+07:00')->toIso8601String(),
            'thoi_gian_ket_thuc' => $otherEvent->thoi_gian_ket_thuc->copy()->setTimezone('+07:00')->toIso8601String(),
            'ten_phong' => (string) ($otherEvent->phongHoiTruong?->ten_phong ?? ''),
        ];
    }
}
