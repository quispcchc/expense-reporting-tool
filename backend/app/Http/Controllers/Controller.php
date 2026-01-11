<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;

abstract class Controller
{
    //
    use \Illuminate\Foundation\Auth\Access\AuthorizesRequests;
    use ApiResponse;
}
