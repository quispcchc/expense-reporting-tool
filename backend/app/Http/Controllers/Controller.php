<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;

abstract class Controller
{
    use ApiResponse;
    //
    use \Illuminate\Foundation\Auth\Access\AuthorizesRequests;
}
