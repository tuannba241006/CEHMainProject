<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Standardized Success Response conforming to OpenAPI v3.2.3.
     */
    public function successResponse(
        mixed $data = null,
        ?string $message = null,
        int $code = 200,
        array $headers = []
    ): JsonResponse {
        $response = [
            'success' => true,
        ];

        if ($message !== null) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        $response['server_time'] = now()->setTimezone('+07:00')->toIso8601String();

        return response()->json($response, $code, $headers);
    }

    /**
     * Standardized Error Response conforming to OpenAPI v3.2.3.
     */
    public function errorResponse(
        string $errorCode,
        string $message,
        mixed $details = null,
        int $code = 400,
        array $headers = []
    ): JsonResponse {
        $response = [
            'success' => false,
            'error' => $errorCode,
            'message' => $message,
        ];

        if ($details !== null) {
            $response['details'] = $details;
            if (is_array($details)) {
                $response['errors'] = $details;
            }
        }

        return response()->json($response, $code, $headers);
    }
}
