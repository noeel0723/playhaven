# Game diary and playing history

## Game diary workflow

**Diary** on game details opens a compact popup without leaving the page. It loads only the signed-in player's current Library status, completion date, and current review. Opening or cancelling the popup does not save anything.

1. Choose **Playing**, **Completed**, **Paused**, or **Dropped** and the log date.
2. When Completed is selected, enter **Completed on**. The completion date cannot be later than the log date or today.
3. Choose an optional half-star rating and write or update the game review. The stars are selected locally until **Save game log**; cancelling makes no changes. Review visibility is explicit: a new review starts Private, while an existing review retains its current visibility. Spoilers are collapsed when displayed.
4. **Save game log** updates the current Library status, completion date, and rating, saves a nonblank review to the game's existing review record, and appends a private status/review snapshot to the diary in one transaction. The rating uses the same current record shown in the game action card, Library, and community average, so saving returns the updated stars immediately. **Clear rating** removes that rating when the log is saved; omitted rating fields preserve existing ratings.

A missing Library entry is created automatically. Favorites, existing playthroughs, session notes, and recorded playing time are preserved. Leaving the review blank preserves an existing canonical game review and creates a log without review text. Use the separate review editor to delete a review.

Diary logs are private regardless of review visibility. Selecting Public publishes the current review through the normal game/community review features; it does not publish the private log. Later edits to the canonical review or Library status do not rewrite earlier log snapshots. A displayed rating is the current personal rating, not a historical rating.

## Diary page

Navigation **Diary** opens /diary: a private, compact timeline of status logs, completion dates, and review snapshots. Search game titles or filter by status and an inclusive From/To log-date range. Logs sort by date and ID descending and paginate twenty per page. SQL wildcard characters in searches are treated literally.

**New log** beside an existing game opens the same popup and returns to Diary after saving. To log another game, open it from Library or game discovery. New log appends history; it does not edit the selected historical record.

**Delete log** requires confirmation and removes only that snapshot. It does not revert Library status or remove the current game review, ratings, playthroughs, or sessions. Removing the parent Library entry cascades to its diary logs, as with its other dependent history.

The additive game_diary_logs table stores library_entry_id, logged_on, status, optional completed_on, optional review_body, spoiler flag, and timestamps. User and game ownership are inherited through the Library entry. No old logs or completion dates are fabricated during migration.

| Route                             | Purpose                                                   |
| --------------------------------- | --------------------------------------------------------- |
| GET /library/{game:slug}/diary    | Private current values for the popup; no writes           |
| POST /library/{game:slug}/diary   | Atomically update current game state and append a log     |
| GET /diary                        | Private status/review timeline; q, status, from, to, page |
| DELETE /diary/logs/{gameDiaryLog} | Confirmed owner-only snapshot removal                     |
| GET /diary/sessions               | Existing private playing-session timeline                 |

All routes require authentication and the existing verification policy. Popup options and timeline responses use private/no-store headers. Validation runs before writes. Writes lock the Library entry before dependent records, and ownership comes from the authenticated user rather than submitted IDs.

## Existing playthroughs and sessions

**Playing sessions** in the Diary header opens /diary/sessions. Existing records remain in playthroughs and diary_entries with their original relationships. The timeline retains its compact month/day layout, game art, current rating/favorite, replay indicator, review/edit links, expandable notes, filters, recorded-time totals, and twenty-row pagination.

**Playing history** in a collected game's action card opens its playthrough editor. These editors continue to support multiple playthroughs per Library entry, optional run names/platforms, run start/finish dates, and individual session dates, minutes, and notes:

| Route                                                        | Purpose                       |
| ------------------------------------------------------------ | ----------------------------- |
| GET/POST /library/{game:slug}/playthroughs                   | List/create runs              |
| GET/PUT/DELETE /playthroughs/{playthrough}                   | Read/edit/remove an owned run |
| POST /playthroughs/{playthrough}/sessions                    | Log a playing session         |
| PUT/DELETE /playthroughs/{playthrough}/sessions/{diaryEntry} | Edit/remove an owned session  |

Run status is separate from overall Library status. Editing a run or playing session does not change the Library status, rating, or canonical review. Calendar dates cannot be future dates; sessions must fall within known run bounds, and run-date changes cannot exclude existing sessions. Finish dates cannot precede known start dates.

Platform choices must belong to the game, with existing historical associations retained when metadata changes. Session duration may be unknown, zero, or an integer up to 1,440 minutes. Notes accept up to 5,000 characters and render as escaped text. Multiple sessions on one day remain valid.

Statistics for playing time, active days, and playthroughs continue to use these session records. New status logs do not invent duration or sessions. Library status statistics reflect the current status saved from Diary.

## Verification

GameDiaryTest covers private options, status/completion/review saves, snapshots, validation, ownership, pagination, literal searches, and deletion/preservation. PlayerHistoryTest and ProfileLocationDiaryTest retain coverage for the legacy session timeline and editors. Default tests use SQLite in memory. scripts/test-postgres.ps1 verifies the isolated playhaven_testing database before running tests on PostgreSQL; the development playhaven database is never refreshed.
