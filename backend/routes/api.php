<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\LoginController;
use App\Http\Controllers\LogoutController;
use App\Http\Controllers\UpdatePasswordController;
use App\Http\Controllers\ForgetPasswordController;
use App\Http\Controllers\ResetPasswordController;
use App\Http\Controllers\CreateUserController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\MileageController;
use App\Http\Controllers\ClaimController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// user login
Route::post('/login', [LoginController::class, 'login']);

// user reset password
Route::post('/forget-password', [ForgetPasswordController::class, 'sendResetLink']);

Route::post('/reset-password', [ResetPasswordController::class, 'reset']);

//user update password
Route::put('/update-password', [updatePasswordController::class, 'updatePassword'])->middleware('auth:sanctum');

//user logout
Route::post('/logout', [LogoutController::class, 'logout'])->middleware('auth:sanctum');

//create user
Route::post('/admin/create-user', [CreateUserController::class, 'createUser'])->middleware(['auth:sanctum', 'role:admin']);

//Admin management
Route::middleware(['auth:sanctum', 'role:1'])->group(function () {
    Route::post('/admin/create-user', [CreateUserController::class, 'createUser']);
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::put('/roles/{id}', [RoleController::class, 'update']);
    Route::delete('/roles/{id}', [RoleController::class, 'destroy']);
});

//claim Details
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/claims', [ClaimController::class, 'store']);
    Route::post('/claims/{claimId}/notify', [NotificationController::class, 'notifyClaimUpdate']);

    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::post('/mileages', [MileageController::class, 'store']);
});
