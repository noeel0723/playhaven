<?php

namespace App\Http\Requests;

use App\Enums\PlaythroughStatus;
use App\Models\Game;
use Illuminate\Validation\Rule;

class LogGameDiaryRequest extends SaveDiaryEntryRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $game = $this->route('game');
        $newRun = ! $this->filled('playthrough_id');

        return array_merge(parent::rules(), [
            'playthrough_id' => ['nullable', 'integer', 'min:1'],
            'label' => [Rule::excludeIf(! $newRun), 'nullable', 'string', 'max:100'],
            'status' => [Rule::excludeIf(! $newRun), 'required', Rule::enum(PlaythroughStatus::class)],
            'platform_id' => [Rule::excludeIf(! $newRun), 'nullable', 'integer', Rule::exists('game_platform', 'platform_id')->where('game_id', $game instanceof Game ? $game->id : null)],
        ]);
    }
}
