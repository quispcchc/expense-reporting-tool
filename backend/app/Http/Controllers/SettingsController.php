<?php

namespace App\Http\Controllers;

use App\Enums\RoleLevel;
use App\Models\AppSetting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = AppSetting::all()->pluck('value', 'key');

        return $this->successResponse($settings);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        if ($user->role?->role_level > RoleLevel::DEPARTMENT_MANAGER) {
            return $this->errorResponse('Unauthorized. Only super admin and admin can update settings.', 403);
        }

        $validated = $request->validate([
            'mileage_rate' => 'sometimes|numeric|min:0',
        ]);

        foreach ($validated as $key => $value) {
            AppSetting::setValue($key, (string) $value);
        }

        $settings = AppSetting::all()->pluck('value', 'key');

        return $this->successResponse($settings, trans('messages.settings_updated'));
    }
}
