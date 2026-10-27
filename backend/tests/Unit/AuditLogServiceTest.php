<?php

namespace Tests\Unit;

use App\Models\NhatKyKiemDuyet;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use InvalidArgumentException;
use Tests\TestCase;

class AuditLogServiceTest extends TestCase
{
    use DatabaseTransactions;

    protected AuditLogService $auditLogService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->auditLogService = new AuditLogService;
    }

    public function test_log_audit_throws_exception_when_no_target_provided(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Nhật ký kiểm duyệt bắt buộc phải gắn với ít nhất một đối tượng mục tiêu');

        $this->auditLogService->logAudit('SUBMIT', null, null, null);
    }

    public function test_log_audit_requires_reason_for_certain_actions(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Hành động 'CANCEL_EVENT' bắt buộc phải cung cấp lý do.");

        $this->auditLogService->logAudit('CANCEL_EVENT', eventId: 1, reason: '');
    }

    public function test_log_audit_requires_min_10_chars_for_reject_faculty(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Hành động 'REJECT_FACULTY' bắt buộc phải cung cấp lý do tối thiểu 10 ký tự.");

        $this->auditLogService->logAudit('REJECT_FACULTY', eventId: 1, reason: 'Quá ngắn');
    }

    public function test_log_audit_requires_min_10_chars_for_reject_admin(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Hành động 'REJECT_ADMIN' bắt buộc phải cung cấp lý do tối thiểu 10 ký tự.");

        $this->auditLogService->logAudit('REJECT_ADMIN', eventId: 1, reason: 'K hợp lệ');
    }

    public function test_log_audit_success(): void
    {
        $admin = User::where('loai_tai_khoan', 'Admin')->first();
        $this->assertNotNull($admin, 'Admin user must exist from database seeding.');
        $this->actingAs($admin);

        $log = $this->auditLogService->logAudit(
            action: 'REJECT_ADMIN',
            eventId: null,
            regId: null,
            targetUserId: $admin->ma_tai_khoan,
            prevStatus: 'ACTIVE',
            nextStatus: 'REJECTED',
            reason: 'Lý do từ chối hợp lệ và có độ dài trên 10 ký tự.'
        );

        $this->assertInstanceOf(NhatKyKiemDuyet::class, $log);
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'id' => $log->id,
            'hanh_dong' => 'REJECT_ADMIN',
            'nguoi_thuc_hien' => $admin->ma_tai_khoan,
            'ma_tai_khoan_muc_tieu' => $admin->ma_tai_khoan,
        ]);
    }
}
