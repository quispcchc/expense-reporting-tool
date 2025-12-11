<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    protected $expenseService;

    public function __construct(ExpenseService $expenseService)
    {
        $this->expenseService = $expenseService;
    }

    public function index(Request $request)
    {
        return response()->json(Expense::all());
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
