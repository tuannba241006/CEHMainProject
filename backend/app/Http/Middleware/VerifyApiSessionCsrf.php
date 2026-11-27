<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;

/**
 * CSRF for existing CEH hybrid API session architecture.
 * Token-only and cookie-less non-login API requests retain legacy behavior.
 * A stateful API request carrying the session cookie is never exempted.
 * Long term, migrate to Sanctum's official statefulApi() pipeline.
 */
final class VerifyApiSessionCsrf extends ValidateCsrfToken
{
    public function shouldCheck(Request $request): bool
    {
        if (in_array(strtoupper($request->method()), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return false;
        }

        // Protect anonymous login against login CSRF, including the first request.
        if ($request->is('api/auth/login', 'api/v1/auth/login')) {
            return true;
        }

        // Cookie-bearing mutations require CSRF even if Authorization is present.
        // Pure Bearer-token clients without a browser cookie remain compatible.
        return $request->cookies->has((string) config('session.cookie'));
    }

    public function handle($request, Closure $next)
    {
        return $this->shouldCheck($request)
            ? parent::handle($request, $next)
            : $next($request);
    }
}
