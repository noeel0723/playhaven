<?php

namespace App\Console\Commands;

use App\Enums\GameConnectionType;
use App\Models\Game;
use App\Services\GameConnections;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Throwable;

class RelateGames extends Command
{
    protected $signature = 'catalog:relate {game : Local source slug} {related : Local target slug} {type? : prequel, sequel, universe, series, addition, parent} {--note=} {--source-url=} {--remove : Remove the curated pair only}';

    protected $description = 'Curate a bidirectional game connection without guessing story order';

    public function handle(GameConnections $connections): int
    {
        try {
            $data = Validator::make(['type' => $this->argument('type'), 'note' => $this->option('note'), 'url' => $this->option('source-url')], [
                'type' => [$this->option('remove') ? 'nullable' : 'required', Rule::enum(GameConnectionType::class)],
                'note' => ['nullable', 'string', 'max:1000'], 'url' => ['nullable', 'url:https', 'max:2048'],
            ])->validate();
            $game = Game::where('slug', $this->argument('game'))->firstOrFail();
            $related = Game::where('slug', $this->argument('related'))->firstOrFail();
            $type = $this->option('remove') ? null : GameConnectionType::from($data['type']);
            $connections->curate($game, $related, $type, $data['note'], $data['url']);
        } catch (Throwable) {
            $this->error('Connection not saved. Check local slugs, RAWG IDs, type, note length, and HTTPS source URL.');

            return self::FAILURE;
        }
        $this->info($this->option('remove') ? 'Curated connection removed in both directions.' : 'Curated connection saved in both directions.');

        return self::SUCCESS;
    }
}
