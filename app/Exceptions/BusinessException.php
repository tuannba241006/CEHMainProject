<?php

namespace App\Exceptions;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class BusinessException extends HttpResponseException
{
    protected string $errorCode;

    protected int $statusCode;

    public function __construct(
        string $errorCode,
        string $message,
        mixed $details = null,
        int $statusCode = 400
    ) {
        $this->errorCode = $errorCode;
        $this->statusCode = $statusCode;

        $traceId = null;
        try {
            $traceId = request()?->header('X-Request-Id');
        } catch (\Throwable) {
            $traceId = null;
        }

        $payload = [
            'success' => false,
            'error' => $errorCode,
            'message' => $message,
            'trace_id' => $traceId ?: (string) Str::uuid(),
        ];

        if ($details !== null) {
            $payload['details'] = $details;
            $payload['chi_tiet'] = $details;
            if (is_array($details)) {
                $payload['errors'] = $details;
            }
        }

        $payload['server_time'] = now()->setTimezone('+07:00')->toIso8601String();

        parent::__construct(new JsonResponse($payload, $statusCode));
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
