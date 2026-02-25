<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Indicates whether the default seeding should run before each test.
     *
     * @var bool
     */
    protected $seed = false;

    /**
     * Setup the test environment.
     *
     * IMPORTANT: Tests must be run with DB env overrides to target the
     * test database. Use this command to run tests safely:
     *
     *   docker exec -e DB_HOST=postgres -e DB_PORT=5432 -e DB_DATABASE=expense_db_test \
     *     expense_backend php artisan test
     *
     * Before first run, migrate the test database:
     *   docker exec -e DB_HOST=postgres -e DB_PORT=5432 -e DB_DATABASE=expense_db_test \
     *     expense_backend php artisan migrate:fresh
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Safety check: refuse to run migrate:fresh on the production database
        $dbName = config('database.connections.pgsql.database');
        if ($dbName !== 'expense_db_test') {
            $this->fail(
                "Tests must target expense_db_test but connected to '{$dbName}'. " .
                'Run tests with: docker exec -e DB_HOST=postgres -e DB_PORT=5432 ' .
                '-e DB_DATABASE=expense_db_test expense_backend php artisan test'
            );
        }

        $this->artisan('migrate:fresh', ['--seed' => false]);
    }
}
