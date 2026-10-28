<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (config('database.default') !== 'pgsql' || config('database.connections.pgsql.database') !== 'playhaven_testing') {
    fwrite(STDERR, 'Refusing to test outside playhaven_testing.'.PHP_EOL);
    exit(1);
}

if (DB::selectOne('SELECT current_database() AS name')->name !== 'playhaven_testing') {
    fwrite(STDERR, 'PostgreSQL test database verification failed.'.PHP_EOL);
    exit(1);
}

fwrite(STDOUT, 'Verified isolated PostgreSQL database: playhaven_testing.'.PHP_EOL);
