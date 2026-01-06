<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $validated = $request->validate([
            'transaction_date' => 'nullable|date',
            'account_number_id' => 'nullable|integer|exists:account_numbers,account_number_id',
            'buyer_name' => 'nullable|string',
            'vendor_name' => 'sometimes|string',
            'transaction_desc' => 'nullable|string',
            'transaction_notes' => 'nullable|string',
            'expense_amount' => 'nullable|numeric|min:0',
            'project_id' => 'nullable|integer|exists:projects,project_id',
            'file' => 'nullable|file|max:5120|mimes:jpg,jpeg,png,pdf',
            'cost_centre_id' => 'nullable|integer',

            'tags' => 'nullable|string',
            ]);


        $updatedExpense = $this->expenseService->updateExpense($validated, $id);
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


}
