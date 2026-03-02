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
        $project = Project::findOrFail($id);

        $this->authorize('delete', $project);

        try {
            $project->delete();

            return response()->json(null, 204);
        } catch (\Illuminate\Database\QueryException $e) {
            // Check for foreign key constraint violation (SQLSTATE 23000 or 1451 for MySQL)
            if (in_array($e->getCode(), ['23000', '23503', '1451'])) {
                return response()->json([
                    'message' => 'Cannot delete project: it is referenced by other records (e.g., expenses). Please remove related records first.',
                ], 409);
            }

            // Other DB errors
            return response()->json([
                'message' => 'Failed to delete project.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
