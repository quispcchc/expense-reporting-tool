<?php
namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index (Request $request)
    {
        $user = $request->user();

        return response()->json(Expense::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'claim_id' => 'required|integer|exists:claim,claim_id',
            'buyer_name' => 'required|string',
            'vendor_name' => 'required|string',
            'transaction_date' => 'required|date',
            'transaction_desc' => 'nullable|string',
            'expense_amount' => 'required|numeric',
            'receipt_id' => 'nullable|integer',
            'tag_id' => 'nullable|integer',
            'approval_status_id' => 'required|integer',
            'mileage_id' => 'nullable|integer',
            'team_id' => 'nullable|integer',
            'project_id' => 'nullable|integer',
            'cost_centre_id' => 'nullable|integer',
        ]);

        $expense = Expense::create($validated);

        return response()->json(['message' => 'Expense added', 'expense' => $expense]);
    }
}
