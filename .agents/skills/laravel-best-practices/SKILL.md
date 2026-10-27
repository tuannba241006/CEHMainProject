---
name: laravel-best-practices
description: "Laravel 12 and PHP 8.2+ architectural standards, Eloquent ORM patterns, pessimistic locking, FormRequest validation, unified API envelope, Sanctum authentication, and background task processing."
when_to_use: "Use when developing backend logic, designing API endpoints, handling database transactions with pessimistic locks, implementing authentication or background queues in PHP Laravel."
allowed-tools: Read, Bash, Grep, Glob, Edit, Write
version: 1.0.0
effort: medium
---

# Laravel 12 & PHP 8.2+ Best Practices

> **Guiding Principle:** Write clean, expressive, maintainable, and robust Laravel code adhering to modern PHP 8.2+ standards (typed properties, readonly classes, enums, match expressions) and Laravel 12 architectural conventions.

---

## 🏛️ 1. Architecture & Layer Separation

### Avoid Fat Controllers & Fat Models
- **Controllers:** Sole responsibility is HTTP transport (receiving request, delegating to Service/Action, returning API Resource).
- **Form Requests:** Sole responsibility is validation and authorization.
- **Services / Actions:** Encapsulate business logic, database transactions, domain rules, and external integrations.
- **Eloquent Models:** Represent database schema, relationships, scopes, and casts. Do not put orchestration logic here.

```
Request ──> Middleware ──> FormRequest ──> Controller ──> Action/Service ──> Eloquent Model
                                                              │
                                                        API Resource <── Response
```

---

## 🔒 2. Transactions & Pessimistic Locking (High Concurrency)

When dealing with contested resources (ticket inventory, waitlist allocations, room reservations):
1. **Always use Database Transactions** with automatic rollback:
   ```php
   use Illuminate\Support\Facades\DB;

   DB::transaction(function () use ($eventId, $userId) {
       // Lock row explicitly to prevent race conditions
       $event = Event::where('id', $eventId)->lockForUpdate()->firstOrFail();
       
       if ($event->remaining_tickets <= 0) {
           throw new \App\Exceptions\SoldOutException('Hết vé.');
       }
       
       $event->decrement('remaining_tickets');
       
       return Registration::create([
           'event_id' => $eventId,
           'user_id' => $userId,
           'status' => 'REGISTERED'
       ]);
   });
   ```

2. **Deadlock-Free Lock Ordering Invariant:**
   Whenever multiple tables are locked within a transaction, lock rows in strict hierarchical order:
   $$\mathbf{tai\_khoan} \longrightarrow \mathbf{phong\_hoi\_truong} \longrightarrow \mathbf{dat\_phong} \longrightarrow \mathbf{su\_kien} \longrightarrow \mathbf{dang\_ky} \longrightarrow \mathbf{hang\_doi\_waitlist}$$

---

## 🛡️ 3. Request Validation & Security

- **Strict Form Requests:** Always isolate validation rules into dedicated `FormRequest` classes (`app/Http/Requests/*`).
- **Authorization Gate:** Utilize the `authorize()` method or Laravel Policies.
- **Mass Assignment:** Explicitly define `$fillable` or use `Model::shouldBeStrict()`.
- **Sanctum Authentication:**
  - Utilize Laravel Sanctum for SPA / Mobile authentication.
  - Enforce Single Active Session and HttpOnly cookies for web browsers.

---

## 📦 4. Unified API Response Envelope

All API responses returned to the client MUST conform to the standard envelope:

```json
// Success Response (HTTP 200, 201)
{
  "success": true,
  "data": { ... },
  "message": "Thao tác thành công"
}

// Error Response (HTTP 400, 401, 403, 404, 409, 422, 500)
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_SNAKE_CASE",
    "details": { ... }
  },
  "message": "Mô tả lỗi thân thiện với người dùng"
}
```

Implement via Laravel **API Resources** (`app/Http/Resources/*`):
```php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->tieu_de,
            'status' => $this->trang_thai,
            'remaining_tickets' => $this->so_ve_con_lai,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```

---

## ⚡ 5. Background Tasks & Queues

- Defer time-consuming operations (sending email notifications, generating QR tokens, issuing PDF certificates) to Queues (`app/Jobs/*`).
- Use database or Redis queue drivers.
- Implement `ShouldQueue` interface and handle retry limits (`$tries = 3`).
- Schedule periodic cron jobs using Laravel Scheduler (`routes/console.php` in Laravel 12).

---

## 🧪 6. Testing Standards (Pest / PHPUnit)

- **Test Integrity:** Respect the 2-Layer Test Integrity rule. Never weaken assertions during bug fixes.
- **Database Isolation:** Use `RefreshDatabase` trait for integration tests.
- **Multi-user Concurrency Simulation:** Test race conditions by simulating distinct user sessions/tokens competing for limited slots.
