<?php

namespace App\Http\Controllers;

use App\Models\CostCentre;
use Illuminate\Http\Request;

class CostCentreController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $costCentres = CostCentre::with(['activeStatus', 'team'])->get();

        return response()->json([
            'success' => true,
            'data' => $costCentres
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'team_id' => 'required|integer|exists:team,team_id',
            'cost_centre_code' => 'required|string|max:50',
            'description' => 'nullable|string|max:100',
            'active_status_id' => 'required|integer|exists:active_status,active_status_id',
        ]);

        $costCentre = CostCentre::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cost Centre created successfully.',
            'data' => $costCentre
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $costCentre = CostCentre::with(['activeStatus', 'team', 'expenses'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $costCentre
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $costCentre = CostCentre::findOrFail($id);

        $validated = $request->validate([
            'team_id' => 'sometimes|required|integer|exists:team,team_id',
            'cost_centre_code' => 'sometimes|required|string|max:50',
            'description' => 'nullable|string|max:100',
            'active_status_id' => 'sometimes|required|integer|exists:active_status,active_status_id',
        ]);

        $costCentre->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cost Centre updated successfully.',
            'data' => $costCentre
        ]);

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $costCentre = CostCentre::findOrFail($id);
        $costCentre->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cost Centre deleted successfully.'
        ]);
    }
}
