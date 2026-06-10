<?php

use App\Http\Controllers\LoginController;
use App\Http\Controllers\StorageController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/storage/{path}', [StorageController::class, 'show'])->where('path', '.*');

Route::get('/login', function () {
    return view('login');
})->name('login.form');
Route::post('/login', [LoginController::class, 'login'])->name('login');
Route::get('/SuccessLoginTest', function () {
    return view('SuccessLoginTest');
});
