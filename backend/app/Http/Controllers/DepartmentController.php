<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    /**
     * Cache TTL in seconds (5 minutes)
     */
    private const CACHE_TTL = 300;

    /**
     * Display a listing of departments.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $roleLevel = $user->role->role_level;

        // Super admin and admin can see all departments for management
        if ($roleLevel <= 2) {
            $cacheKey = 'departments_all';
            $departments = Cache::remember($cacheKey, self::CACHE_TTL, function () {
                return Department::with(['activeStatus'])->get();
            });

            return $this->successResponse($departments);
        }

        // Approvers and regular users see their own department
        $cacheKey = "departments_user_{$user->department_id}";
        $departments = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            return Department::where('department_id', $user->department_id)
                ->with(['activeStatus'])
                ->get();
        });

        return $this->successResponse($departments);
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_name' => 'required|string|max:50',
            'department_abbreviation' => 'required|string|max:50|unique:departments,department_abbreviation',
            'active_status_id' => 'required|integer|exists:active_status,active_status_id',
        ], [
            'department_abbreviation.unique' => 'The department code already exists. Please use a different one.',
        ]);

        $department = Department::create($validated);
        $department->load(['activeStatus']);

        // Clear all related caches
        $this->clearDepartmentCaches();

        return $this->successResponse($department, 'Department created successfully.', 201);
    }

    /**
     * Display the specified department.
     */
    public function show($id)
    {
        $department = Department::with(['activeStatus'])->findOrFail($id);

        return $this->successResponse($department);
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'department_name' => 'sometimes|required|string|max:50',
            'department_abbreviation' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('departments', 'department_abbreviation')->ignore($department->department_id, 'department_id'),
            ],
            'active_status_id' => 'sometimes|required|integer|exists:active_status,active_status_id',
        ], [
            'department_abbreviation.unique' => 'The department code already exists. Please use a different one.',
        ]);

        $department->update($validated);
        $department->load(['activeStatus']);

        // Clear all related caches
        $this->clearDepartmentCaches();

        return $this->successResponse($department, 'Department updated successfully.');
    }

    /**
     * Remove the specified department.
     */
    public function destroy($id)
    {
        $department = Department::findOrFail($id);

        // Check if department has teams
        if ($department->teams()->count() > 0) {
            return $this->errorResponse('Cannot delete department with existing teams.', 422);
        }

        $department->delete();

        // Clear all related caches
        $this->clearDepartmentCaches();

        return $this->successResponse(null, 'Department deleted successfully.');
    }

    /**
     * Get teams for a specific department.
     */
    public function getTeams($departmentId)
    {
        $department = Department::findOrFail($departmentId);
        $teams = Team::where('department_id', $departmentId)
            ->with(['activeStatus'])
            ->get();

        return $this->successResponse([
            'department' => $department,
            'teams' => $teams,
        ]);
    }

    /**
     * Clear all department and related caches.
     */
    private function clearDepartmentCaches(): void
    {
        // Clear department caches
        Cache::forget('departments_all');
        Cache::forget('departments');
        
        // Clear user-specific department caches
        $departments = Department::pluck('department_id');
        foreach ($departments as $deptId) {
            Cache::forget("departments_user_{$deptId}");
        }

        // Also clear cost centre caches since they include department data
        Cache::forget('cost_centres_all');
        foreach ($departments as $deptId) {
            Cache::forget("cost_centres_dept_{$deptId}");
        }
    }
}
