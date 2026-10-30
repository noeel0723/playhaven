# Personal library

The first part of stage 4 provides an authenticated personal library, favorite games, and a dashboard backed by the player's actual collection. Library membership can be saved without a playing status; no external API requests are needed.

## Using the feature

1. Log in and open a game from `/games`.
2. Use the action card on the right to **Add to library**, or choose Playing, Completed, Paused, or Dropped. Favorite is independent of status. See [game actions](GAME_ACTIONS.md).
3. Each card action saves independently on the same page. Updating an entry preserves its local ID and related ratings, reviews, playthroughs, and diary.
4. Open `/library` to search titles, filter by status or favorite, sort by title or recent updates, and paginate the collection. Status counts always describe the full personal library, even while filters are active.
5. `/dashboard` shows counts by status, favorite count, and the six most recently updated entries. Follow a count to the matching library filter.

Status and favorite changes are saved together. Setting Completed does not automatically create a playthrough or rating; these remain separate domain records. Community ratings displayed on cards still come from PlayHaven's rating records.

## Ownership and removal

Library routes require authentication and the existing email-verification middleware. The local development bypass still applies; production continues to require email verification.

All reads, writes, counts, and deletion queries start from the authenticated user's `libraryEntries()` relation. The target game is resolved by its local slug; client-provided user IDs, entry IDs, and game IDs are not accepted as ownership input. An upsert updates the existing user/game row or creates one protected by the database's unique constraint.

Public game details expose only the current visitor's own status and favorite state. Guests receive no personal entry. The library is not a public profile. An active Public player profile shares current Playing, Paused, and Completed statuses with its followers through the personalized Community shelves; favorites, private reviews, diary, and the full library are not returned there. Status-change timestamps are separate from ordinary metadata edits.

**Remove from library** opens a confirmation dialog explaining that the entry's ratings, review, playthroughs, and diary entries will also be deleted. The delete endpoint additionally requires an accepted `confirm` value. Removing an entry keeps the catalog game and other players' entries. Changing a status is the way to retain history.

## Verification

`tests/Feature/LibraryTest.php` covers every status, repeated saves, field validation, ownership spoofing, private counts and filters, literal SQL wildcard searches, sorting and pagination, history preservation, confirmed removal, and production verification rules. Existing tests cover the local verification bypass.

Run SQLite tests with `php artisan test` or the isolated PostgreSQL suite with `powershell -ExecutionPolicy Bypass -File .\scripts\test-postgres.ps1`. Tests must never refresh the development database.

Half-star ratings, editable reviews, multiple playthroughs, and private diary sessions are implemented; see [ratings and reviews](RATINGS_REVIEWS.md) and [playing history](PLAYING_HISTORY.md). Personal ratings appear on library/dashboard cards. Community lists and profiles are the next stage.
