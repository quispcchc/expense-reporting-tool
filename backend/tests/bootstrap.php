<?php

// Force test database env vars BEFORE anything else loads.
// This prevents migrate:fresh from wiping the production database
// when running inside Docker where docker-compose sets DB_HOST=pgbouncer.
$_ENV['DB_HOST'] = 'postgres';
$_ENV['DB_PORT'] = '5432';
$_ENV['DB_DATABASE'] = 'expense_db_test';
$_SERVER['DB_HOST'] = 'postgres';
$_SERVER['DB_PORT'] = '5432';
$_SERVER['DB_DATABASE'] = 'expense_db_test';
putenv('DB_HOST=postgres');
putenv('DB_PORT=5432');
putenv('DB_DATABASE=expense_db_test');

require __DIR__.'/../vendor/autoload.php';
