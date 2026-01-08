<?php

return [

    // Apply CORS to every route to avoid missing headers on auth endpoints
    'paths' => ['*'],

    // Allow all HTTP verbs from the SPA during development
    'allowed_methods' => ['*'],

    // Explicitly allow local dev origins; expand if frontend host changes
    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    // Pattern to catch any localhost port if needed for previews
    'allowed_origins_patterns' => ['#^http://localhost(:\\d+)?$#', '#^http://127\\.0\\.0\\.1(:\\d+)?$#'],

    'allowed_headers' => ['*'],

    // Expose Authorization so the client can read it when present
    'exposed_headers' => ['Authorization'],

    // Cache preflight responses for 1 day
    'max_age' => 86400,

    // We use Bearer tokens so credentials can stay disabled
    'supports_credentials' => false,
];
