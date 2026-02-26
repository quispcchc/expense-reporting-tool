<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use App\Notifications\VerifyEmailNotification;
use App\Models\Position;
use App\Models\User;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class CreateUserControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    private string $endpoint = '/api/admin/create-user';

    /**
     * Test 1: Super admin can create a user and verification email is sent.
     */
    public function test_super_admin_can_create_user()
    {
        Notification::fake();
        $this->seedLookups();

        $this->createAuthenticatedUser(1); // super_admin

        $payload = [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane.doe@example.com',
            'role_id' => 4,
            'department_id' => 1,
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(201);
        $response->assertJsonFragment(['first_name' => 'Jane', 'last_name' => 'Doe']);

        $this->assertDatabaseHas('users', [
            'email' => 'jane.doe@example.com',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'role_id' => 4,
            'department_id' => 1,
            'user_pass' => null,
            'email_verified_at' => null,
        ]);

        $user = User::where('email', 'jane.doe@example.com')->first();
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    /**
     * Test 2: Teams are synced when team_ids are provided.
     */
    public function test_create_user_with_teams()
    {
        Notification::fake();
        $this->seedLookups();

        $this->createAuthenticatedUser(1); // super_admin

        $payload = [
            'first_name' => 'John',
            'last_name' => 'Smith',
            'email' => 'john.smith@example.com',
            'role_id' => 4,
            'department_id' => 1,
            'team_ids' => [1],
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(201);

        $user = User::where('email', 'john.smith@example.com')->first();
        $this->assertCount(1, $user->teams);
        $this->assertEquals(1, $user->teams->first()->team_id);
    }

    /**
     * Test 3: A new position is created with ucwords formatting when it does not exist.
     */
    public function test_create_user_with_new_position()
    {
        Notification::fake();
        $this->seedLookups();

        $this->createAuthenticatedUser(1); // super_admin

        $payload = [
            'first_name' => 'Alice',
            'last_name' => 'Brown',
            'email' => 'alice.brown@example.com',
            'role_id' => 4,
            'department_id' => 1,
            'position_name' => 'senior developer',
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('positions', [
            'position_name' => 'Senior Developer',
        ]);

        $position = Position::where('position_name', 'Senior Developer')->first();
        $user = User::where('email', 'alice.brown@example.com')->first();
        $this->assertEquals($position->position_id, $user->position_id);
    }

    /**
     * Test 4: An existing position is reused rather than creating a duplicate.
     */
    public function test_create_user_with_existing_position()
    {
        Notification::fake();
        $this->seedLookups();

        $this->createAuthenticatedUser(1); // super_admin

        $payload = [
            'first_name' => 'Bob',
            'last_name' => 'White',
            'email' => 'bob.white@example.com',
            'role_id' => 4,
            'department_id' => 1,
            'position_name' => 'Member', // already seeded with position_id=1
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(201);

        $user = User::where('email', 'bob.white@example.com')->first();
        $this->assertEquals(1, $user->position_id);

        // No duplicate position should have been created
        $this->assertEquals(1, Position::where('position_name', 'Member')->count());
    }

    /**
     * Test 5: A regular user (role_id=4) cannot create users.
     */
    public function test_regular_user_cannot_create_user()
    {
        $this->seedLookups();

        $this->createAuthenticatedUser(4); // regular user

        $payload = [
            'first_name' => 'Hacker',
            'last_name' => 'McHackface',
            'email' => 'hacker@example.com',
            'role_id' => 4,
            'department_id' => 1,
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'hacker@example.com']);
    }

    /**
     * Test 6: Unauthenticated requests are rejected with 401.
     */
    public function test_create_user_requires_authentication()
    {
        $this->seedLookups();

        $payload = [
            'first_name' => 'Nobody',
            'last_name' => 'Anon',
            'email' => 'nobody@example.com',
            'role_id' => 4,
            'department_id' => 1,
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(401);
    }

    /**
     * Test 7: Validation fails when first_name is missing.
     */
    public function test_validation_requires_first_name()
    {
        $this->seedLookups();

        $this->createAuthenticatedUser(1); // super_admin

        $payload = [
            'last_name' => 'Doe',
            'email' => 'missing.first@example.com',
            'role_id' => 4,
            'department_id' => 1,
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('first_name');
    }

    /**
     * Test 8: Validation fails when email already exists.
     */
    public function test_validation_requires_unique_email()
    {
        $this->seedLookups();

        $this->createAuthenticatedUser(1); // super_admin
        $existing = $this->createUser(['email' => 'duplicate@example.com']);

        $payload = [
            'first_name' => 'Dup',
            'last_name' => 'User',
            'email' => 'duplicate@example.com',
            'role_id' => 4,
            'department_id' => 1,
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    /**
     * Test 9: Validation fails when role_id does not exist in the roles table.
     */
    public function test_validation_requires_valid_role_id()
    {
        $this->seedLookups();

        $this->createAuthenticatedUser(1); // super_admin

        $payload = [
            'first_name' => 'Bad',
            'last_name' => 'Role',
            'email' => 'badrole@example.com',
            'role_id' => 999,
            'department_id' => 1,
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('role_id');
    }

    /**
     * Test 10: Validation fails when department_id does not exist.
     */
    public function test_super_admin_cannot_create_with_invalid_department()
    {
        $this->seedLookups();

        $this->createAuthenticatedUser(1); // super_admin

        $payload = [
            'first_name' => 'Bad',
            'last_name' => 'Dept',
            'email' => 'baddept@example.com',
            'role_id' => 4,
            'department_id' => 999,
        ];

        $response = $this->postJson($this->endpoint, $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('department_id');
    }
}
