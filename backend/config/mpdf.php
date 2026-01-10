<?php

return [
    /*
    |--------------------------------------------------------------------------
    | mPDF Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for mPDF library with CJK font support using Noto Sans CJK.
    |
    */

    // Temporary directory for mPDF
    'temp_dir' => storage_path('app/mpdf'),

    // Font directory where Noto Sans CJK font is installed
    'font_dir' => '/usr/share/fonts/noto-cjk',

    // Default font settings
    'default_font' => 'notosanscjk',
    'default_font_size' => 11,

    // PDF settings
    'format' => 'A4',
    'orientation' => 'P',

    // Custom font definitions for mPDF
    'font_data' => [
        'notosanscjk' => [
            'R' => 'NotoSansCJK-Regular.ttc',
            'TTCfontID' => [
                'R' => 0, // First font in TTC collection
            ],
            'useOTL' => 0xFF,
            'useKashida' => 75,
        ],
    ],

    // Auto language/font detection
    'autoScriptToLang' => true,
    'autoLangToFont' => true,

    // Mode for CJK support
    'mode' => 'utf-8',
];
