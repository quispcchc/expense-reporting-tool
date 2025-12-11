<?php

use App\Http\Controllers\ClaimNotesController;
use App\Http\Controllers\CostCentreController;
use App\Http\Controllers\LookupController;
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
Route::middleware(['auth:sanctum','role:1'])->group(function () {
    Route::post('/admin/create-user', [CreateUserController::class, 'createUser']);
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::put('/roles/{id}', [RoleController::class, 'update']);
    Route::delete('/roles/{id}', [RoleController::class, 'destroy']);

});


// Cost Centre Management
Route::apiResource('cost-centres', CostCentreController::class)->middleware('auth:sanctum');

// Fetch lookup data (active_status, roles, departments, positions,claimTypes..., which will be used cross the app)
Route::get('lookups',[LookupController::class,'index'])->middleware('auth:sanctum');

// Claim API
Route::apiResource('claims',ClaimController::class)->middleware('auth:sanctum');
Route::get('my-claims',[ClaimController::class,'getClaimsByUser'])->middleware('auth:sanctum');

// Create Claim Notes
Route::post('notes',[ClaimNotesController::class,'store'])->middleware('auth:sanctum');

// Approve and Reject
Route::post('claims/bulk-approve',[ClaimController::class,'bulkApproveClaim'])->middleware('auth:sanctum');
Route::post('claims/bulk-reject',[ClaimController::class,'bulkRejectClaim'])->middleware('auth:sanctum');

// Expense API
Route::apiResource('expenses',ClaimController::class)->middleware('auth:sanctum');
Route::post('expenses/{expenseId}/approve', [ExpenseController::class, 'approveExpense'])->middleware('auth:sanctum');
Route::post('expenses/{expenseId}/reject', [ExpenseController::class, 'rejectExpense'])->middleware('auth:sanctum');




//claim Details
//Route::middleware('auth:sanctum')->group(function () {
//    Route::post('/claims', [ClaimController::class, 'store']);
//    Route::post('/claims/{claimId}/notify', [NotificationController::class, 'notifyClaimUpdate']);
//
//    Route::post('/expenses', [ExpenseController::class, 'store']);
//    Route::post('/mileages', [MileageController::class, 'store']);
//});
