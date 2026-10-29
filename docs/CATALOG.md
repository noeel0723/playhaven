# Catalog integration and discovery

The active catalog provider is **RAWG**. Public pages remain at `/games` and `/games/{slug}`; searching and filtering use the local database.

## API key

Create an account and key through [RAWG](https://rawg.io/apidocs), then set the server-side value in the ignored project `.env`:

```dotenv
RAWG_API_KEY=your_actual_key
```

No Twitch account or OAuth token is required by this integration. Keep the key out of `VITE_*`, `.env.example`, job payloads, and browser props. HTTP errors are sanitized so URL-bearing exception messages cannot print a key.

```powershell
. .\scripts\env.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\database.ps1 start
php artisan config:clear
php artisan migrate
php artisan rawg:check
php artisan catalog:sync --inline
```

The default imports 20 popular games and fetches their full descriptions. It is an initial selection, not a copy of the entire RAWG catalog. Popularity for selection comes from RAWG's `added` ordering; displayed community ratings remain PlayHaven ratings.

## Search and import from the website

The catalog search on `/games` searches already imported games. Select **Find more games**, or open `/discover/rawg`, to search the wider RAWG catalog by title. Sign in, enter a title such as **Balatro**, **Elden Ring**, or **Stardew Valley**, and select **Search RAWG**. RAWG supports this through its documented `search` parameter: [official documentation](https://rawg.io/apidocs).

Select a cover, title, or **Open game**. PlayHaven automatically saves a missing game's metadata, artwork, and description before opening its local detail page. Existing entries open directly, and repeated selection reuses the same local record. From its detail page, add it to a library; from a custom list, search its title again to add it to that list. Related entries are described in [Connected worlds](GAME_CONNECTIONS.md).

Search is submitted explicitly, returns twelve results per page, and caches responses for one hour. Provider pagination URLs are reduced to a boolean; the browser receives locally generated page links. Results are limited to ID, title, release date, validated artwork, and an existing local slug. The API key stays in the backend.

Routes require authentication and the existing verification middleware. Search has limits of 12 requests/minute per user and 30 across the application; imports have limits of 6 per user and 20 across the application. Existing shared RAWG pacing/cooldown applies. Busy or failed requests show sanitized retry messages. A successful import is idempotent and reuses recently synchronized details.

To import another selection of popular games from the terminal, continue the existing page-based workflow:

```powershell
. .\scripts\env.ps1
php artisan catalog:sync --inline --page=2 --per-page=20
```

This bulk command uses popularity ordering. Use the website's RAWG search for a particular title. API searches and uncached details consume provider requests; the current free-plan allowance is described in [RAWG's API page](https://rawg.io/apidocs).

## Background synchronization

```powershell
php artisan catalog:sync --page=1 --pages=5 --per-page=20
php artisan queue:work
```

List jobs store a page and enqueue separate unique jobs for each game's description. Detail jobs stay small, rather than holding a worker while an entire page's descriptions are downloaded. The command accepts starting pages 1–1000000, 1–20 pages per run, and 1–40 games per page. Continue with `--page=6`, etc. RAWG pagination is page-based; the old IGDB `--offset` argument is no longer used.

Inline mode performs both stages immediately and waits briefly for request pacing. Each page's metadata is committed before details are fetched, so a detail failure leaves searchable catalog entries available and a retry can complete missing descriptions.

## Data mapping and history

- `games`, `genres`, and `platforms` have nullable unique `rawg_id` columns. IGDB columns remain for existing records; RAWG IDs are never stored in `igdb_id`.
- Existing local game IDs, URLs, and player records are preserved. A RAWG record updates by its RAWG ID; unrelated local or IGDB records are not merged by title or numeric ID. Cross-provider deduplication requires explicit identity mapping if legacy catalog data is added later.
- Slug collisions get a `-rawg-ID` suffix. Future upstream name or slug changes do not change an existing local URL.
- RAWG `released`, nested platform data, genres, and update timestamps are normalized and validated before a page transaction. Older metadata cannot overwrite newer records.
- Detailed descriptions are converted to plain text. A list refresh never clears a stored description; a newer upstream timestamp invalidates the detail freshness marker and cache.
- `cover_url` stores the RAWG image reference. Only HTTPS images on `media.rawg.io/media/` are rendered, with no credentials or query strings. Invalid/unavailable images fall back to the existing placeholder.
- Existing IGDB cover IDs can still be read for legacy rows. Active import and catalog attribution use RAWG; the old IGDB client/check command are retained only for compatibility and are not called by `catalog:sync`.
- No import writes to library entries, playthroughs, diary entries, ratings, reviews, profiles, custom lists, or follows.

## Caching, pacing, and quota

List responses are cached for one hour; detail responses and detail freshness are cached for one day. Cache keys are scoped to a hash of the API key and request parameters. Repeating an import reuses cached responses and recent descriptions.

A shared lock serializes uncached API calls, with a conservative local policy of at least one second between request starts. This is PlayHaven's pacing policy, not a statement of RAWG's published requests-per-second limit. HTTP 429 respects a bounded `Retry-After` cooldown. Queue jobs release rate-limited work for later; other failures use bounded backoff and a 60-second timeout. Use a shared cache store for multiple workers.

The RAWG documentation lists 20,000 monthly requests on its free plan and requires an active attribution link where its data is displayed. List requests and each uncached detail request consume quota separately. Review [RAWG's current terms](https://rawg.io/apidocs) before commercial release; its pricing and commercial-use text are not fully consistent. No automatic recurring sync is installed.

## Public discovery

| Parameter           | Behavior                                                                            |
| ------------------- | ----------------------------------------------------------------------------------- |
| `q`                 | Case-insensitive title containment, up to 100 characters; SQL wildcards are literal |
| `genre`, `platform` | Local taxonomy slug filters, combined with other filters                            |
| `year`              | Release year, 1970–2100                                                             |
| `sort`              | `recent`, `name`, `popular`, `rating`                                               |
| `page`              | Catalog page number; 24 local games per page                                        |

Most collected counts PlayHaven library entries. Highest rated uses the average of PlayHaven scores divided by two, with unrated games last. No RAWG score is converted into a user's rating or review. Local catalog search/detail requests use the database; the explicit **Find more games** screen calls RAWG through the backend.

The footer links to RAWG on catalog and detail pages. Missing descriptions, missing artwork, empty catalogs, and no-result filters have visible fallbacks. Large-scale text-search optimization remains future work.

## Verification

Tests cover RAWG key handling, sanitized failures, cache reuse, pacing, cooldowns, idempotent import, stale payloads, image validation, source-ID separation, preserved player history, description refreshes, and separate queued detail jobs. Existing catalog filter and domain tests continue to run on SQLite and PostgreSQL.
