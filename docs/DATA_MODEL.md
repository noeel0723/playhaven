# PlayHaven domain and database

Stage 2 defines the storage model and Eloquent relationships. Game import, feature controllers, authorization policies, and product screens are implemented in later stages.

## Relationships

```mermaid
erDiagram
    users ||--o| user_profiles : has
    users ||--o{ library_entries : owns
    games ||--o{ library_entries : collected_in
    library_entries ||--o{ playthroughs : records
    playthroughs ||--o{ diary_entries : logs
    platforms o|--o{ playthroughs : played_on
    library_entries ||--o| ratings : rated
    library_entries ||--o| reviews : reviewed
    games ||--o{ game_genre : categorized
    genres ||--o{ game_genre : includes
    games ||--o{ game_platform : available
    platforms ||--o{ game_platform : supports
    users ||--o{ game_lists : curates
    game_lists ||--o{ game_list_items : contains
    games ||--o{ game_list_items : listed
    users ||--o{ follows : follower
    users ||--o{ follows : followed
```

## Catalog

| Table                         | Purpose and key rules                                                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `games`                       | Local primary key, unique slug, nullable unique RAWG and legacy IGDB IDs, name, summary/storyline, release date, RAWG cover URL, legacy cover ID, provider update and detail-sync timestamps |
| `genres`, `platforms`         | Local primary keys, unique slugs, nullable unique RAWG and legacy IGDB IDs                                                                                                                   |
| `game_genre`, `game_platform` | Many-to-many relationships with composite primary keys, preventing duplicate associations                                                                                                    |

Local foreign keys always reference local IDs, never provider IDs. This keeps player history independent of the external provider. Metadata can be resynchronized later without recreating a game row. RAWG metadata is imported through the explicit catalog command; no demo reviews are seeded.

## Player experience

| Table             | Purpose and key rules                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_profiles`   | Optional profile per user; username, display name, bio, avatar path. A unique index on `LOWER(username)` prevents case-only duplicates. Multiple unset usernames are allowed. |
| `library_entries` | One row per user/game. Status is `playing`, `completed`, `paused`, `dropped`, or `backlog`. Also stores favorite state.                                                       |
| `playthroughs`    | Multiple runs per library entry. Optional label and platform, status, start and finish dates. A run has no backlog status; finish date cannot precede a known start date.     |
| `diary_entries`   | Sessions attached to a playthrough, with log date, optional nonnegative minutes, and notes. Multiple sessions on the same day are valid.                                      |
| `ratings`         | At most one current rating per library entry. Integer `score` between 1 and 10; no row means unrated.                                                                         |
| `reviews`         | At most one current review per library entry. Nonblank body, spoiler flag, public/private flag. Editing updates the same row.                                                 |

Playthroughs, ratings, and reviews inherit their user and game through `library_entry_id`. Diary entries inherit them through their playthrough. There are no separate user/game columns that could contradict each other.

Library status and playthrough status are independent. Starting a replay does not overwrite the completion state or rating of a previous run. Future feature actions should decide when to change the user's library status explicitly.

Ratings describe a player's overall opinion of a game. Replaying a game does not add another vote to community averages. A review and a rating can exist independently. A player may review/rate a game without marking it completed.

```php
$rating = new Rating(['library_entry_id' => $entry->id]);
$rating->setStars(4.5)->save(); // score = 9
$rating->stars;               // 4.5
```

`setStars()` rejects out-of-range values, fractions other than half stars, and non-finite numbers. Database constraints also protect stored values when writes bypass Eloquent.

## Community foundation

| Table             | Purpose and key rules                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `game_lists`      | User-owned lists with name, owner-scoped unique slug, description, visibility (`public`, `unlisted`, `private`)                                 |
| `game_list_items` | A game appears at most once per list; positive position and optional notes. Items sort by position then ID for deterministic ordering.          |
| `follows`         | Directed follower/followed pairs; duplicate pairs and self-following are rejected. Both relationships cascade when the related user is deleted. |

List positions can have gaps or ties; they do not need to be consecutive. Reordering and visibility enforcement belong to the later feature/action layer. An unlisted list is intended for direct-link access; private lists are intended for their owners. These flags do not themselves implement access control, and no feature endpoints have been exposed yet.

## Ownership, deletion, and indexing

- Deleting a user cascades to their profile, library, dependent playthrough/diary/rating/review records, lists/items, and follows.
- Deleting a library entry cascades to its player history. Future UI actions must treat removing a library entry as a destructive action with history consequences; changing status should update the existing entry.
- A game referenced by a library entry or list item is protected by a restrictive foreign key. Catalog synchronization should update records and avoid deleting referenced games.
- Deleting a genre/platform removes its catalog associations. A deleted platform clears the optional playthrough platform reference while preserving the run.
- Indexes support user/status library filters, game lookups, diary/playthrough chronology, list ordering, and both directions of following.
- New timestamp columns use timezone-aware types on PostgreSQL. Release dates, run dates, and diary dates are calendar dates rather than instants.

## Verification and local workflow

The three new migrations are additive to the existing authentication schema. Default tests use SQLite in memory. To run the complete suite against PostgreSQL in isolation:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-postgres.ps1
```

This script creates/uses **`playhaven_testing`**, clears cached configuration, verifies Laravel selects the test database, and restores process environment variables afterward. Test tables are disposable. Development database **`playhaven`** is kept separate.

Factories cover all 12 domain models. Tests exercise constraints, rating conversion, repeat playthroughs, inherited ownership, aggregate cardinality, deletion behavior, catalog relationships, list ordering, and directed follows. CI is configured to run the full suite against both PostgreSQL and SQLite.

## Next implementation stage

The catalog importer and public discovery pages are implemented; see [catalog workflow](CATALOG.md). Next, introduce scoped user actions, authorization, and validation for library statuses, ratings, reviews, diary entries, and repeat playthroughs.
