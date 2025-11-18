<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\Expense;
use App\Models\Mileage;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ClaimController extends Controller
{
    // Get all claims
    public function index(Request $request)
    {
        $user = $request->user();
//
//        if ($user->role_level > 3) {
//            $claims = Claim::where('user_id', $user->user_id)->with('expenses')->get();
//            return response()->json($claims);
//        }
//
//        if ($user->role_level > 2) {
//            $claims = Claim::where('department_id', $user->department_id)->with('expenses')->get();
//            return response()->json($claims);
//        }

        return response()->json(Claim::with(['expenses', 'claimType'])->get());
    }

    /**
     * Store a new claim with optional expenses and mileage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // claim form validation
            'position_id' => 'required|integer|exists:position,position_id',
            'claim_type_id' => 'required|integer|exists:claim_type,claim_type_id',
            'department_id' => 'required|integer|exists:department,department_id',
            'claim_notes' => 'nullable|string',
            'total_amount' => 'required|numeric|min:2',

            // expense item validation
            'expenses' => 'required|array',
            'expenses.*.transaction_date' => 'required_with:expenses|date',
            'expenses.*.buyer_name' => 'required_with:expenses|string',
            'expenses.*.vendor_name' => 'required_with:expenses|string',
            'expenses.*.transaction_desc' => 'required_with:expenses|string',
            'expenses.*.expense_amount' => 'required_with:expenses|integer',
            'expenses.*.project_id' => 'required_with:expenses|integer|exists:project,project_id',
            'expenses.*.file' => 'nullable|file|max:5120|mimes:jpg,jpeg,png,pdf',
            'expenses.*.tag_id' => 'nullable|integer',
            'expenses.*.team_id' => 'required_with:expenses|integer|exists:team,team_id',
            'expenses.*.cost_centre_id' => 'required_with:expenses|integer',

            'mileage' => 'nullable|array',
        ]);

        DB::beginTransaction();

        try {
            // Create Claim
            $claim = Claim::create([
                'user_id' => $request->user()->user_id,
                'position_id' => $validated['position_id'],
                'claim_type_id' => $validated['claim_type_id'],
                'department_id' => $validated['department_id'],
                'claim_notes' => $validated['claim_notes'] ?? null,
                'total_amount' => $validated['total_amount'],
                'claim_submitted' => now(),
                'claim_status_id' => 3,  // default claim status: Pending
            ]);

            if (isset($validated['expenses']) && is_array($validated['expenses'])) {
                foreach ($validated['expenses'] as $index => $expenseData) {

                    $expenseData['claim_id'] = $claim->claim_id;
                    $expenseData['approval_status_id'] = 1; // default expense status: Pending

                    // Handle file upload for this expense
                    if ($request->hasFile("expenses.{$index}.file")) {
                        $file = $request->file("expenses.{$index}.file");
                        $path = $file->store('receipts', 'public');

                        $receipt = Receipt::create([
                            'receipt_path' => $path,
                            'receipt_name' => $file->getClientOriginalName(),
                            'receipt_desc' => $file->getClientMimeType(),
                        ]);
                        $expenseData['receipt_id'] = $receipt->receipt_id;
                    }

                    unset($expenseData['file']);


                    Expense::create($expenseData);
                }
            }

            // Save mileage if provided
            if (isset($validated['mileage'])) {
                $mileage = Mileage::create($validated['mileage']);
                $claim->update(['mileage_id' => $mileage->mileage_id]);
            }

            DB::commit();

            return response()->json(['message' => 'Claim submitted successfully', 'claim_id' => $claim->claim_id, 'claims' => $claim->load('expenses')], 201);

        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('Error creating claim: ' . $e->getMessage());

            return response()->json(['error' => $e->getMessage()]);
        }
    }


}
