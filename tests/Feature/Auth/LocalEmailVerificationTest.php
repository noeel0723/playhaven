<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocalEmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->instance('env', 'local');
        config(['auth.require_email_verification' => false]);

        // Changing the environment also enables real CSRF checks in these tests.
        $this->withSession(['_token' => 'email-verification-test-token'])
            ->withHeader('X-CSRF-TOKEN', 'email-verification-test-token');
    }

    public function test_existing_unverified_users_can_access_local_pages_without_marking_their_email_verified(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertOk();
        $this->get(route('appearance.edit'))->assertOk();
        $this->get(route('profile.edit'))->assertInertia(fn (Assert $page) => $page
            ->where('mustVerifyEmail', false));
        $this->get(route('verification.notice'))->assertRedirect(route('dashboard'));

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_local_registration_does_not_send_verification_and_can_open_dashboard(): void
    {
        Notification::fake();

        $this->post(route('register.store'), [
            'name' => 'Local Player',
            'email' => 'local@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard', absolute: false));

        $this->get(route('dashboard'))->assertOk();
        Notification::assertNothingSent();
        $this->assertDatabaseHas('users', ['email' => 'local@example.com', 'email_verified_at' => null]);
    }

    public function test_resending_verification_is_also_disabled_locally(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->post(route('verification.send'))->assertRedirect();

        Notification::assertNothingSent();
    }

    public function test_local_verification_can_be_reenabled(): void
    {
        config(['auth.require_email_verification' => true]);
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('verification.notice'));
        $this->get(route('verification.notice'))->assertOk();
        $this->post(route('verification.send'))->assertRedirect();

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_production_requires_verification_even_when_the_local_flag_is_disabled(): void
    {
        $this->app->instance('env', 'production');
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('verification.notice'));
        $this->get(route('verification.notice'))->assertOk();
        $this->get(route('profile.edit'))->assertInertia(fn (Assert $page) => $page
            ->where('mustVerifyEmail', true));
        $this->post(route('verification.send'))->assertRedirect();

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_local_bypass_does_not_allow_guests_to_access_dashboard(): void
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
        $this->get(route('verification.notice'))->assertRedirect(route('login'));
    }
}
