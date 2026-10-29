# Personal library

The first part of stage 4 provides an authenticated personal library, favorite games, and a dashboard backed by the player's actual collection. No new schema or external API requests are needed.

## Using the feature

1. Log in and open a game from `/games`.
2. In **Your experience**, choose Playing, Completed, Paused, Dropped, or Backlog. Optionally mark the game as a favorite and select **Add to library**.
3. Return to the same page to save changes. Updating an entry preserves its local ID and related ratings, reviews, playthroughs, and diary.
4. Open `/library` to search titles, filter by status or favorite, sort by title or recent updates, and paginate the collection. Status counts always describe the full personal library, even while filters are active.
5. `/dashboard` shows counts by status, favorite count, and the six most recently updated entries. Follow a count to the matching library filter.

Status and favorite changes are saved together. Setting Completed does not automatically create a playthrough or rating; these remain separate domain records. Community ratings displayed on cards still come from PlayHaven's rating records.

## Ownership and removal

Library routes require authentication and the existing email-verification middleware. The local development bypass still applies; production continues to require email verification.

All reads, writes, counts, and deletion queries start from the authenticated user's `libraryEntries()` relation. The target game is resolved by its local slug; client-provided user IDs, entry IDs, and game IDs are not accepted as ownership input. An upsert updates the existing user/game row or creates one protected by the database's unique constraint.

Public game details expose only the current visitor's own status and favorite state. Guests receive no personal entry. The library is not a public profile.

**Remove from library** opens a confirmation dialog explaining that the entry's ratings, review, playthroughs, and diary entries will also be deleted. The delete endpoint additionally requires an accepted `confirm` value. Removing an entry keeps the catalog game and other players' entries. Changing a status is the way to retain history.

## Verification

`tests/Feature/LibraryTest.php` covers every status, repeated saves, field validation, ownership spoofing, private counts and filters, literal SQL wildcard searches, sorting and pagination, history preservation, confirmed removal, and production verification rules. Existing tests cover the local verification bypass.

Run SQLite tests with `php artisan test` or the isolated PostgreSQL suite with `powershell -ExecutionPolicy Bypass -File .\scripts\test-postgres.ps1`. Tests must never refresh the development database.

The next personal-experience features are half-star ratings and editable reviews, followed by playthroughs and diary sessions.
