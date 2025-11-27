<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClaimRequest;
use App\Http\Resources\ClaimResource;
use App\Models\Claim;
use App\Models\ClaimNote;
use App\Models\Expense;
use App\Models\Mileage;
use App\Models\Receipt;
use App\Models\User;
use App\Services\ClaimService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ClaimController extends Controller
{

    protected $claimService;

    public function __construct(ClaimService $claimService)
    {
        $this->claimService = $claimService;
    }

    /**
     * Get a single claim
     */
    public function show($claimId)
    {
        $claim = Claim::with(['expenses.tags', 'claimType', 'status', 'position', 'user', 'department', 'team', 'claimNotes.user'])
            ->where('claim_id', $claimId)
            ->first();


        return response()->json($claim);
    }

    /**
     * Get all claims according to role level
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $role_level = $user->role->role_level;

        $query = Claim::with(['expenses', 'claimType', 'department', 'team', 'status']);

        if ($role_level === 2) {
            // Department-level access
            $query->where('department_id', $user->department_id);
        } elseif ($role_level === 3) {
            // Team-level access or own claims
            $query->where('team_id', $user->team_id)
                ->orWhere('user_id', $user->user_id);
        } elseif ($role_level === 4) {
            // User-level access
            $query->where('user_id', $user->user_id);
        }
        // else role_level 1 or super admin sees all claims

        $claims = $query->get();

        return response()->json($claims);
    }


    /**
     * Store a new claim with optional expenses and mileage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // claim form validation
            'position_id' => 'required|integer|exists:positions,position_id',
            'claim_type_id' => 'required|integer|exists:claim_types,claim_type_id',
            'department_id' => 'required|integer|exists:departments,department_id',
            'team_id' => 'required|integer|exists:teams,team_id',
            'claim_notes' => 'nullable|string',
            'total_amount' => 'required|numeric|min:2',

            // expense item validation
            'expenses' => 'required|array',
            'expenses.*.transaction_date' => 'required_with:expenses|date',
            'expenses.*.account_number_id' => 'required_with:expense|integer|exists:account_numbers,account_number_id',
            'expenses.*.buyer_name' => 'required_with:expenses|string',
            'expenses.*.vendor_name' => 'required_with:expenses|string',
            'expenses.*.transaction_desc' => 'nullable|string',
            'expenses.*.transaction_notes' => 'nullable|string',
            'expenses.*.expense_amount' => 'required_with:expenses|integer',
            'expenses.*.project_id' => 'required_with:expenses|integer|exists:projects,project_id',
            'expenses.*.file' => 'nullable|file|max:5120|mimes:jpg,jpeg,png,pdf',
            'expenses.*.cost_centre_id' => 'required_with:expenses|integer',
            'expenses.*.tags' => 'nullable|string',


            'mileage' => 'nullable|array',
        ]);

        try {
            $claim = $this->claimService->createClaim($validated, $request->user());

            return response()->json([
                'message' => 'Claim submitted successfully',
                'claim' => $claim
            ], 201);

        } catch (\Throwable $e) {
            \Log::error('Error creating claim: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request) {

    }


}
