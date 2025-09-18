<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use http\Env\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use App\Notifications\ResetPasswordNotification;
// only for testing
use Illuminate\Support\Facades\DB; // need for manually create a reset token
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
class ForgetPasswordController extends Controller
{
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user =User::where('email', $request->email)->first();

         if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
         }

        $token =Str::random(64);
         DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => bcrypt($token),
                    'created_at' => Carbon::now(),
                ]
         );
        $user->notify(new ResetPasswordNotification($token));

        return response()->json([
            'message' => 'reset link sent',
            'email' => $user->email,
            // return token for reset password test
            'token' => $token,
        ]);
    }
}
