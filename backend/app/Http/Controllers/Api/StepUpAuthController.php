<?php

namespace App\Http\Controllers\Api;

use App\Support\StepUpProof;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

/** Re-authentication for sensitive admin/organizer actions. Not an MFA factor. */
final class StepUpAuthController
{
    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate(['mat_khau' => ['required', 'string', 'max:255']]);
        $user = $request->user();

        // A bearer token alone does not qualify: require a real browser session.
        if (! $user || ! $request->hasSession() || ! Auth::guard('web')->check()
            || (string) Auth::guard('web')->id() !== (string) $user->getAuthIdentifier()) {
            return response()->json(['success' => false, 'error' => 'SESSION_REQUIRED'], 403);
        }
        $key = 'stepup:'.$user->getAuthIdentifier().'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json(['success' => false, 'error' => 'RATE_LIMIT_EXCEEDED'], 429, ['Retry-After' => $seconds]);
        }
        if (! Hash::check($data['mat_khau'], $user->mat_khau)) {
            RateLimiter::hit($key, 60);

            return response()->json(['success' => false, 'error' => 'INVALID_CREDENTIALS'], 401);
        }
        RateLimiter::clear($key);
        $ttl = max(60, min(600, (int) config('ceh_security.step_up_ttl_seconds', 300)));
        $request->session()->put('ceh_step_up_user_id', (string) $user->getAuthIdentifier());
        $request->session()->put('ceh_step_up_expires_at', now()->timestamp + $ttl);
        $request->session()->put(StepUpProof::FINGERPRINT_KEY, StepUpProof::fingerprint($user));

        return response()->json(['success' => true, 'message' => 'Xác thực lại thành công.', 'expires_in_seconds' => $ttl]);
    }
}
