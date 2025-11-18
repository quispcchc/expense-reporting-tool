<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash; //require for API login
use App\Models\User;

class LoginController extends Controller
{
    //Login function for api with sanctum
    public function login (Request $request){

        $request-> validate ([
            'email' => ['required','string','email'],
            'password' => ['required','string']
        ]);
        //find user
        $user = User::with(['role', 'team'])->where('email', $request->email)->first();
        // Check if user exists
        if (!$user || !Hash::check($request->password, $user->user_pass)) {
            return response()->json(['message' => 'Invalid email or password'], 401);
        }
        // Check if email is verified
        if (is_null($user->email_verified_at)) {
            return response()->json(['message' => 'Please verify your email before logging in.'], 403);
        }


        //generate token
        $token= $user->createToken('api_token')->plainTextToken;

        return response()->json([
            'access_token'=>$token,
            'token_type' => 'Bearer',
//            'user'=>$user,
            'user' => [
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role_name' => $user->role_name,
                'department_id'=>$user->department_id,
                'position_id' => $user->position->position_id,
            ]
        ]);
    }
}
?>


