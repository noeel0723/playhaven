<?php

namespace Tests\Feature;

use App\Models\DiaryEntry;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\Playthrough;
use App\Models\Rating;
use App\Models\Review;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileLocationDiaryTest extends TestCase
{
    use RefreshDatabase;

    private function details(array $changes = []): array
    {
        return ['username' => 'location_owner', 'display_name' => 'Location Player', 'bio' => 'Games and stories.', 'is_public' => false, ...$changes];
    }

    public function test_optional_location_is_saved_owned_and_only_visible_publicly_after_publishing(): void
    {
        $owner = User::factory()->create();
        $other = UserProfile::factory()->create(['location' => 'Other location']);
        $this->actingAs($owner)->put(route('players.update'), $this->details(['location' => '  Makassar, Indonesia  ', 'user_id' => $other->user_id]))->assertSessionHasNoErrors();
        $this->assertSame('Makassar, Indonesia', $owner->profile()->first()->location);
        $this->assertSame('Other location', $other->fresh()->location);
        $this->get(route('players.me'))->assertInertia(fn (Assert $page) => $page->where('player.location', 'Makassar, Indonesia'));
        $this->get('/players/location_owner')->assertNotFound();
        $this->get('/players')->assertDontSee('Makassar, Indonesia');
        $this->put(route('players.update'), $this->details(['is_public' => true]))->assertSessionHasNoErrors();
        $this->get('/players/location_owner')->assertInertia(fn (Assert $page) => $page->where('player.location', 'Makassar, Indonesia'));
        $this->get(route('players.edit'))->assertInertia(fn (Assert $page) => $page->where('profile.location', 'Makassar, Indonesia'));
    }

    public function test_location_can_be_cleared_and_invalid_values_do_not_replace_it(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner)->put(route('players.update'), $this->details(['location' => 'Jakarta']))->assertSessionHasNoErrors();
        $this->put(route('players.update'), $this->details(['location' => str_repeat('x', 121)]))->assertSessionHasErrors('location');
        $this->put(route('players.update'), $this->details(['location' => ['bad']]))->assertSessionHasErrors('location');
        $this->assertSame('Jakarta', $owner->profile()->first()->location);
        $this->put(route('players.update'), $this->details(['location' => '']))->assertSessionHasNoErrors();
        $this->assertNull($owner->profile()->first()->location);
    }

    public function test_diary_rows_include_only_owned_validated_game_metadata_and_current_library_values(): void
    {
        $owner = User::factory()->create();
        $game = Game::factory()->create(['rawg_id' => 123, 'cover_url' => 'https://untrusted.example/image.jpg', 'released_on' => '2020-01-02']);
        $entry = LibraryEntry::factory()->for($owner)->for($game)->create(['is_favorite' => true]);
        Rating::factory()->for($entry)->create(['score' => 9]);
        Review::factory()->for($entry)->create(['body' => 'PRIVATE REVIEW BODY NOT NEEDED IN DIARY']);
        $first = Playthrough::factory()->for($entry)->create();
        $second = Playthrough::factory()->for($entry)->create();
        $one = DiaryEntry::factory()->for($first)->create(['logged_on' => now()->subDays(2)->toDateString()]);
        $two = DiaryEntry::factory()->for($second)->create(['logged_on' => now()->subDay()->toDateString()]);
        DiaryEntry::factory()->create(['notes' => 'OTHER USER DIARY SECRET']);
        $this->actingAs($owner)->get(route('diary.index'))->assertDontSee('OTHER USER DIARY SECRET')->assertDontSee('PRIVATE REVIEW BODY NOT NEEDED IN DIARY')
            ->assertInertia(fn (Assert $page) => $page->has('sessions.data', 2)->where('sessions.data.0.id', $two->id)
                ->where('sessions.data.0.catalog_game.id', $game->id)->where('sessions.data.0.catalog_game.cover_url', null)
                ->where('sessions.data.0.catalog_game.released_on', '2020-01-02')->where('sessions.data.0.rating', 4.5)
                ->where('sessions.data.0.has_review', true)->where('sessions.data.0.is_favorite', true)->where('sessions.data.0.is_replay', true)
                ->where('sessions.data.1.id', $one->id)->where('sessions.data.1.is_replay', false)
                ->missing('sessions.data.0.catalog_game.rawg_id')->missing('sessions.data.0.catalog_game.summary'));
    }

    public function test_diary_edit_targets_the_correct_playthrough_page_even_when_diary_is_filtered(): void
    {
        $owner = User::factory()->create();
        $run = Playthrough::factory()->for(LibraryEntry::factory()->for($owner)->create())->create();
        $date = now()->subDays(10)->toDateString();
        $oldest = DiaryEntry::factory()->for($run)->create(['logged_on' => $date]);
        DiaryEntry::factory()->for($run)->count(20)->create(['logged_on' => now()->subDay()->toDateString()]);
        $this->actingAs($owner)->get(route('diary.index', ['from' => $date, 'to' => $date]))->assertInertia(fn (Assert $page) => $page
            ->has('sessions.data', 1)->where('sessions.data.0.id', $oldest->id)->where('sessions.data.0.session_page', 2));
        $this->get(route('playthroughs.show', [$run, 'page' => 2]))->assertInertia(fn (Assert $page) => $page
            ->where('sessions.data.0.id', $oldest->id)->missing('sessions.data.0.catalog_game'));
    }
}
