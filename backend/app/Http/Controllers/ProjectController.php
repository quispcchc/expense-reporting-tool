<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        return response()->json(Project::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'active_status_id' => 'nullable|integer',
            'project_name' => 'required|string|max:50',
            'project_desc' => 'nullable|string',
            'department_id' => 'required|integer',
        ]);
        $project = Project::create($validated);
        return response()->json($project, 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
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
        $project->delete();
        return response()->json(null, 204);
    }
}
