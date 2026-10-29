<?php

namespace App\Http\Middleware;

use App\Support\EmailVerification;
use Closure;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified as BaseMiddleware;

class EnsureEmailIsVerified extends BaseMiddleware
{
    public function handle($request, Closure $next, $redirectToRoute = null)
    {
        if ($request->user() && ! EmailVerification::required()) {
            return $next($request);
        }

        return parent::handle($request, $next, $redirectToRoute);
    }
}
