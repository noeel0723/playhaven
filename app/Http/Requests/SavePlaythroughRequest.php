<?php

namespace App\Http\Requests;

use App\Enums\PlaythroughStatus;
use App\Models\Game;
use App\Models\Playthrough;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePlaythroughRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $game = $this->route('game');
        $run = $this->route('playthrough');
        $gameId = $game instanceof Game ? $game->id : ($run instanceof Playthrough ? $run->libraryEntry->game_id : null);
        $keepPlatform = $run instanceof Playthrough && is_numeric($this->input('platform_id')) && (int) $this->input('platform_id') === $run->platform_id;
        $platformRule = $keepPlatform ? Rule::exists('platforms', 'id') : Rule::exists('game_platform', 'platform_id')->where('game_id', $gameId);

        return [
            'label' => ['present', 'nullable', 'string', 'max:100'],
            'platform_id' => ['present', 'nullable', 'integer', $platformRule],
            'status' => ['required', Rule::enum(PlaythroughStatus::class)],
            'started_on' => ['present', 'nullable', 'date_format:Y-m-d', 'after_or_equal:0001-01-01', 'before_or_equal:today'],
            'finished_on' => ['present', 'nullable', 'date_format:Y-m-d', 'after_or_equal:0001-01-01', 'before_or_equal:today', Rule::when($this->filled('started_on'), ['after_or_equal:started_on'])],
        ];
    }
}
