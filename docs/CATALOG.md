# Catalog integration and discovery

Stage 3 provides public catalog browsing at `/games`, local search/filtering, game detail pages, and a controlled server-side IGDB import pipeline.

## Importing games

Create a Confidential application in the [Twitch Developer Console](https://dev.twitch.tv/console/apps), then set `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` in the ignored `.env`. Do not put these values in `VITE_*` variables. The [IGDB documentation](https://api-docs.igdb.com/) describes authentication and API access.

1. Sign in to Twitch, verify your email, and enable account two-factor authentication.
2. Open **Applications → Register Your Application** in the developer console.
3. Choose a unique name such as `PlayHaven Dev <your-name>`; set the OAuth redirect URL to `http://localhost` and choose client type **Confidential**. IGDB does not use this callback URL.
4. Create the application, open **Manage**, copy its **Client ID**, then use **New Secret** to generate the **Client Secret**.
5. In the project root `.env`, replace the empty values with the actual credentials:

```dotenv
IGDB_CLIENT_ID=your_actual_client_id
IGDB_CLIENT_SECRET=your_actual_client_secret
```

Save these values directly in the local file; no need to paste the secret into chat. Do not put them in `.env.example`. The backend obtains and refreshes the access token automatically, so no bearer-token environment variable is needed. Generating another secret invalidates the previous secret; update `.env` if you replace it.

```powershell
. .\scripts\env.ps1
php artisan config:clear
php artisan igdb:check
php artisan catalog:sync --inline
```

The default imports one page of up to 50 games, ordered by the upstream `total_rating_count` and excluding game editions with a `version_parent`. This is an initial catalog selection; it does not imply the whole IGDB catalog has been imported.

For background imports:

```powershell
php artisan catalog:sync --pages=5 --per-page=100 --offset=0
php artisan queue:work
```

Continue subsequent ranges with `--offset=500`, then `--offset=1000`, etc. The command accepts 1–20 pages per run, 1–100 records per page, and offsets from 0 to 10000000. Upstream sorting can change while pages are imported; repeat synchronization when refreshing a changing catalog. No recurring schedule is installed.

## Persistence and consistency

- Games, genres, and platforms are matched by their IGDB IDs. Existing local IDs and slugs are preserved, so player history and URLs remain stable when upstream names change.
- New slug collisions receive a deterministic IGDB-ID suffix; unrelated local records are kept.
- The full batch is validated before writes, and each page imports in a database transaction under a shared import lock.
- Genre/platform associations reflect the current complete upstream payload. Older game timestamps cannot overwrite newer metadata. No catalog rows are deleted by synchronization.
- Release dates are converted from upstream UTC timestamps. Cover image IDs accept only a restricted character set; image URLs use the fixed IGDB image host.
- Existing ratings, reviews, playthroughs, diary entries, lists, and users are not modified by imports.

## Cache, pacing, and failures

OAuth tokens are cached until shortly before expiry. Successful API query responses are cached for one hour, scoped to the credentials and exact query. A shared cache lock serializes uncached IGDB requests and spaces their starts at least 350 ms apart across workers. This keeps normal traffic below the documented four-requests-per-second and eight-open-request limits.

HTTP 401 clears the token for the next attempt. HTTP 429 triggers a five-second cooldown. Queue jobs release rate-limited work for later, prevent duplicate pending pages, and retry other failures with bounded backoff. Each job has a 60-second timeout, below the default 90-second queue reservation timeout. Use a shared cache store in multi-worker deployments; the default local database cache is shared by local workers.

Inline execution is useful for a small first import and waits briefly for request pacing. A persistent upstream limit/failure returns an error; already committed pages remain imported, and the command can be retried safely. Inspect `php artisan queue:failed` for failed background jobs and use `php artisan queue:retry <id>` after correcting the cause.

## Public catalog

`GET /games` accepts:

| Parameter           | Behavior                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `q`                 | Case-insensitive title containment, up to 100 characters; SQL wildcard characters are treated literally |
| `genre`, `platform` | Filter by local taxonomy slug; filters combine                                                          |
| `year`              | Release year from 1970 to 2100                                                                          |
| `sort`              | `recent`, `name`, `popular`, or `rating`                                                                |
| `page`              | Positive page number; 24 games per page                                                                 |

Most collected counts PlayHaven library entries. Highest rated uses PlayHaven ratings divided by two, with unrated games last. Imported IGDB ratings are not presented as PlayHaven community ratings. Games with unknown release dates sort after dated games in recent ordering.

Search reads the local catalog only and never calls IGDB from the browser. The initial containment search is intended for the first catalog stage; a larger production catalog should receive a measured PostgreSQL search-index implementation. Detail pages render plain text, hide the storyline in a spoiler disclosure, link taxonomy filters, and show safe fallbacks for unavailable covers/metadata.

The empty catalog and no-results states are implemented. No synthetic game metadata is inserted into the development catalog. Live imports require the user's IGDB credentials; automated tests use simulated responses.

## Verification

Tests cover idempotent updates, stale payloads, malformed batches, slug collisions, queued and inline imports, response caching, request pacing, filtering, literal wildcards, pagination, sort null handling, and safe detail props. Run the complete suite with `php artisan test`, or use `scripts/test-postgres.ps1` for the isolated PostgreSQL database.
