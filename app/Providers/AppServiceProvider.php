<?php

namespace App\Providers;

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
        RateLimiter::for('profile-banners', fn (Request $request) => Limit::perMinute(10)->by('profile-banners:'.$request->user()->id)
            ->response(fn () => to_route('players.edit')->withFragment('profile-banner')->withErrors(['banner' => 'Too many banner changes. Please try again in a minute.'])));
        RateLimiter::for('community-follows', fn (Request $request) => Limit::perMinute(30)->by('community-follows:'.$request->user()->id));
        RateLimiter::for('catalog-search', fn (Request $request) => [Limit::perMinute(12)->by('catalog-search:user:'.$request->user()->id), Limit::perMinute(30)->by('catalog-search:shared')]);
        RateLimiter::for('catalog-import', fn (Request $request) => [Limit::perMinute(6)->by('catalog-import:user:'.$request->user()->id), Limit::perMinute(20)->by('catalog-import:shared')]);
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
