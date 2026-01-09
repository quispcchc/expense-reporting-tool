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
     */
    protected function setUp(): void
    {
        parent::setUp();

        // 각 테스트마다 마이그레이션 실행
        $this->artisan('migrate:fresh', ['--seed' => false]);
    }
}
