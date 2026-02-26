<?php

namespace Tests\Feature;

use App\Models\ClaimNote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class ClaimNotesControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_authenticated_user_can_create_note()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimForUser($user);

        $response = $this->postJson('/api/notes', [
            'claim_id' => $claim->claim_id,
            'noteText' => 'This is a test note',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('claim_notes', [
            'claim_id' => $claim->claim_id,
            'claim_note_text' => 'This is a test note',
        ]);
    }

    public function test_note_returns_with_user_relationship()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimForUser($user);

        $response = $this->postJson('/api/notes', [
            'claim_id' => $claim->claim_id,
            'noteText' => 'Note with user data',
        ]);

        $response->assertStatus(200);
        $responseData = $response->json();
        $this->assertArrayHasKey('user', $responseData);
    }

    public function test_create_note_requires_authentication()
    {
        $response = $this->postJson('/api/notes', [
            'claim_id' => 1,
            'noteText' => 'Unauthorized note',
        ]);

        $response->assertStatus(401);
    }

    public function test_note_is_linked_to_authenticated_user()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimForUser($user);

        $response = $this->postJson('/api/notes', [
            'claim_id' => $claim->claim_id,
            'noteText' => 'User linked note',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('claim_notes', [
            'claim_id' => $claim->claim_id,
            'user_id' => $user->user_id,
        ]);
    }
}
