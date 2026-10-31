<?php

namespace App\Exceptions;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;

class BusinessException extends HttpResponseException
{
    public function __construct(
        string $errorCode,
        string $message,
        mixed $details = null,
        int $statusCode = 400
    ) {
        $payload = [
            'success' => false,
            'error' => $errorCode,
            'message' => $message,
        ];

        if ($details !== null) {
            $payload['details'] = $details;
            if (is_array($details)) {
                $payload['errors'] = $details;
            }
        }

        $payload['server_time'] = now()->setTimezone('+07:00')->toIso8601String();

        parent::__construct(new JsonResponse($payload, $statusCode));
    }
}
