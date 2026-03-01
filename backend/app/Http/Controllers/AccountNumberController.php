<?php

namespace App\Http\Controllers;

use App\Models\AccountNumber;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class AccountNumberController extends Controller
{
    /**
     * Cache TTL in seconds (5 minutes)
     */
    private const CACHE_TTL = 300;

    /**
     * Display a listing of the resource.
     *
     * @throws AuthorizationException
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', AccountNumber::class);

        $cacheKey = 'account_numbers_all';
        $accountNumbers = Cache::remember($cacheKey, self::CACHE_TTL, function () {
            return AccountNumber::orderBy('account_number_id')->get();
        });

        return response()->json([
            'success' => true,
            'data' => $accountNumbers,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @throws AuthorizationException
     */
    public function store(Request $request)
    {
        $this->authorize('create', AccountNumber::class);

        $validated = $request->validate([
            'account_number' => 'required|integer|unique:account_numbers,account_number',
            'description' => 'required|string|max:255',
        ], [
            'account_number.unique' => 'The account number already exists. Please use a different one.',
        ]);

        $accountNumber = AccountNumber::create($validated);

        // Clear all account number caches
        $this->clearAccountNumberCaches();

        return response()->json([
            'success' => true,
            'message' => 'Account Number created successfully.',
            'data' => $accountNumber,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $accountNumber = AccountNumber::with(['expenses'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $accountNumber,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @throws AuthorizationException
     */
    public function update(Request $request, $id)
    {
        $accountNumber = AccountNumber::findOrFail($id);

        $this->authorize('update', $accountNumber);

        $validated = $request->validate([
            'account_number' => ['required', 'integer', Rule::unique('account_numbers', 'account_number')->ignore($accountNumber->account_number_id, 'account_number_id')],
            'description' => 'required|string|max:255',
        ], [
            'account_number.unique' => 'The account number already exists. Please use a different one.',
        ]);

        $accountNumber->update($validated);

        // Clear all account number caches
        $this->clearAccountNumberCaches();

        return response()->json([
            'success' => true,
            'message' => 'Account Number updated successfully.',
            'data' => $accountNumber,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @throws AuthorizationException
     */
    public function destroy(Request $request, $id): \Illuminate\Http\JsonResponse
    {
        $accountNumber = AccountNumber::findOrFail($id);

        $this->authorize('delete', $accountNumber);

        $accountNumber->delete();

        // Clear all account number caches
        $this->clearAccountNumberCaches();

        return response()->json([
            'success' => true,
            'message' => 'Account Number deleted successfully.',
        ]);
    }

    /**
     * Clear all account number related caches.
     */
    private function clearAccountNumberCaches(): void
    {
        // Clear the main cache
        Cache::forget('account_numbers_all');

        // Clear lookup cache since it includes account numbers
        LookupController::clearCache();
    }
}
