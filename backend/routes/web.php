<?php

use App\Http\Controllers\LoginController;
use Illuminate\Support\Facades\Route;

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

// Temporary route to run migrations and seed data
Route::get('/deploy-setup', function () {
    try {
        echo "Running migrations...<br>";
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        echo \Illuminate\Support\Facades\Artisan::output() . "<br>";

        echo "Seeding database...<br>";
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        echo \Illuminate\Support\Facades\Artisan::output() . "<br>";

        return "Setup completed successfully!";
    } catch (\Exception $e) {
        return "Error during setup: " . $e->getMessage();
    }
});
