# Opening PlayHaven through Laragon

The project is already in `D:\laragon\www\playhaven`. Laragon can serve it through Apache using a local virtual host. Laravel's public document root is **`D:/laragon/www/playhaven/public`**.

## One-time local domain setup

A ready configuration is included at [laragon/playhaven.test.conf](laragon/playhaven.test.conf), and has been copied to:

```text
D:\laragon\etc\apache2\sites-enabled\playhaven.test.conf
```

It defines `playhaven.test` and `www.playhaven.test`, serves only `public/`, and limits access to the local machine. The file has no `auto.` prefix so Laragon preserves custom settings. See [Laragon Pretty URLs](https://laragon.org/docs/pretty-urls).

The local `playhaven.test` hostname is now registered and verified through Apache. To run Laragon as Administrator:

1. Exit Laragon from its system-tray menu; closing the window can leave it running.
2. Open `D:\laragon` in File Explorer.
3. Right-click `laragon.exe`, choose **Run as administrator**, and approve the Windows UAC prompt yourself.
4. Start Apache if needed, then click **Reload**.

If a hostname is missing in the future, let Laragon register it after Reload, or add this line to `C:\Windows\System32\drivers\etc\hosts` from an administrator editor:

```text
127.0.0.1 playhaven.test www.playhaven.test
```

After Apache reload and hostname activation, open:

- `http://playhaven.test`
- `http://playhaven.test/games`
- `http://www.playhaven.test` (alias)

Use `APP_URL=http://playhaven.test` in `.env`, then run `php artisan config:clear` from a terminal with `scripts/env.ps1` loaded. This ensures generated email links use the chosen address. The `www` alias also needs a hosts entry if you want to use that exact address.

## Local Carbon / OPcache workaround

On this installation, PHP 8.5.10 with Carbon 3.15.1 loaded normally in CLI but raised `CarbonPeriod::getIterator(): Generator must be compatible with DatePeriod::getIterator(): Iterator` under Apache when OPcache was enabled. The same Apache probe loaded Carbon successfully with OPcache disabled.

`public/.htaccess` now disables OPcache only for the `playhaven.test` and `www.playhaven.test` hostnames under mod_php. Other hostnames keep their existing settings. No vendor files were modified. This is a local compatibility workaround; reevaluate it when updating PHP/Carbon. The Apache include order on this machine loads mod_php after virtual hosts, so an early `<IfModule php_module>` in a virtual-host file is skipped; the per-request `.htaccess` rule avoids that ordering issue.

Verification after the change: the Apache runtime probe loaded Carbon, and `/`, `/games`, and `/login` returned successful responses. Temporary diagnostic endpoints were removed after verification.

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
