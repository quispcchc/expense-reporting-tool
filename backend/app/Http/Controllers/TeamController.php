<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeamController extends Controller
{
    /**
     * Display a listing of teams.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $roleLevel = $user->role->role_level;

        // Super admin sees all teams
        if ($roleLevel === 1) {
            $teams = Team::with(['activeStatus'])->get();
            return $this->successResponse($teams);
        }

        // Admin sees their department's teams
        if ($roleLevel === 2) {
            $teams = Team::where('department_id', $user->department_id)
                ->with(['activeStatus'])
                ->get();
            return $this->successResponse($teams);
        }

        // Regular users see their department's teams
        $teams = Team::where('department_id', $user->department_id)
            ->with(['activeStatus'])
            ->get();
        return $this->successResponse($teams);
    }

    /**
     * Store a newly created team.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'team_name' => 'required|string|max:100',
            'team_abbreviation' => 'required|string|max:20|unique:teams,team_abbreviation',
            'team_desc' => 'nullable|string|max:255',
            'department_id' => 'required|integer|exists:departments,department_id',
            'active_status_id' => 'required|integer|exists:active_status,active_status_id',
        ], [
            'team_abbreviation.unique' => 'The team code already exists. Please use a different one.',
        ]);

        $team = Team::create($validated);
        $team->load(['activeStatus']);

        return $this->successResponse($team, 'Team created successfully.', 201);
    }

    /**
     * Display the specified team.
     */
    public function show($id)
    {
        $team = Team::with(['activeStatus'])->findOrFail($id);
        return $this->successResponse($team);
    }

    /**
     * Update the specified team.
     */
    public function update(Request $request, $id)
    {
        $team = Team::findOrFail($id);

        $validated = $request->validate([
            'team_name' => 'sometimes|required|string|max:100',
            'team_abbreviation' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('teams', 'team_abbreviation')->ignore($team->team_id, 'team_id')
            ],
            'team_desc' => 'nullable|string|max:255',
            'department_id' => 'sometimes|required|integer|exists:departments,department_id',
            'active_status_id' => 'sometimes|required|integer|exists:active_status,active_status_id',
        ], [
            'team_abbreviation.unique' => 'The team code already exists. Please use a different one.',
        ]);

        $team->update($validated);
        $team->load(['activeStatus']);

        return $this->successResponse($team, 'Team updated successfully.');
    }

    /**
     * Remove the specified team.
     */
    public function destroy($id)
    {
        $team = Team::findOrFail($id);
        $team->delete();

        return $this->successResponse(null, 'Team deleted successfully.');
    }
}
