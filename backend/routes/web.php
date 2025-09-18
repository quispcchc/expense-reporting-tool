<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;
Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('login');
})->name('login.form');
Route::post('/login', [LoginController::class, 'login'])->name('login');
Route::get('/SuccessLoginTest', function () {
    return view('SuccessLoginTest');
});



