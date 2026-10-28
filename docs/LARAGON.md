# Opening PlayHaven through Laragon

The project is already in `D:\laragon\www\playhaven`. Laragon can serve it through Apache using a local virtual host. Laravel's public document root is **`D:/laragon/www/playhaven/public`**.

## One-time local domain setup

A ready configuration is included at [laragon/playhaven.test.conf](laragon/playhaven.test.conf), and has been copied to:

```text
D:\laragon\etc\apache2\sites-enabled\playhaven.test.conf
```

It defines `playhaven.test` and `www.playhaven.test`, serves only `public/`, and limits access to the local machine. The file has no `auto.` prefix so Laragon preserves custom settings. See [Laragon Pretty URLs](https://laragon.org/docs/pretty-urls).

Windows denied writing the hosts file from this session. Domain activation is deferred until you run **Laragon as Administrator** and click **Reload**. If Laragon does not add the domain itself, add this line to `C:\Windows\System32\drivers\etc\hosts` from an administrator editor:

```text
127.0.0.1 playhaven.test www.playhaven.test
```

After Apache reload and hostname activation, open:

- `http://playhaven.test`
- `http://playhaven.test/games`
- `http://www.playhaven.test` (alias)

Update `.env` to `APP_URL=http://playhaven.test`, then run `php artisan config:clear` from a terminal with `scripts/env.ps1` loaded. This ensures generated email links use the chosen address. The current `.env` URL is preserved until domain activation.

## Daily use

Start Apache from Laragon. For active frontend/backend development:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1 -Service laragon
```

This starts the project PostgreSQL instance, Vite, and the queue worker. Apache serves the Laravel web requests, so no `php artisan serve` process is needed in this mode. The Vite plugin already permits local `.test` origins.

To view the latest compiled assets without keeping Vite open:

```powershell
. .\scripts\env.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\database.ps1 start
npm run build
```

Apache and PostgreSQL must be running. A queue worker is needed when background catalog imports are queued. Stop Vite before using built assets; if Vite was force-killed and left an obsolete `public/hot`, remove that file after confirming Vite is stopped.

## Existing localhost alternative

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

This serves the application at `http://127.0.0.1:8000` and does not require hosts-file changes. Use the dedicated virtual host for Apache access; opening a Laravel project directory under `localhost/playhaven` exposes the wrong application root and is not the supported setup here.
