<?php

namespace App\Services;

use App\Models\NhatKyKiemDuyet;

class ApprovalAuditService
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Ghi nhật ký cho các thao tác kiểm duyệt sự kiện.
     */
    public function log(
        string $action,
        int $eventId,
        ?string $previousStatus,
        ?string $nextStatus,
        ?string $reason,
        int $actorUserId
    ): NhatKyKiemDuyet {
        return $this->auditLogService->logAudit(
            action: $action,
            eventId: $eventId,
            prevStatus: $previousStatus,
            nextStatus: $nextStatus,
            reason: $reason,
            actorUserId: $actorUserId
        );
    }
}
