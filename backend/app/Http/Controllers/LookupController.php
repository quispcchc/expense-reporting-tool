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
use App\Models\Tag;
use App\Models\Team;
use Illuminate\Support\Facades\Cache;

class LookupController extends Controller
{
    /**
     * Cache TTL in seconds (5 minutes)
     */
    private const CACHE_TTL = 300;

    public function index()
    {
        // Cache all lookups together for better performance
        return Cache::remember('lookups_all', self::CACHE_TTL, function () {
            return $this->successResponse([
                'roles' => Role::all(),
                'teams' => Team::with('activeStatus')->get(),
                'activeStatuses' => ActiveStatus::all(),
                'positions' => Position::all(),
                'departments' => Department::with('activeStatus')->get(),
                'costCentres' => CostCentre::with(['department', 'activeStatus'])->get(),
                'projects' => Project::all(),
                'accountNums' => AccountNumber::all(),
                'claimTypes' => ClaimType::all(),
                'claimStatus' => ClaimStatus::all(),
                'tags' => Tag::all(),
            ]);
        });
    }

    /**
     * Clear all lookup caches - call this when any lookup data changes
     */
    public static function clearCache(): void
    {
        Cache::forget('lookups_all');
        // Also clear individual caches for controllers that use them
        Cache::forget('roles');
        Cache::forget('active_statuses');
        Cache::forget('positions');
        Cache::forget('cost_centre');
        Cache::forget('project');
        Cache::forget('accountNums');
        Cache::forget('claimTypes');
        Cache::forget('claimStatus');
    }
}
