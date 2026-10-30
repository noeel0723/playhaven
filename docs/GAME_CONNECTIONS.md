# Connected worlds and automatic catalog persistence

Game detail pages show related entries in **Connected worlds**. Selecting a RAWG cover, title, or **Open game** saves the selected game's full metadata to the local catalog before opening its local detail page. Existing local entries open directly, and repeated selection reuses the same RAWG ID and local URL.

Connection cards use covers at most 160px wide, with smaller titles, buttons, and spacing. Desktop rows fit as many fixed-width cards as space permits; phones retain two columns with narrower cards. A single related game keeps the same compact size. The expanded selection uses the same layout, and relationship notes and source links remain available.

Searching remains a read operation. Related entries are stored as lightweight snapshots until opened. Selecting a connection imports that specific game and preserves the personal library; there is no recursive franchise crawl.

## Provider relationships and story order

The [official RAWG OpenAPI schema](https://api.rawg.io/docs/?format=openapi) documents:

| RAWG endpoint              | PlayHaven section             |
| -------------------------- | ----------------------------- |
| `/games/{id}/game-series`  | More in this series           |
| `/games/{id}/additions`    | Expansions, editions & extras |
| `/games/{id}/parent-games` | Parent games                  |

Additions include DLC, editions, companion apps, and similar entries. Series membership alone does not establish shared continuity or narrative chronology. Provider entries sort by release date for browsing.

**Prequel / earlier story**, **Sequel / later story**, and **Shared universe** are explicit curated relationships. Each has a reverse edge: prequel/sequel and addition/parent reverse each other; universe/series are symmetric. Curation supports a note and an HTTPS source link.

## Curating a verified connection

Import both games, then run the operator command:

```powershell
. .\scripts\env.ps1
php artisan catalog:relate red-dead-redemption red-dead-redemption-2 prequel --source-url="https://blog.playstation.com/2018/10/01/22-things-you-need-to-know-about-red-dead-redemption-2/"
```

The target (`red-dead-redemption-2`) appears as a prequel on the source game's page; the inverse represents the later story on the target's page. [PlayStation's official article](https://blog.playstation.com/2018/10/01/22-things-you-need-to-know-about-red-dead-redemption-2/) identifies RDR2 as a prequel to the original. This example is present locally with a source note.

Types are `prequel`, `sequel`, `universe`, `series`, `addition`, and `parent`. Optional `--note` accepts up to 1,000 characters. Re-running a pair replaces its curated type in both directions. Remove only the curated pair with:

```powershell
php artisan catalog:relate red-dead-redemption red-dead-redemption-2 --remove
```

Curated edges take priority for the same target and survive RAWG refreshes. Removing one permits an available provider edge to appear again. Curation requires two distinct local RAWG-backed games and is available through the operator command; public users cannot rewrite narrative relationships.

## Loading and storage

- An additive migration creates `game_connections` and freshness fields on `games`. Relationship targets use RAWG IDs, while player foreign keys remain local.
- Detail GET requests read local records. Authorized signed-in viewers trigger a separate POST refresh for stale snapshots. No queue worker is required. Unverified production viewers can still read public details without an automatic verification redirect.
- Each provider category stores its first page of up to 40 entries; a notice marks truncated results. Six cards appear initially, with a disclosure for the remaining entries.
- Successful snapshots and provider responses are reused for one day. Failed refreshes preserve previous provider data and curated edges, with a five-minute retry cooldown. All categories validate before provider edges are replaced transactionally.
- Shared pacing, five-second relationship request timeouts, and a bounded refresh budget limit work. Refresh allows six requests/minute per user and twenty globally, separately from imports. Error/throttle responses preserve the game page and review pagination.
- Selected-game imports retry one brief pacing/cooldown delay. Connection refresh failure does not roll back the selected game's saved metadata.
- Images use the existing allowlist. Browser payloads exclude API keys, provider pagination URLs, and error response bodies.
- PlayHaven's PostgreSQL connection uses a UTC session timezone to match Laravel timestamp serialization and keep freshness/cooldowns correct. Cluster settings and other projects are untouched; diary/playthrough calendar dates remain date-only.

## Verification

Tests cover provider grouping without guessed sequels, self-link filtering, payload validation, freshness, safe images, failure cooldowns, timestamp round trips, curated inverse/override/removal, authorization, review pagination, and selected-game persistence on SQLite and PostgreSQL.

Real-data checks populated The Witcher 3's series/additions and the Red Dead narrative example while preserving player/library/review/diary/list data.
