# Playthroughs and private diary

Stage 4 now includes multiple playthroughs per collected game and a private diary of playing sessions. It uses the existing `playthroughs` and `diary_entries` tables.

## Workflow

1. Open a game and choose **Diary** in its action card to log a private session in a popup.
2. Select a playthrough or create one with an optional name/platform and Playing/Completed/Paused/Dropped status. Replays create separate records under the same library entry.
3. Enter a played date, optional minutes, and optional notes, then **Log session**. Use **View history** to open the full editor and manage optional start/finish dates. Several sessions on the same date are allowed.
4. Edit sessions from their cards. Expand **Playthrough details** to update the run's metadata or remove it after confirmation.
5. Open **Diary** in navigation to see all your sessions, search game titles, and filter an inclusive date range. The displayed count and recorded time follow these filters.

Library status, favorites, rating, and review remain independent. Starting, completing, pausing, or deleting a run does not automatically change the library status or add another rating vote. History writes update the library entry's timestamp for the personal dashboard.

## Quick diary popup

On game details, **Diary** opens a compact modal without navigating or saving anything on open. It loads the current player's playthrough choices through `GET /library/{game:slug}/diary` (authenticated, private/no-store, no session notes). Choose an existing run, or **New playthrough**, then enter the played date, optional minutes, and private notes. New runs accept a name, platform, and one of the four run statuses; unknown start/finish dates stay blank. Use **View history** for the full history editor. The navigation Diary menu still opens the complete diary timeline.

`POST /library/{game:slug}/diary` validates the session and, for new runs only, run metadata. It atomically adds a missing library entry, creates a run if needed, and logs the session, then redirects back to game details. Closing or cancelling the popup makes no database changes. Existing run dates are checked after locking; foreign and wrong-game run IDs return 404 and roll back. Library status, favorites, ratings, and reviews remain unchanged. Validation errors keep the modal open with the entered values. `GameDiaryTest` covers authentication, private options, atomic logging, ownership, validation, date bounds, and preservation of existing game history.

## Dates, platforms, and duration

- Calendar dates use `YYYY-MM-DD` and cannot be later than the application's current date. The server sends `today` to the forms, and dates are displayed without timezone shifts.
- Unknown start/finish dates can be blank. A known finish must be on or after a known start.
- Sessions must fall within known playthrough bounds. Changing run dates cannot exclude already recorded sessions. Both checks run after locking the current database records.
- New platform choices must belong to that game's catalog platforms. A historical run can retain its current platform when a later catalog update removes the association; this option remains available in its editor.
- Duration can be blank, zero, or an integer up to 1,440 minutes per session. Blank means unknown. Recorded-time totals sum supplied durations, and unknown durations remain visibly distinct on session cards.
- Session notes support up to 5,000 characters and render as escaped plain text. A date-only diary entry is valid.

## Private routes and ownership

| Route                                                          | Purpose                                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `GET/POST /library/{game:slug}/playthroughs`                   | List/create runs for an owned library entry                 |
| `GET/PUT/DELETE /playthroughs/{playthrough}`                   | Read/edit/remove an owned run                               |
| `POST /playthroughs/{playthrough}/sessions`                    | Log a session                                               |
| `PUT/DELETE /playthroughs/{playthrough}/sessions/{diaryEntry}` | Edit/remove a session within its owned run                  |
| `GET /diary`                                                   | Private timeline with `q`, `from`, `to`, and `page` filters |

Authentication and the existing verification middleware protect all routes; the configured local email bypass remains supported. Reads are scoped through the authenticated user's library. Writes lock the library entry and then its playthrough in a transaction, maintaining a consistent lock order with rating/review actions. Submitted ownership and parent IDs are excluded by validation, and session IDs must belong to the exact run in the URL.

Run forms submit the complete metadata representation: `label`, `platform_id`, `status`, `started_on`, and `finished_on`, including nullable fields. Session forms submit `logged_on`, `minutes_played`, and `notes`.

Run lists paginate ten at a time, sessions and the global diary twenty. Runs sort by recent updates; sessions sort by played date and ID descending. Searches treat SQL wildcard characters literally. Diary notes and playthroughs are never added to public game/review payloads.

## Removal and preservation

Delete actions require a confirmation dialog and an accepted `confirm` field. Deleting a session removes only that session. Deleting a playthrough cascades to its own sessions while keeping other runs, library state, rating, and review. Removing the parent library entry still cascades to all of its history, as explained in the existing library confirmation dialog.

## Verification and next stage

`tests/Feature/PlayerHistoryTest.php` covers all run statuses, replays, dates and bounds, valid/historical platforms, ownership attacks, nullable/zero durations, multiple sessions per date, edits and totals, private filtering, pagination, and confirmed deletion. Default tests use SQLite; `scripts/test-postgres.ps1` targets the isolated `playhaven_testing` database.

The next product stage is community features: custom game lists, player profiles, following, and an activity feed.

## Diary rows

`/diary` groups sessions by month and shows a calendar badge, day, compact game cover/title, release year, current personal rating, library favorite, additional-run indicator, review link, and edit link. The additional-run indicator means an earlier retained playthrough exists for the same library entry; it is not a separate stored replay flag. Duration and playthrough labels remain visible, and session notes can be expanded in each row. Smaller screens condense secondary columns into the game cell.

Search and inclusive From/To dates retain existing ownership checks, totals, and 20-row pagination. Edit links include the correct playthrough session page and anchor, even when the diary is filtered. Diary metadata is loaded from the authenticated user's entries; review bodies and provider IDs are not included. Ratings and favorites reflect the current library rather than historical snapshots. Unavailable art uses the shared cover fallback.
