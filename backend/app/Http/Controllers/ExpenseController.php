<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ExpenseController extends Controller
{
    protected $expenseService;

    public function __construct(ExpenseService $expenseService)
    {
        $this->expenseService = $expenseService;
    }

    public function index()
    {
        return response()->json(Expense::all());
    }

    public function update(Request $request, $id)
    {
        Log::info('=== EXPENSE UPDATE REQUEST ===');
        Log::info('Request method: '.$request->method());
        Log::info('Request content type: '.$request->header('Content-Type'));
        Log::info('All request data: ', $request->all());
        Log::info('deleteAttachment value: '.$request->input('deleteAttachment', 'NOT SET'));
        Log::info('deleteAttachment type: '.gettype($request->input('deleteAttachment')));
        Log::info('deleteReceiptIds value: '.($request->input('deleteReceiptIds') ?? 'NOT SET'));
        $dIds = $request->input('deleteReceiptIds');
        Log::info('deleteReceiptIds type: '.(is_array($dIds) ? 'array' : gettype($dIds)));

        $validated = $request->validate([
            'transaction_date' => 'nullable|date',
            'account_number_id' => 'nullable|integer|exists:account_numbers,account_number_id',
            'buyer_name' => 'nullable|string',
            'vendor_name' => 'sometimes|string',
            'transaction_desc' => 'nullable|string',
            'transaction_notes' => 'nullable|string',
            'expense_amount' => 'nullable|numeric|min:0',
            'project_id' => 'nullable|integer|exists:projects,project_id',
            'files' => 'nullable|array',  // Accept multiple files
            'files.*' => 'file|max:5120|mimes:jpg,jpeg,png,pdf',
            'cost_centre_id' => 'nullable|integer',
            'tags' => 'nullable|string',
            'deleteAttachment' => 'nullable',
            'deleteReceiptIds' => 'nullable',  // Accept both string and array
        ]);

        // Ensure uploaded files are read from request and passed along
        $payload = $validated;
        $payload['files'] = $request->file('files') ?? [];

        // Read deleteReceiptIds directly from request (validation may strip it)
        $deleteIdsInput = $request->input('deleteReceiptIds', $payload['deleteReceiptIds'] ?? null);
        Log::info('RAW deleteReceiptIds from request: '.print_r($deleteIdsInput, true));

        // Normalize deleteReceiptIds to comma string if array
        if (is_array($deleteIdsInput)) {
            $deleteIdsInput = implode(',', array_map('trim', $deleteIdsInput));
        }
        $payload['deleteReceiptIds'] = $deleteIdsInput;
        Log::info('Normalized payload.deleteReceiptIds: '.($payload['deleteReceiptIds'] ?? 'NULL'));
        $payload['deleteAttachment'] = $request->input('deleteAttachment', $payload['deleteAttachment'] ?? null);

        Log::info('Validated data (sanitized). files count: '.(is_array($payload['files']) ? count($payload['files']) : 0));

        $updatedExpense = $this->expenseService->updateExpense($payload, $id);

        return response()->json($updatedExpense);

    }

    public function approveExpense(int $expenseId)
    {
        $this->expenseService->approveExpense($expenseId);
    }

    public function rejectExpense(int $expenseId)
    {
        $this->expenseService->rejectExpense($expenseId);
    }

    public function destroy($id)
    {
        $this->expenseService->deleteExpense($id);

        return response()->noContent();
    }
}
