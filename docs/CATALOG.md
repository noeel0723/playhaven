# TheGamesDB catalog

The only active catalog integration is [TheGamesDB](https://api.thegamesdb.net/). The backend uses its official v1/v1.1 endpoints. Public catalog/detail pages query PostgreSQL, not the provider.

## API key and first import

Set the ignored local `.env` value; never use a frontend/Vite-prefixed variable:

```dotenv
THEGAMESDB_API_KEY=your_actual_key
```

```powershell
. .\scripts\env.ps1
php artisan config:clear
php artisan thegamesdb:check
php artisan catalog:sync --query="Sonic" --inline
```

Alternatively, sign in and open **Games → Find more games** (`/discover/thegamesdb`). Search a title, then click its cover/title or **Open game**. This imports metadata and artwork before opening the saved local game. Search results show the platform when supplied by TheGamesDB: releases on different platforms can have different provider IDs and are not merged by title. API pagination is preserved without exposing upstream pagination URLs or dropping the tail of a result page.

Import particular IDs with `php artisan catalog:sync --ids=53,432 --inline`. Omit `--inline` to enqueue unique `SyncTheGamesDbGame` jobs, then run `php artisan queue:work --timeout=150`. Refresh saved metadata with `php artisan catalog:enrich --limit=50` (1–500 games). Search/ID imports are supported; the API does not supply the previous provider's global popularity feed.

## Mapping

| PlayHaven                 | TheGamesDB source                                          |
| ------------------------- | ---------------------------------------------------------- |
| `thegamesdb_id`           | Game `id`                                                  |
| Name                      | `game_title`                                               |
| Synopsis                  | Plain-text `overview`                                      |
| Release date/year         | `release_date`                                             |
| Platform                  | `platform`, resolved through `/v1/Platforms`               |
| Genre                     | `genres`, resolved through `/v1/Genres`                    |
| Developer/publisher       | IDs resolved through `/v1/Developers` and `/v1/Publishers` |
| Cover                     | `/v1/Games/Images`, `boxart` with `side=front`             |
| Detail/home/auth backdrop | `fanart`, then `banner`, then `screenshot`; cover fallback |

Studio dictionaries provide IDs/names, not full studio biographies. No biography, website, rating, or story relationship is fabricated from a name. Games/developers/publishers/genres/platforms use local IDs for relationships and separate unique TheGamesDB IDs. Stable local slugs are retained on refresh; collisions receive a `-tgdb-ID` suffix. Imports are atomic and idempotent, preserving player history during ordinary refreshes. Missing optional artwork retains a saved image. Older timestamped responses cannot overwrite newer metadata. Invalid/missing taxonomy entries abort the import without leaving a partial game.

The connection check accepts `/v1/API/Limit`'s bare allowance response, which has no `code`/`status` envelope. A null refresh timer is valid for private/unlimited keys. Nullable game genres/developer/publisher collections are accepted; unknown collections preserve saved credits on refresh.

Only HTTPS artwork on `cdn.thegamesdb.net/images/` is rendered. Credentials, extra ports, queries, fragments, traversal and unrelated hosts are rejected. User-facing exceptions do not include upstream URLs, response bodies, or API keys. The footer attributes TheGamesDB. Ratings/reviews remain PlayHaven's own data.

## Caching and requests

Title searches cache for one hour, details/artwork for one day, and term dictionaries for seven days. A shared cache lock serializes provider requests across workers. Search limits are 12/minute per signed-in player and 30/minute shared; imports are 6/minute per player and 20/minute shared. Provider allowance failures return a concise error. Unique background jobs retry with bounded backoff; their payload stores only the game ID, never credentials. Use a shared cache store when running multiple workers.

The compact discovery UI retains the global font and 896px centered content width. Local games use the existing six-column catalog/filter UI. Detail pages, profile activity, library, diary, statistics, lists, and weekly popularity use local records.

## Explicit local catalog reset

Before a reset, save a PostgreSQL backup outside version control. The operator command is restricted to environment `local`, database `playhaven`, host `127.0.0.1`, port `5433`, and this project's `.local/postgres` data directory:

```powershell
php artisan catalog:reset --confirm=playhaven
```

It deletes games, taxonomy dictionaries, game-connected library entries, ratings, reviews, playthroughs, diary logs/sessions, favorite slots, connected-world edges and list items. It preserves accounts/passwords, profiles/photos/banners, follows, tokens/passkeys, sessions and list definitions. Only catalog queue jobs/cache entries are removed. Ordinary game deletion remains restricted by foreign keys; this explicit reset clears the dependent rows inside a transaction.

The provider migration renames provider IDs/freshness columns and removes unused legacy cover identifiers. Historical migrations are retained for existing installations. Legacy provider clients, credentials, routes, jobs, and check commands are removed; stale legacy queue entries are cleaned by the reset.

## Validation

TheGamesDB tests use documented response fixtures for search, metadata, artwork and dictionaries. They verify key redaction, local-only browsing, authentication, validation, cache reuse, duplicate imports, atomic failures, preserved history on refresh, queued imports and curated relationships. Reset tests verify account/profile/follow/list preservation. Run the PostgreSQL suite only through `scripts/test-postgres.ps1`, which targets the disposable `playhaven_testing` database.
