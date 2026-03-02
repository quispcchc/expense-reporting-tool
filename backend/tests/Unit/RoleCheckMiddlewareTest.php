<?php

namespace Tests\Unit;

use App\Enums\RoleLevel;
use App\Http\Middleware\RoleCheck;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class RoleCheckMiddlewareTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedLookups();
    }

    public function test_user_with_matching_role_level_passes(): void
    {
        $user = $this->createUser(['role_id' => RoleLevel::SUPER_ADMIN]);
        $user->load('role');

        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new RoleCheck;
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['ok' => true], 200);
        }, RoleLevel::SUPER_ADMIN);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_user_with_different_role_level_is_rejected(): void
    {
        $user = $this->createUser(['role_id' => RoleLevel::USER]);
        $user->load('role');

        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new RoleCheck;
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['ok' => true], 200);
        }, RoleLevel::SUPER_ADMIN);

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn () => null);

        $middleware = new RoleCheck;
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['ok' => true], 200);
        }, RoleLevel::SUPER_ADMIN);

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_user_without_role_is_rejected(): void
    {
        $user = $this->createUser(['role_id' => RoleLevel::USER]);
        // Do not load the role relationship, so $user->role is null
        $user->setRelation('role', null);

        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new RoleCheck;
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['ok' => true], 200);
        }, RoleLevel::SUPER_ADMIN);

        $this->assertEquals(403, $response->getStatusCode());
    }
}
