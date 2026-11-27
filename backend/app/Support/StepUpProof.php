<?php

namespace App\Support;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;

/** A short-lived session proof bound to the current password hash. */
final class StepUpProof
{
    public const FINGERPRINT_KEY = 'ceh_step_up_credential_fingerprint';

    public static function fingerprint(Authenticatable $user): string
    {
        // Server-keyed digest: never persist the raw password or its hash in session.
        return hash_hmac('sha256', (string) $user->getAuthPassword(), (string) config('app.key'));
    }

    public static function forget(Request $request): void
    {
        if ($request->hasSession()) {
            $request->session()->forget([
                'ceh_step_up_user_id',
                'ceh_step_up_expires_at',
                self::FINGERPRINT_KEY,
            ]);
        }
    }
}
