<?php

namespace App\Http\Controllers;

use App\Enums\ActiveStatus;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        return response()->json(Project::orderBy('project_id')->get());
    }

    public function store(Request $request)
    {
        $this->authorize('create', Project::class);

        $validated = $request->validate([
            'active_status_id' => 'nullable|integer',
            'project_name' => 'required|string|max:50',
            'project_desc' => 'nullable|string',
            'department_id' => 'required|integer',
        ]);
        if (empty($validated['active_status_id'])) {
            $validated['active_status_id'] = ActiveStatus::ACTIVE;
        }
        $project = Project::create($validated);

        return response()->json($project, 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $this->authorize('update', $project);

        $validated = $request->validate([
            'active_status_id' => 'nullable|integer',
            'project_name' => 'required|string|max:50',
            'project_desc' => 'nullable|string',
            'department_id' => 'required|integer',
        ]);
        $project->update($validated);

        return response()->json($project);
    }

    public function destroy($id)
    {
        try {
            $project = Project::findOrFail($id);
            $this->authorize('delete', $project);

            DB::beginTransaction();
            $project->delete();

            // Clear lookup cache since it includes projects
            LookupController::clearCache();
            DB::commit();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting project: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete project. ' . (config('app.debug') ? $e->getMessage() : 'An unexpected error occurred.'),
            ], 500);
        }
    }
}
