<?php

return [
    // Enable only after UI integration and complete staging acceptance.
    'step_up_enabled' => filter_var(env('CEH_STEP_UP_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
    'step_up_ttl_seconds' => (int) env('CEH_STEP_UP_TTL_SECONDS', 300),
];
