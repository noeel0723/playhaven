<?php

namespace App\Providers;

use App\Models\Game;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        RateLimiter::for('profile-photos', fn (Request $request) => Limit::perMinute(10)->by('profile-photos:'.$request->user()->id)
            ->response(fn () => to_route('players.edit')->withFragment('profile-photo')->withErrors(['avatar' => 'Too many photo changes. Please try again in a minute.'])));
        RateLimiter::for('community-follows', fn (Request $request) => Limit::perMinute(30)->by('community-follows:'.$request->user()->id));
        RateLimiter::for('rawg-search', fn (Request $request) => [Limit::perMinute(12)->by('rawg-search:user:'.$request->user()->id), Limit::perMinute(30)->by('rawg-search:shared')]);
        RateLimiter::for('rawg-import', fn (Request $request) => [Limit::perMinute(6)->by('rawg-import:user:'.$request->user()->id), Limit::perMinute(20)->by('rawg-import:shared')]);
        $connectionsBusy = function (Request $request) {
            $game = $request->route('game');
            $reviewPage = filter_var($request->input('reviews_page'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100000]]);

            return to_route('games.show', ['game' => $game instanceof Game ? $game->slug : $game, ...($reviewPage > 1 ? ['reviews_page' => $reviewPage] : [])])
                ->withErrors(['connections' => 'Connected games are busy. Please try again shortly.']);
        };
        RateLimiter::for('rawg-connections', fn (Request $request) => [Limit::perMinute(6)->by('rawg-connections:user:'.$request->user()->id)->response($connectionsBusy), Limit::perMinute(20)->by('rawg-connections:shared')->response($connectionsBusy)]);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
