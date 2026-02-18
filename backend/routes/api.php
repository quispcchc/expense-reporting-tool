<?php

use App\Http\Controllers\AccountNumberController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\ClaimNotesController;
use App\Http\Controllers\CostCentreController;
use App\Http\Controllers\CreateUserController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ForgetPasswordController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\LogoutController;
use App\Http\Controllers\LookupController;
use App\Http\Controllers\MileageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ResetPasswordController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UpdatePasswordController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VerifyEmailController;
use App\Http\Controllers\MileageTransactionController;
use App\Http\Controllers\MileageReceiptController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// user login
Route::post('/login', [LoginController::class, 'login']);

// email verification and password setting
Route::post('/verify-email', [VerifyEmailController::class, 'verifyEmail']);
Route::post('/resend-verification-email', [VerifyEmailController::class, 'resendVerificationEmail']);
Route::post('/check-email-verification', [VerifyEmailController::class, 'checkEmailVerification']);

// user reset password
Route::post('/forget-password', [ForgetPasswordController::class, 'sendResetLink']);

Route::post('/reset-password', [ResetPasswordController::class, 'reset']);

// user update password
Route::put('/update-password', [updatePasswordController::class, 'updatePassword'])->middleware('auth:sanctum');

// user logout
Route::post('/logout', [LogoutController::class, 'logout'])->middleware('auth:sanctum');

// create user (admin and super_admin only)
Route::post('/admin/create-user', [CreateUserController::class, 'createUser'])->middleware('auth:sanctum');

// Admin management
Route::middleware(['auth:sanctum'])->group(function () {
    // Admin user management
    Route::get('/admin/users', [UserController::class, 'index']);
    Route::put('/admin/users/{id}', [UserController::class, 'update']);
    Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);

    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::put('/roles/{id}', [RoleController::class, 'update']);
    Route::delete('/roles/{id}', [RoleController::class, 'destroy']);

});

// Cost Centre Management
Route::apiResource('cost-centres', CostCentreController::class)->middleware('auth:sanctum');

// Teams Management
Route::apiResource('teams', \App\Http\Controllers\TeamController::class)->middleware('auth:sanctum');

// Departments Management
Route::apiResource('departments', \App\Http\Controllers\DepartmentController::class)->middleware('auth:sanctum');
Route::get('departments/{departmentId}/teams', [\App\Http\Controllers\DepartmentController::class, 'getTeams'])->middleware('auth:sanctum');

// Account Numbers Management
Route::apiResource('account-numbers', AccountNumberController::class)->middleware('auth:sanctum');

// Tag Management
Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('tags', \App\Http\Controllers\TagController::class);
    Route::apiResource('projects', \App\Http\Controllers\ProjectController::class);
});

// Fetch lookup data (active_status, roles, departments, positions,claimTypes..., which will be used cross the app)
Route::get('lookups', [LookupController::class, 'index'])->middleware('auth:sanctum');

// Claim API
Route::get('claims/export-csv', [ClaimController::class, 'exportCsv'])->middleware('auth:sanctum');
Route::apiResource('claims', ClaimController::class)->middleware('auth:sanctum')->where(['claim' => '[0-9]+']);
Route::get('my-claims', [ClaimController::class, 'getClaimsByUser'])->middleware('auth:sanctum');
Route::get('claims/{claimId}/export-pdf', [ClaimController::class, 'exportPdf'])->middleware('auth:sanctum');
Route::post('claims/export-multiple-pdf', [ClaimController::class, 'exportMultiplePdf'])->middleware('auth:sanctum');

// Create Claim Notes
Route::post('notes', [ClaimNotesController::class, 'store'])->middleware('auth:sanctum');

// Approve and Reject
Route::post('claims/bulk-approve', [ClaimController::class, 'bulkApproveClaim'])->middleware('auth:sanctum');
Route::post('claims/bulk-reject', [ClaimController::class, 'bulkRejectClaim'])->middleware('auth:sanctum');

// Expense API
Route::apiResource('expenses', ExpenseController::class)->middleware('auth:sanctum');
Route::post('expenses/{expenseId}/approve', [ExpenseController::class, 'approveExpense'])->middleware('auth:sanctum');
Route::post('expenses/{expenseId}/reject', [ExpenseController::class, 'rejectExpense'])->middleware('auth:sanctum');

// claim Details
// Route::middleware('auth:sanctum')->group(function () {
//    Route::post('/claims', [ClaimController::class, 'store']);
//    Route::post('/claims/{claimId}/notify', [NotificationController::class, 'notifyClaimUpdate']);
//
//    Route::post('/expenses', [ExpenseController::class, 'store']);
//    Route::post('/mileages', [MileageController::class, 'store']);
// });

// Mileage API

//Route::middleware('auth:sanctum')->group(function () {
// ===== Mileage (header: 1 per claim) =====
    Route::post('/mileages', [MileageController::class, 'store']); 
    Route::get('/claims/{claimId}/mileage', [MileageController::class, 'showByClaim']);
    Route::put('/mileages/{mileageId}', [MileageController::class, 'update']);
    Route::delete('/mileages/{mileageId}', [MileageController::class, 'destroy']);

    // ===== Mileage Transactions =====
    Route::post('/mileage-transactions', [MileageTransactionController::class, 'store']);
    Route::put('/mileage-transactions/{transactionId}', [MileageTransactionController::class, 'update']);
    Route::delete('/mileage-transactions/{transactionId}', [MileageTransactionController::class, 'destroy']);

    // ===== Receipts =====
    // add multiple receipts to an existing transaction
    Route::post('/mileage-transactions/{transactionId}/receipts', [MileageReceiptController::class, 'storeForTransaction']);

    // replace one receipt file
    Route::put('/mileage-receipts/{receiptId}', [MileageReceiptController::class, 'update']);

    // delete one receipt
    Route::delete('/mileage-receipts/{receiptId}', [MileageReceiptController::class, 'destroy']);

    // bulk delete receipts
    Route::delete('/mileage-receipts', [MileageReceiptController::class, 'bulkDestroy']);
//});