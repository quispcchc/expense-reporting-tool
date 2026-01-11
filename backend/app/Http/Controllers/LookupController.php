<?php

namespace App\Http\Controllers;

use App\Models\AccountNumber;
use App\Models\ActiveStatus;
use App\Models\ClaimStatus;
use App\Models\ClaimType;
use App\Models\CostCentre;
use App\Models\Department;
use App\Models\Position;
use App\Models\Project;
use App\Models\Role;
use App\Models\Team;
use Illuminate\Support\Facades\Cache;

class LookupController extends Controller
{
    public function index()
    {
        $roles = Cache::remember('roles', 60 * 60, fn() => Role::all());
        $teams = Cache::remember('teams', 60 * 60, fn() => Team::all());
        $statuses = Cache::remember('active_statuses', 60 * 60, fn() => ActiveStatus::all());
        $positions = Cache::remember('positions', 60 * 60, fn() => Position::all());
        $departments = Cache::remember('departments', 60 * 60, fn() => Department::all());
        $costCentres = Cache::remember('cost_centre', 60 * 60, fn() => CostCentre::all());
        $projects = Cache::remember('project', 60 * 60, fn() => Project::all());
        $accountNums = Cache::remember('accountNums', 60 * 60, fn() => AccountNumber::all());
        $claimTypes = Cache::remember('claimTypes', 60 * 60, fn() => ClaimType::all());
        $claimStatus = Cache::remember('claimStatus', 60 * 60, fn() => ClaimStatus::all());

        return $this->successResponse([
            'roles' => $roles,
            'teams' => $teams,
            'activeStatuses' => $statuses,
            'positions' => $positions,
            'departments' => $departments,
            'costCentres' => $costCentres,
            'projects' => $projects,
            'accountNums' => $accountNums,
            'claimTypes' => $claimTypes,
            'claimStatus' => $claimStatus,
        ]);
    }
}
