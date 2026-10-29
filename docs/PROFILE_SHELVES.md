# Top 4 and recent completion shelves

The public player profile uses a main column with two four-cover shelves, thin section dividers, and a sidebar for public review/list counts and public lists. The editorial layout follows the supplied reference while retaining PlayHaven's palette, typography, game artwork, and components. On narrow screens the sidebar stacks below the main column and both shelves keep four covers per row.

## Choose Top 4 games

Open **Your player profile**, save the basic profile if needed, then use **Your profile shelves**:

1. Search the local catalog by game title. Each search returns at most 12 results and makes no RAWG API request.
2. Add up to four distinct games. They do not need to be in the player's library. Import missing games through the existing catalog workflow first.
3. Move picks left/right or remove them using labeled buttons, then choose **Save profile shelves**. Searching keeps the current unsaved picks.

Picks appear in their saved order on a public profile. They are independent of library favorite flags and do not create or modify library entries, ratings, reviews, or diary history. Empty slots remain honest placeholders. Saving an empty array clears the shelf.

`profile_game_favorites` has a profile/game composite primary key, a unique profile/position pair, and a database check limiting positions to 1–4. The update locks the authenticated user's profile and replaces its ordered picks in a transaction. The request validates local game IDs, distinctness, list shape, and the four-game limit. User/profile IDs supplied by the client cannot select another owner's shelf.

## Share recent completions

**Show my recent completed games** is off by default for existing and new profiles. Turning it on explicitly shares at most four currently Completed library games, their personal ratings, and known completion timestamps. The public profile itself must also be active. Turning either setting off removes those entries from subsequent public responses.

`library_entries.completed_at` records the transition into Completed, independently of the ordinary `updated_at` timestamp. Rating, review, favorite, and diary edits do not make an old completion recent. Leaving Completed clears the timestamp; marking the game Completed again records the new transition. Separate playthrough history is unchanged, and repeated playthroughs do not add duplicate cards to this shelf.

Existing completed entries retain a null completion date; migration and unrelated edits do not invent a historical date. Known completion times sort newest first, followed by undated entries with a deterministic ID tie-break. Undated cards say **Date not recorded**. No automatic backfill rewrites the user's history.

The completion resource exposes only `game`, `rating`, and `completed_at`. It excludes library IDs, favorite flags, private reviews, diary text, session durations, and other statuses. This shelf does not publish activity into the community feed, which continues to contain eligible public reviews.

## Verification

`PlayerShowcaseTest` covers ordered picks, reordering/clearing, ownership, validation, atomic writes, opt-in privacy, completion ordering and transitions, undated legacy entries, private data filtering, local search, account-deletion cascades, and preserved player history on SQLite and isolated PostgreSQL. Browser checks use an isolated temporary local account to exercise real search/add/remove/reorder/save forms, reloads, publication revocation, desktop sidebar placement, and four-cover rows at 390px and 320px.
