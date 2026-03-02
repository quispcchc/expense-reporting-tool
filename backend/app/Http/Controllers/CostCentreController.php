<?php

namespace App\Http\Controllers;

use App\Enums\RoleLevel;
use App\Models\CostCentre;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class CostCentreController extends Controller
{
    /**
     * Cache TTL in seconds (5 minutes)
     */
    private const CACHE_TTL = 300;

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
        if ($roleLevel === RoleLevel::SUPER_ADMIN) {
            $cacheKey = 'cost_centres_all';
            $costCentres = Cache::remember($cacheKey, self::CACHE_TTL, function () {
                return CostCentre::with(['activeStatus', 'department'])->orderBy('cost_centre_id')->get();
            });

            return response()->json([
                'success' => true,
                'data' => $costCentres,
            ]);
        }

        // Admin and others see their own department
        $cacheKey = "cost_centres_dept_{$user->department_id}";
        $costCentres = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            return CostCentre::where('department_id', $user->department_id)
                ->with(['activeStatus', 'department'])
                ->orderBy('cost_centre_id')
                ->get();
        });

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
        $this->authorize('create', new CostCentre($request->all()));

        $validated = $request->validate([
            'department_id' => 'required|integer|exists:departments,department_id',
            'cost_centre_code' => 'required|integer|unique:cost_centres,cost_centre_code',
            'description' => 'nullable|string|max:100',
            'active_status_id' => 'required|integer|exists:active_status,active_status_id',
        ], [
            'cost_centre_code.unique' => 'The cost centre code already exists. Please use a different one.',
        ]);

        $costCentre = CostCentre::create($validated);
        $costCentre->load(['activeStatus', 'department']);

        // Clear all cost centre caches
        $this->clearCostCentreCaches();

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
        $costCentre = CostCentre::findOrFail($id);

        $this->authorize('update', $costCentre);

        $validated = $request->validate([
            'department_id' => 'sometimes|required|integer|exists:departments,department_id',
            'cost_centre_code' => ['required', 'integer', Rule::unique('cost_centres', 'cost_centre_code')->ignore($costCentre->cost_centre_id, 'cost_centre_id')],
            'description' => 'required|string|max:100',
            'active_status_id' => 'sometimes|required|integer|exists:active_status,active_status_id',
        ], [
            'cost_centre_code.unique' => 'The cost centre code already exists. Please use a different one.',
        ]);

        $costCentre->update($validated);
        $costCentre->load(['activeStatus', 'department']);

        // Clear all cost centre caches
        $this->clearCostCentreCaches();

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
        $costCentre = CostCentre::findOrFail($id);

        $this->authorize('delete', $costCentre);

        $costCentre->delete();

        // Clear all cost centre caches
        $this->clearCostCentreCaches();

        return response()->json([
            'success' => true,
            'message' => 'Cost Centre deleted successfully.',
        ]);
    }

    /**
     * Clear all cost centre related caches.
     */
    private function clearCostCentreCaches(): void
    {
        // Clear the main cache
        Cache::forget('cost_centres_all');

        // Clear department-specific caches (we need to clear all possible department caches)
        // Since we don't track which departments have cached data, we use cache tags in production
        // For now, we'll clear common patterns
        $departments = \App\Models\Department::pluck('department_id');
        foreach ($departments as $deptId) {
            Cache::forget("cost_centres_dept_{$deptId}");
        }

        // Clear lookup cache since it includes cost centres
        LookupController::clearCache();
    }
}
