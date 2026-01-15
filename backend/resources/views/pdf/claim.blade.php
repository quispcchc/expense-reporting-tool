<!DOCTYPE html>
<html lang="ko">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Volunteer Expense Claim - {{ optional($claim)->claim_id ?? 'Report' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'notosanscjk', 'DejaVu Sans', sans-serif;
            color: #333;
            line-height: 1.4;
            font-size: 11px;
        }

        .container {
            margin: 20px;
            max-width: 900px;
        }

        .header {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 2px solid #5b6eb0;
            padding-bottom: 10px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: top;
            border: none;
            padding: 0;
        }

        .header-left-cell {
            width: 70%;
            text-align: left;
        }

        .header-right-cell {
            width: 30%;
            text-align: right;
            vertical-align: top;
        }

        .header-logo {
            max-width: 180px;
            max-height: 50px;
        }

        .header h1 {
            margin: 0 0 3px 0;
            font-size: 14px;
            font-weight: bold;
            color: #5b6eb0;
        }

        .header h2 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #666;
            font-weight: normal;
        }

        .header p {
            margin: 3px 0;
            font-size: 10px;
        }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            border-bottom: 1px solid #333;
            padding: 8px 0 5px 0;
            margin-top: 12px;
            margin-bottom: 8px;
        }

        .info-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .info-grid tr {
            page-break-inside: avoid;
        }

        .info-grid td {
            padding: 6px 8px;
            border: 1px solid #ddd;
            font-size: 10px;
        }

        .info-grid td:nth-child(odd) {
            background-color: #f9f9f9;
        }

        .label {
            font-weight: bold;
            width: 30%;
        }

        .expense-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #ddd;
            margin-bottom: 12px;
            font-size: 9px;
        }

        .expense-table thead {
            background-color: #e8e8e8;
        }

        .expense-table th {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
            font-weight: bold;
            font-size: 9px;
        }

        .expense-table td {
            border: 1px solid #ddd;
            padding: 5px 6px;
            font-size: 9px;
        }

        .expense-table tr {
            page-break-inside: avoid;
        }

        .attachment-section {
            margin-top: 20px;
            page-break-inside: avoid;
        }

        .attachment-container {
            text-align: center;
            margin: 10px 0;
        }

        .receipt-image {
            max-width: 300px;
            max-height: 400px;
            margin: 10px auto;
            border: 1px solid #ddd;
            padding: 5px;
            display: block;
        }

        .receipt-label {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #666;
        }

        .notes-section {
            border: 1px solid #ddd;
            padding: 8px;
            min-height: 40px;
            background-color: #fafafa;
            margin-bottom: 12px;
            font-size: 9px;
        }

        .note-item {
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px solid #eee;
            page-break-inside: avoid;
        }

        .note-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .note-header {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 2px;
        }

        .note-text {
            margin: 2px 0 0 0;
            font-size: 9px;
        }

        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }

        .signature-table td {
            text-align: center;
            vertical-align: bottom;
            border: none;
            padding: 0 20px;
        }

        .sig-underline {
            border-bottom: 1px solid #000;
            height: 40px;
            margin-bottom: 5px;
        }

        .sig-label {
            font-size: 10px;
            color: #5b6eb0;
            margin-bottom: 20px;
        }

        .date-line {
            border-bottom: 1px solid #000;
            height: 25px;
            margin-bottom: 5px;
        }

        .date-text {
            font-size: 9px;
            color: #666;
        }

        .amount {
            text-align: right;
        }

        .status-badge {
            display: inline-block;
            padding: 2px 5px;
            border-radius: 2px;
            font-size: 8px;
            font-weight: bold;
        }

        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }

        .status-approved {
            background-color: #d4edda;
            color: #155724;
        }

        .status-rejected {
            background-color: #f8d7da;
            color: #721c24;
        }

        .total-row {
            background-color: #e8e8e8;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- ===== HEADER ===== -->
        <div class="header">
            <table class="header-table">
                <tr>
                    <td class="header-left-cell">
                        <h1>Carlington Community Health Centre</h1>
                        <h2>Volunteer Expense Claim Report</h2>
                        <p><strong>Request Number:</strong> {{ optional($claim)->claim_id ?? 'N/A' }}</p>
                    </td>
                    <td class="header-right-cell">
                        @php
                            $logoPath = storage_path('app/public/assets/carlington-logo.png');
                        @endphp
                        @if(file_exists($logoPath))
                            <img src="{{ $logoPath }}" class="header-logo" alt="Carlington Logo">
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <!-- ===== CLAIM INFORMATION SECTION ===== -->
        <div class="section-title">CLAIM INFORMATION</div>
        <table class="info-grid">
            <tr>
                <td class="label">Claim ID:</td>
                <td>{{ optional($claim)->claim_id ?? 'N/A' }}</td>
                <td class="label">Status:</td>
                <td>
                    @php
                        $statusId = optional($claim)->claim_status_id ?? 0;
                        $statusText = optional($claim->status)->claim_status_name ?? 'Unknown';
                        $statusClass = $statusId === 1 ? 'pending' : ($statusId === 2 ? 'approved' : ($statusId === 3 ? 'rejected' : 'unknown'));
                    @endphp
                    <span class="status-badge status-{{ $statusClass }}">{{ $statusText }}</span>
                </td>
            </tr>
            <tr>
                <td class="label">Claim Type:</td>
                <td>{{ optional($claim->claimType)->claim_type_name ?? 'N/A' }}</td>
                <td class="label">Submitted Date:</td>
                <td>{{ optional($claim)->created_at ? optional($claim)->created_at->format('Y-m-d') : 'N/A' }}</td>
            </tr>
        </table>

        <!-- ===== EMPLOYEE INFORMATION SECTION ===== -->
        <div class="section-title">EMPLOYEE INFORMATION</div>
        <table class="info-grid">
            <tr>
                <td class="label">Employee Name:</td>
                <td>{{ optional($claim->user)->first_name ?? 'N/A' }}
                    {{ optional($claim->user)->last_name ?? '' }}
                </td>
                <td class="label">Position:</td>
                <td>{{ optional($claim->position)->position_name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Department:</td>
                <td>{{ optional($claim->department)->department_name ?? 'N/A' }}</td>
                <td class="label">Team:</td>
                <td>{{ optional($claim->team)->team_name ?? 'N/A' }}</td>
            </tr>
        </table>

        <!-- ===== EXPENSES SUMMARY TABLE ===== -->
        <div class="section-title">EXPENSES SUMMARY</div>
        <table class="expense-table">
            <thead>
                <tr>
                    <th style="width: 7%;">ID</th>
                    <th style="width: 10%;">Date</th>
                    <th style="width: 13%;">Vendor</th>
                    <th style="width: 13%;">Description</th>
                    <th style="width: 10%;">Account</th>
                    <th style="width: 11%;">Cost Centre</th>
                    <th style="width: 10%;" class="amount">Amount</th>
                    <th style="width: 9%;">Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse(optional($claim)->expenses ?? [] as $expense)
                    <tr>
                        <td>{{ optional($expense)->expense_id ?? '' }}</td>
                        <td>{{ optional($expense)->transaction_date ?? 'N/A' }}</td>
                        <td>{{ optional($expense)->vendor_name ?? 'N/A' }}</td>
                        <td>{{ Str::limit(optional($expense)->transaction_desc ?? '', 20) ?? 'N/A' }}</td>
                        <td>{{ optional($expense->accountNumber)->account_number ?? 'N/A' }}</td>
                        <td>{{ optional($expense->costCentre)->cost_centre_code ?? 'N/A' }}</td>
                        <td class="amount">${{ number_format(optional($expense)->expense_amount ?? 0, 2) }}</td>
                        <td>
                            @php
                                $expStatus = optional($expense)->approval_status_id ?? 0;
                                $expStatusText = $expStatus === 1 ? 'Pending' : ($expStatus === 2 ? 'Approved' : ($expStatus === 3 ? 'Rejected' : 'Unknown'));
                                $expStatusClass = $expStatus === 1 ? 'pending' : ($expStatus === 2 ? 'approved' : 'rejected');
                            @endphp
                            <span class="status-badge status-{{ $expStatusClass }}">{{ $expStatusText }}</span>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 12px;">No expenses found</td>
                    </tr>
                @endforelse
                @if(optional($claim)->expenses && count(optional($claim)->expenses) > 0)
                    <tr class="total-row">
                        <td colspan="6" style="text-align: right; padding-right: 8px;">TOTAL</td>
                        <td class="amount">${{ number_format(optional($claim)->expenses->sum('expense_amount') ?? 0, 2) }}
                        </td>
                        <td></td>
                    </tr>
                @endif
            </tbody>
        </table>

        <!-- ===== NOTES SECTION ===== -->
        <div class="section-title">CLAIM NOTES</div>
        <div class="notes-section">
            @forelse(optional($claim)->notes ?? [] as $note)
                <div class="note-item">
                    <div class="note-header">{{ optional($note->user)->first_name ?? 'Unknown' }}
                        {{ optional($note->user)->last_name ?? '' }}
                        ({{ optional($note)->created_at ? optional($note)->created_at->format('Y-m-d H:i') : 'N/A' }}):
                    </div>
                    <div class="note-text">{{ optional($note)->claim_note_text ?? 'N/A' }}</div>
                </div>
            @empty
                <p style="color: #999; font-size: 9px;">No notes available</p>
            @endforelse
        </div>

        <!-- ===== SIGNATURE SECTION ===== -->
        <div style="margin-top: 15px; page-break-inside: avoid;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 40%; text-align: center; vertical-align: bottom; padding: 0 10px;">
                        <hr style="border: none; border-top: 1px solid #000; margin-bottom: 5px;">
                        <div style="font-size: 10px; margin-bottom: 25px;">Employee Signature</div>
                        <hr style="border: none; border-top: 1px solid #000; margin-bottom: 5px;">
                        <div style="font-size: 9px;">Date</div>
                    </td>
                    <td style="width: 20%;"></td>
                    <td style="width: 40%; text-align: center; vertical-align: bottom; padding: 0 10px;">
                        <hr style="border: none; border-top: 1px solid #000; margin-bottom: 5px;">
                        <div style="font-size: 10px; margin-bottom: 25px;">Authorized Supervisor</div>
                        <hr style="border: none; border-top: 1px solid #000; margin-bottom: 5px;">
                        <div style="font-size: 9px;">Date</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- ===== ATTACHMENTS SECTION ===== -->
        @php
            $hasReceipts = false;
            if (optional($claim)->expenses) {
                foreach (optional($claim)->expenses as $expense) {
                    if (optional($expense)->receipts && count(optional($expense)->receipts) > 0) {
                        $hasReceipts = true;
                        break;
                    }
                }
            }
        @endphp

        @if($hasReceipts)
            <div class="attachment-section">
                <div class="section-title">ATTACHMENT(S)</div>
                @foreach(optional($claim)->expenses ?? [] as $expense)
                    @if(optional($expense)->receipts && count(optional($expense)->receipts) > 0)
                        @foreach(optional($expense)->receipts as $receipt)
                            <div class="attachment-container">
                                <div class="receipt-label" style="text-align: center;">
                                    Expense #{{ optional($expense)->expense_id ?? 'N/A' }} -
                                    {{ optional($expense)->vendor_name ?? 'N/A' }}
                                </div>
                                @if(optional($receipt)->receipt_path)
                                    @php
                                        $imagePath = storage_path('app/public/' . optional($receipt)->receipt_path);
                                        $imageExists = file_exists($imagePath) && is_file($imagePath);
                                    @endphp
                                    @if($imageExists)
                                        <img src="{{ $imagePath }}" class="receipt-image" alt="Receipt">
                                    @else
                                        <p style="color: #999; font-size: 9px; text-align: center;">Receipt file not found at: {{ $imagePath }}</p>
                                    @endif
                                @else
                                    <p style="color: #999; font-size: 9px; text-align: center;">No receipt file path available</p>
                                @endif
                            </div>
                        @endforeach
                    @endif
                @endforeach
            </div>
        @endif
    </div>
</body>

</html>