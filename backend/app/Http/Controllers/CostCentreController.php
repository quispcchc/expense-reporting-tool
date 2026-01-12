<?php

namespace App\Http\Controllers;

use App\Models\CostCentre;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CostCentreController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @throws AuthorizationException
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $this->authorize('viewAny', CostCentre::class);

        $roleLevel = $user->role->role_level;

        // Super admin sees everything
        if ($roleLevel === 1) {
            $costCentres = CostCentre::with(['activeStatus', 'department'])->get();
            return response()->json([
                'success' => true,
                'data' => $costCentres,
            ]);
        }

        // Admin only see their own department
        if ($roleLevel === 2) {
            $costCentres = CostCentre::where('department_id', $user->department_id)
                ->with(['activeStatus', 'department'])
                ->get();
            return response()->json([
                'success' => true,
                'data' => $costCentres,
            ]);
        }

        //  Approver sees only their team ? department
        $costCentres = CostCentre::where('department_id', $user->department_id)
            ->with(['activeStatus', 'department'])
            ->get();
        return response()->json([
            'success' => true,
            'data' => $costCentres,
        ]);

    }

    /**
     * Store a newly created resource in storage.
     *
     * @throws AuthorizationException
     */
    public function store(Request $request)
    {
        // // Check if current user has correct right to create CostCentre instance
        $this->authorize('create', new CostCentre($request->all()));

        // Validate request data
        $validated = $request->validate([
            'department_id' => 'required|integer|exists:departments,department_id',
            'cost_centre_code' => 'required|integer|unique:cost_centres,cost_centre_code',
            'description' => 'nullable|string|max:100',
            'active_status_id' => 'required|integer|exists:active_status,active_status_id',
        ], [
            'cost_centre_code.unique' => 'The cost centre code already exists. Please use a different one.',
        ]);

        // Create the record with validated data and eager load relations
        $costCentre = CostCentre::create($validated);
        $costCentre->load(['activeStatus', 'department']);

        return response()->json([
            'success' => true,
            'message' => 'Cost Centre created successfully.',
            'data' => $costCentre,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $costCentre = CostCentre::with(['activeStatus', 'department', 'expenses'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $costCentre,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @throws AuthorizationException
     */
    public function update(Request $request, $id)
    {
        // Check if current user has correct right to update CostCentre instance
        $this->authorize('update', new CostCentre($request->all()));

        // Find the CostCentre instance in database
        $costCentre = CostCentre::findOrFail($id);

        // Validate request data
        $validated = $request->validate([
            'department_id' => 'sometimes|required|integer|exists:departments,department_id',
            'cost_centre_code' => ['required', 'integer', Rule::unique('cost_centres', 'cost_centre_code')->ignore($costCentre->cost_centre_id, 'cost_centre_id')],
            'description' => 'required|string|max:100',
            'active_status_id' => 'sometimes|required|integer|exists:active_status,active_status_id',
        ], [
            'cost_centre_code.unique' => 'The cost centre code already exists. Please use a different one.',
        ]);

        // Update the record with validated data and eager load relations
        $costCentre->update($validated);
        $costCentre->load(['activeStatus', 'department']);

        return response()->json([
            'success' => true,
            'message' => 'Cost Centre updated successfully.',
            'data' => $costCentre,
        ]);

    }

    /**
     * Remove the specified resource from storage.
     *
     * @throws AuthorizationException
     */
    public function destroy(Request $request, $id): \Illuminate\Http\JsonResponse
    {
        // Find the CostCentre instance in database
        $costCentre = CostCentre::findOrFail($id);

        // Check if current user has correct right to delete CostCentre instance
        $this->authorize('delete', $costCentre);

        // Delete the record in database
        $costCentre->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cost Centre deleted successfully.',
        ]);
    }
}
