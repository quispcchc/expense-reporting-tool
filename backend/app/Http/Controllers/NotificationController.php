<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Notifications\ClaimUpdatedNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Notify the user when a claim is updated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $claimId
     * @return \Illuminate\Http\JsonResponse
     */
    public function notifyClaimUpdate(Request $request, $claimId)
    {
        // Validate the incoming message
        $request->validate([
            'message' => 'required|string|max:255',
        ]);

        // Find the claim and eager load its user
        $claim = Claim::with('user')->find($claimId);

        if (!$claim || !$claim->user) {
            return response()->json(['error' => 'Claim or associated user not found'], 404);
        }

        // Send the notification to the user
        $claim->user->notify(new ClaimUpdatedNotification($request->message));

        return response()->json(['message' => 'Notification sent successfully.']);
    }
}
